import {useCallback, useMemo, useState} from 'react';

import {
  EQUIPMENT_BY_SECTION,
  INITIAL_SECTIONS,
  getSectionPrefix,
} from './equipmentCatalog';
import type {
  Equipamento,
  EquipamentoSelecionado,
  RelatorioPatrimonio,
  SecaoPatrimonio,
  TipoSecao,
  TipoServico,
} from './models';
import {savePatrimonioReport} from './patrimonioReportService';

interface UsePatrimonioFormReturn {
  selectedType: TipoSecao | null;
  selectedItems: EquipamentoSelecionado[];
  selectedSection: string | null;
  sections: SecaoPatrimonio[];
  newMachineLetter: string;
  visibleSections: SecaoPatrimonio[];
  setNewMachineLetter: (value: string) => void;
  setSelectedSection: (
    value: string | null,
  ) => void;
  toggleType: (type: TipoSecao) => void;
  updateItem: (
    itemName: string,
    value: string,
    sectionTitle: string,
    option?: string | null,
  ) => void;
  addItemToSelectedSection: (
    item: Equipamento,
  ) => boolean;
  addMachine: () => boolean;
  deleteSection: (sectionTitle: string) => void;
}

export default function usePatrimonioForm(
  filial: string,
  serviceType: TipoServico,
): UsePatrimonioFormReturn {
  const [selectedType, setSelectedType] =
    useState<TipoSecao | null>(null);
  const [selectedItems, setSelectedItems] =
    useState<EquipamentoSelecionado[]>([]);
  const [selectedSection, setSelectedSection] =
    useState<string | null>(null);
  const [newMachineLetter, setNewMachineLetter] =
    useState('');
  const [sections, setSections] =
    useState<SecaoPatrimonio[]>(
      INITIAL_SECTIONS,
    );
  const [report, setReport] =
    useState<RelatorioPatrimonio>({
      categoria: serviceType,
      filial,
      secoes: {},
    });

  const visibleSections = useMemo(() => {
    if (!selectedType) return [];

    const prefix =
      getSectionPrefix(selectedType);

    return sections.filter(section =>
      section.title.startsWith(prefix),
    );
  }, [sections, selectedType]);

  const toggleType = useCallback(
    (type: TipoSecao): void => {
      setSelectedType(current =>
        current === type ? null : type,
      );
    },
    [],
  );

  const updateItem = useCallback(
    (
      itemName: string,
      value: string,
      sectionTitle: string,
      option?: string | null,
    ): void => {
      setReport(current => {
        const updatedReport: RelatorioPatrimonio = {
          ...current,
          secoes: {
            ...current.secoes,
            [sectionTitle]: {
              ...current.secoes[sectionTitle],
              [itemName]: option
                ? `${value} (${option})`
                : value,
            },
          },
        };

        void savePatrimonioReport(
          updatedReport,
        ).catch(error => {
          console.error(
            'Erro ao salvar relatório de patrimônio:',
            error,
          );
        });

        return updatedReport;
      });
    },
    [],
  );

  const addItemToSelectedSection =
    useCallback(
      (item: Equipamento): boolean => {
        if (!selectedSection) return false;

        const section = sections.find(
          current =>
            current.title === selectedSection,
        );

        if (!section) return false;

        const alreadyExists =
          section.items.some(
            current =>
              current.label === item.label,
          ) ||
          selectedItems.some(
            current =>
              current.label === item.label &&
              current.section ===
                selectedSection,
          );

        if (alreadyExists) return false;

        setSelectedItems(current => [
          ...current,
          {
            ...item,
            section: selectedSection,
          },
        ]);

        return true;
      },
      [
        sections,
        selectedItems,
        selectedSection,
      ],
    );

  const addMachine =
    useCallback((): boolean => {
      if (!selectedType) return false;

      const letter =
        newMachineLetter.trim();

      if (!/^[A-Za-z]$/.test(letter)) {
        return false;
      }

      const title = `${getSectionPrefix(
        selectedType,
      )} ${letter.toUpperCase()}`;

      if (
        sections.some(
          section => section.title === title,
        )
      ) {
        return false;
      }

      setSections(current => [
        ...current,
        {
          title,
          items: [
            ...EQUIPMENT_BY_SECTION[
              selectedType
            ],
          ],
        },
      ]);
      setNewMachineLetter('');

      return true;
    }, [
      newMachineLetter,
      sections,
      selectedType,
    ]);

  const deleteSection = useCallback(
    (sectionTitle: string): void => {
      setSections(current =>
        current.filter(
          section =>
            section.title !== sectionTitle,
        ),
      );
      setSelectedItems(current =>
        current.filter(
          item =>
            item.section !== sectionTitle,
        ),
      );
    },
    [],
  );

  return {
    selectedType,
    selectedItems,
    selectedSection,
    sections,
    newMachineLetter,
    visibleSections,
    setNewMachineLetter,
    setSelectedSection,
    toggleType,
    updateItem,
    addItemToSelectedSection,
    addMachine,
    deleteSection,
  };
}

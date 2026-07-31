import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {appLogger} from '../../../shared/logging/appLogger';
import {
  EQUIPMENT_BY_SECTION,
  INITIAL_SECTIONS,
  getSectionPrefix,
} from '../data/equipmentCatalog';
import createPatrimonioReport from '../domain/createPatrimonioReport';
import type {
  CampoPatrimonio,
  CamposPorSecao,
  Equipamento,
  EquipamentoSelecionado,
  SecaoPatrimonio,
  TipoSecao,
  TipoServico,
} from '../models/Patrimonio';
import {
  flushPatrimonioReportSave,
  schedulePatrimonioReportSave,
} from '../services/patrimonioReportService';

interface UsePatrimonioFormReturn {
  selectedType: TipoSecao;
  selectedItemsBySection: Record<string, EquipamentoSelecionado[]>;
  visibleSections: SecaoPatrimonio[];
  fields: CamposPorSecao;
  hasReportData: boolean;
  selectType: (type: TipoSecao) => void;
  updateItem: (
    sectionTitle: string,
    itemName: string,
    field: CampoPatrimonio,
  ) => void;
  addItem: (sectionTitle: string, item: Equipamento) => boolean;
  addSection: (letter: string) => boolean;
  deleteSection: (sectionTitle: string) => void;
}

const cloneInitialSections = (): SecaoPatrimonio[] =>
  INITIAL_SECTIONS.map(section => ({...section, items: [...section.items]}));

/**
 * Centraliza o estado editável do registro. Os componentes apenas exibem os
 * valores recebidos, portanto trocar de ambiente não apaga o que foi digitado.
 */
export default function usePatrimonioForm(
  filial: string,
  serviceType: TipoServico,
): UsePatrimonioFormReturn {
  const [selectedType, setSelectedType] = useState<TipoSecao>('CAIXA');
  const [selectedItems, setSelectedItems] = useState<EquipamentoSelecionado[]>([]);
  const [sections, setSections] = useState<SecaoPatrimonio[]>(cloneInitialSections);
  const [fields, setFields] = useState<CamposPorSecao>({});
  const fieldsRef = useRef<CamposPorSecao>({});

  const persist = useCallback(
    (nextFields: CamposPorSecao): void => {
      schedulePatrimonioReportSave(
        createPatrimonioReport({filial, serviceType, fields: nextFields}),
      );
    },
    [filial, serviceType],
  );

  useEffect(() => {
    fieldsRef.current = {};
    setFields({});
    setSections(cloneInitialSections());
    setSelectedItems([]);
    setSelectedType('CAIXA');
    persist({});

    return () => {
      void flushPatrimonioReportSave().catch(error => {
        appLogger.error('Erro ao finalizar relatório de patrimônio:', error);
      });
    };
  }, [persist]);

  const visibleSections = useMemo(() => {
    const prefix = getSectionPrefix(selectedType);
    return sections.filter(section => section.title.startsWith(prefix));
  }, [sections, selectedType]);

  const selectedItemsBySection = useMemo(
    () =>
      selectedItems.reduce<Record<string, EquipamentoSelecionado[]>>(
        (groupedItems, item) => {
          const sectionItems =
            groupedItems[item.section] ??
            (groupedItems[item.section] = []);
          sectionItems.push(item);
          return groupedItems;
        },
        {},
      ),
    [selectedItems],
  );

  const hasReportData = useMemo(
    () =>
      Object.values(fields).some(sectionFields =>
        Object.values(sectionFields).some(field => field.patrimonio.trim().length > 0),
      ),
    [fields],
  );

  const updateItem = useCallback(
    (sectionTitle: string, itemName: string, field: CampoPatrimonio): void => {
      const nextFields = {
        ...fieldsRef.current,
        [sectionTitle]: {
          ...fieldsRef.current[sectionTitle],
          [itemName]: field,
        },
      };

      fieldsRef.current = nextFields;
      setFields(nextFields);
      persist(nextFields);
    },
    [persist],
  );

  const addItem = useCallback(
    (sectionTitle: string, item: Equipamento): boolean => {
      const section = sections.find(current => current.title === sectionTitle);
      if (!section) return false;

      const alreadyExists =
        section.items.some(current => current.label === item.label) ||
        selectedItems.some(
          current => current.label === item.label && current.section === sectionTitle,
        );

      if (alreadyExists) return false;

      setSelectedItems(current => [...current, {...item, section: sectionTitle}]);
      return true;
    },
    [sections, selectedItems],
  );

  const addSection = useCallback(
    (letterInput: string): boolean => {
      const letter = letterInput.trim().toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return false;

      const title = `${getSectionPrefix(selectedType)} ${letter}`;
      if (sections.some(section => section.title === title)) return false;

      setSections(current => [
        ...current,
        {title, items: [...EQUIPMENT_BY_SECTION[selectedType]]},
      ]);
      return true;
    },
    [sections, selectedType],
  );

  const deleteSection = useCallback(
    (sectionTitle: string): void => {
      setSections(current => current.filter(section => section.title !== sectionTitle));
      setSelectedItems(current => current.filter(item => item.section !== sectionTitle));

      const {[sectionTitle]: _removed, ...remainingFields} = fieldsRef.current;
      fieldsRef.current = remainingFields;
      setFields(remainingFields);
      persist(remainingFields);
    },
    [persist],
  );

  return {
    selectedType,
    selectedItemsBySection,
    visibleSections,
    fields,
    hasReportData,
    selectType: setSelectedType,
    updateItem,
    addItem,
    addSection,
    deleteSection,
  };
}

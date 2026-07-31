import {
  type RouteProp,
  useRoute,
} from '@react-navigation/native';
import React, {useCallback, useState} from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import {Button, Dialog, Portal} from 'react-native-paper';
import Toast from 'react-native-toast-message';

import {useAppTheme} from '../../../core/theme/appTheme';
import {appLogger} from '../../../shared/logging/appLogger';
import AddSectionSheet from '../components/AddSectionSheet';
import EquipmentSection from '../components/EquipmentSection';
import PatrimonioScannerModal from '../components/PatrimonioScannerModal';
import SelectionSheet, {
  type SelectionOption,
} from '../components/SelectionSheet';
import {
  ALL_EQUIPMENT,
  SECTION_LABELS,
} from '../data/equipmentCatalog';
import usePatrimonioForm from '../hooks/usePatrimonioForm';
import type {
  CampoPatrimonio,
  Equipamento,
  EquipamentoSelecionado,
  TipoSecao,
  TipoServico,
} from '../models/Patrimonio';
import {
  getWhatsAppUnavailableMessage,
  sharePatrimonioReport,
} from '../services/patrimonioReportService';
import styles from './patrimonioFormScreen.styles';

type PatrimonioRoutes = {
  Patrimonio: {
    filial: string;
    option: TipoServico;
  };
};

const SECTION_TYPES: TipoSecao[] = [
  'CAIXA',
  'BALCAO',
  'SERVIDOR',
  'GERENTE',
  'CLINICA',
  'RACK',
];

const SERVICE_LABELS: Record<TipoServico, string> = {
  PREVENTIVA: 'Preventiva',
  MONTAGEM: 'Montagem',
  INCLUSÃO: 'Inclusão',
  REFORMA: 'Reforma',
  TROCA: 'Troca',
};

const EQUIPMENT_OPTIONS: SelectionOption[] = ALL_EQUIPMENT.map(item => ({
  value: item.label,
  label: item.label.replace(/:$/, ''),
}));

interface FieldTarget {
  sectionTitle: string;
  item: Equipamento;
  field: CampoPatrimonio;
}

const EMPTY_SELECTED_ITEMS: EquipamentoSelecionado[] = [];
const EMPTY_SECTION_FIELDS: Record<string, CampoPatrimonio> = {};

/**
 * Coordena o registro dos equipamentos por ambiente e posição. Todo seletor é
 * renderizado pelo aplicativo para manter o mesmo resultado nos dois temas.
 */
export default function PatrimonioFormScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {params} = useRoute<RouteProp<PatrimonioRoutes, 'Patrimonio'>>();
  const [equipmentSection, setEquipmentSection] = useState<string | null>(null);
  const [modelTarget, setModelTarget] = useState<FieldTarget | null>(null);
  const [scanTarget, setScanTarget] = useState<FieldTarget | null>(null);
  const [addSectionVisible, setAddSectionVisible] = useState(false);
  const [sectionPendingDelete, setSectionPendingDelete] = useState<string | null>(null);

  const {
    selectedType,
    selectedItemsBySection,
    visibleSections,
    fields,
    hasReportData,
    selectType,
    updateItem,
    addItem,
    addSection,
    deleteSection,
  } = usePatrimonioForm(params.filial, params.option);

  const deletePendingSection = useCallback((): void => {
    if (!sectionPendingDelete) return;

    deleteSection(sectionPendingDelete);
    setSectionPendingDelete(null);
  }, [deleteSection, sectionPendingDelete]);

  const selectEquipment = useCallback((value: string): void => {
    if (!equipmentSection) return;

    const item = ALL_EQUIPMENT.find(equipment => equipment.label === value);
    if (!item) return;

    if (!addItem(equipmentSection, item)) {
      Toast.show({
        type: 'info',
        text1: 'Equipamento já incluído',
        text2: 'Este item já faz parte da posição selecionada.',
      });
      return;
    }

    setEquipmentSection(null);
  }, [addItem, equipmentSection]);

  const openEquipmentSelection = useCallback((sectionTitle: string): void => {
    setEquipmentSection(sectionTitle);
  }, []);

  const requestSectionDelete = useCallback((sectionTitle: string): void => {
    setSectionPendingDelete(sectionTitle);
  }, []);

  const openModelSelection = useCallback((
    sectionTitle: string,
    item: Equipamento,
    field: CampoPatrimonio,
  ): void => {
    setModelTarget({sectionTitle, item, field});
  }, []);

  const openScanner = useCallback((
    sectionTitle: string,
    item: Equipamento,
    field: CampoPatrimonio,
  ): void => {
    setScanTarget({sectionTitle, item, field});
  }, []);

  const closeScanner = useCallback((): void => {
    setScanTarget(null);
  }, []);

  const selectModel = useCallback((value: string): void => {
    if (!modelTarget) return;

    updateItem(modelTarget.sectionTitle, modelTarget.item.label, {
      ...modelTarget.field,
      option: value,
    });
    setModelTarget(null);
  }, [modelTarget, updateItem]);

  const applyScannedPatrimonio = useCallback((patrimonio: string): void => {
    if (!scanTarget) return;

    updateItem(scanTarget.sectionTitle, scanTarget.item.label, {
      ...scanTarget.field,
      patrimonio,
    });
  }, [scanTarget, updateItem]);

  const sendReport = async (): Promise<void> => {
    if (!hasReportData) return;

    try {
      const sent = await sharePatrimonioReport();
      if (!sent) {
        Toast.show({
          type: 'error',
          text1: 'Não foi possível enviar',
          text2: getWhatsAppUnavailableMessage(),
        });
      }
    } catch (error: unknown) {
      appLogger.error('Erro ao compartilhar patrimônio:', error);
      Toast.show({
        type: 'error',
        text1: 'Não foi possível enviar',
        text2: 'Tente preparar o relatório novamente.',
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.summary,
          {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: theme.colors.onSurfaceVariant}]}>
            Serviço
          </Text>
          <Text style={[styles.summaryValue, {color: theme.colors.onSurface}]}>
            {SERVICE_LABELS[params.option]}
          </Text>
        </View>

        <View style={[styles.summaryDivider, {backgroundColor: theme.colors.outline}]} />

        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, {color: theme.colors.onSurfaceVariant}]}>
            Filial
          </Text>
          <Text style={[styles.summaryValue, {color: theme.colors.onSurface}]}>
            {params.filial}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, {color: theme.colors.onBackground}]}>Equipamentos</Text>
      <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
        Escolha o ambiente e informe o patrimônio de cada equipamento.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeList}
        contentContainerStyle={styles.typeListContent}
      >
        {SECTION_TYPES.map(type => {
          const selected = selectedType === type;

          return (
            <TouchableOpacity
              key={type}
              accessibilityRole="button"
              accessibilityState={{selected}}
              activeOpacity={0.75}
              style={[
                styles.typeButton,
                {
                  backgroundColor: selected
                    ? theme.colors.primarySoft
                    : theme.colors.surface,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.outline,
                },
              ]}
              onPress={() => selectType(type)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {color: selected ? theme.colors.primary : theme.colors.onSurface},
                ]}
              >
                {SECTION_LABELS[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {visibleSections.length > 0 ? (
        visibleSections.map(section => (
          <EquipmentSection
            key={section.title}
            title={section.title}
            items={section.items}
            selectedItems={
              selectedItemsBySection[section.title] ?? EMPTY_SELECTED_ITEMS
            }
            fields={fields[section.title] ?? EMPTY_SECTION_FIELDS}
            onAddItem={openEquipmentSelection}
            onDelete={requestSectionDelete}
            onUpdateItem={updateItem}
            onRequestModel={openModelSelection}
            onRequestScan={openScanner}
          />
        ))
      ) : (
        <View
          style={[
            styles.emptyState,
            {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
          ]}
        >
          <Text style={[styles.emptyTitle, {color: theme.colors.onSurface}]}>
            Nenhuma posição neste ambiente
          </Text>
          <Text style={[styles.emptyDescription, {color: theme.colors.onSurfaceVariant}]}>
            Adicione uma posição para continuar o registro.
          </Text>
        </View>
      )}

      <Button
        mode="outlined"
        textColor={theme.colors.primary}
        style={styles.addSectionButton}
        contentStyle={styles.addSectionButtonContent}
        onPress={() => setAddSectionVisible(true)}
      >
        Adicionar posição
      </Button>

      <View style={[styles.divider, {backgroundColor: theme.colors.outline}]} />

      <Button
        mode="contained"
        disabled={!hasReportData}
        buttonColor={theme.colors.actionBackground}
        textColor={theme.colors.actionForeground}
        style={styles.sendButton}
        contentStyle={styles.sendButtonContent}
        onPress={() => void sendReport()}
      >
        Enviar relatório
      </Button>

      {!hasReportData ? (
        <Text style={[styles.sendHint, {color: theme.colors.onSurfaceVariant}]}>
          Informe ao menos um patrimônio para habilitar o envio.
        </Text>
      ) : null}

      <SelectionSheet
        visible={modelTarget !== null}
        title={
          modelTarget
            ? `Modelo de ${modelTarget.item.label.replace(/:$/, '')}`
            : 'Selecionar modelo'
        }
        description="Selecione o modelo instalado nesta posição."
        options={modelTarget?.item.options ?? []}
        value={modelTarget?.field.option}
        onSelect={selectModel}
        onDismiss={() => setModelTarget(null)}
      />

      <SelectionSheet
        visible={equipmentSection !== null}
        title="Adicionar equipamento"
        description={
          equipmentSection
            ? `Selecione o equipamento que será incluído em ${equipmentSection}.`
            : undefined
        }
        options={EQUIPMENT_OPTIONS}
        onSelect={selectEquipment}
        onDismiss={() => setEquipmentSection(null)}
      />

      <PatrimonioScannerModal
        visible={scanTarget !== null}
        onDismiss={closeScanner}
        onRead={applyScannedPatrimonio}
      />

      <AddSectionSheet
        visible={addSectionVisible}
        environmentLabel={SECTION_LABELS[selectedType]}
        onDismiss={() => setAddSectionVisible(false)}
        onSubmit={addSection}
      />

      <Portal>
        <Dialog
          visible={sectionPendingDelete !== null}
          onDismiss={() => setSectionPendingDelete(null)}
          style={{backgroundColor: theme.colors.surface}}
        >
          <Dialog.Title>Excluir posição</Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.dialogText, {color: theme.colors.onSurfaceVariant}]}>
              {sectionPendingDelete
                ? `Deseja remover ${sectionPendingDelete} deste relatório?`
                : ''}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSectionPendingDelete(null)}>Cancelar</Button>
            <Button textColor={theme.colors.error} onPress={deletePendingSection}>
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

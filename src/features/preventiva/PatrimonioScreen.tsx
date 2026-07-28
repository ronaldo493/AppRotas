import {
  type RouteProp,
  useRoute,
} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  Alert,
  Button,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {useAppTheme} from '../../core/theme/appTheme';
import {ALL_EQUIPMENT} from './equipmentCatalog';
import EquipmentModal from './EquipmentModal';
import EquipmentSection from './EquipmentSection';
import type {
  TipoSecao,
  TipoServico,
} from './models';
import {
  getWhatsAppUnavailableMessage,
  sharePatrimonioReport,
} from './patrimonioReportService';
import styles from './preventiva.styles';
import usePatrimonioForm from './usePatrimonioForm';

type PreventiveRoutes = {
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

export default function PatrimonioScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {params} =
    useRoute<
      RouteProp<PreventiveRoutes, 'Patrimonio'>
    >();
  const [modalVisible, setModalVisible] =
    useState(false);

  const {
    selectedType,
    selectedItems,
    selectedSection,
    newMachineLetter,
    visibleSections,
    setNewMachineLetter,
    setSelectedSection,
    toggleType,
    updateItem,
    addItemToSelectedSection,
    addMachine,
    deleteSection,
  } = usePatrimonioForm(
    params.filial,
    params.option,
  );

  const confirmDelete = (
    sectionTitle: string,
  ): void => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja excluir a seção ${sectionTitle}?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () =>
            deleteSection(sectionTitle),
        },
      ],
    );
  };

  const handleAddMachine = (): void => {
    if (!addMachine()) {
      Alert.alert(
        'Atenção',
        'Informe uma letra válida e ainda não utilizada.',
      );
      return;
    }

    setModalVisible(false);
  };

  const sendReport = async (): Promise<void> => {
    try {
      const sent =
        await sharePatrimonioReport();

      if (!sent) {
        Alert.alert(
          'Não foi possível enviar',
          getWhatsAppUnavailableMessage(),
        );
      }
    } catch (error: unknown) {
      console.error(
        'Erro ao compartilhar patrimônio:',
        error,
      );

      Alert.alert(
        'Erro',
        'Não foi possível preparar o relatório.',
      );
    }
  };

  return (
    <ScrollView
      style={{
        backgroundColor:
          theme.colors.background,
      }}
      contentContainerStyle={
        styles.reportContent
      }
    >
      <Text
        style={[
          styles.title,
          {color: theme.colors.onBackground},
        ]}
      >
        {params.option}
      </Text>

      <Text
        style={[
          styles.storeText,
          {color: theme.colors.onBackground},
        ]}
      >
        FILIAL: {params.filial}
      </Text>

      {SECTION_TYPES.map(sectionType => (
        <View key={sectionType}>
          <TouchableOpacity
            style={[
              styles.sectionTypeButton,
              {
                backgroundColor:
                  selectedType === sectionType
                    ? theme.colors.primary
                    : theme.colors
                        .surfaceVariant,
                opacity:
                  selectedType &&
                  selectedType !== sectionType
                    ? 0.45
                    : 1,
              },
            ]}
            onPress={() =>
              toggleType(sectionType)
            }
          >
            <Text
              style={[
                styles.sectionTypeText,
                {
                  color:
                    selectedType ===
                    sectionType
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                },
              ]}
            >
              {sectionType}
            </Text>
          </TouchableOpacity>

          {selectedType === sectionType && (
            <>
              {visibleSections.map(section => (
                <EquipmentSection
                  key={section.title}
                  title={section.title}
                  items={section.items}
                  selectedItems={selectedItems.filter(
                    item =>
                      item.section ===
                      section.title,
                  )}
                  onAddItem={() => {
                    setSelectedSection(
                      section.title,
                    );
                    setModalVisible(true);
                  }}
                  onDelete={() =>
                    confirmDelete(section.title)
                  }
                  onUpdateItem={(
                    label,
                    value,
                    option,
                  ) =>
                    updateItem(
                      label,
                      value,
                      section.title,
                      option,
                    )
                  }
                />
              ))}

              <View style={styles.actionSpacing}>
                <Button
                  title="Adicionar nova máquina"
                  color={theme.colors.primary}
                  onPress={() => {
                    setSelectedSection(null);
                    setModalVisible(true);
                  }}
                />
              </View>
            </>
          )}
        </View>
      ))}

      <View style={styles.sendButton}>
        <Button
          title="ENVIAR"
          color={theme.colors.primary}
          onPress={() => {
            void sendReport();
          }}
        />
      </View>

      <EquipmentModal
        visible={modalVisible}
        mode={
          selectedSection
            ? 'item'
            : 'machine'
        }
        items={ALL_EQUIPMENT}
        newMachineLetter={newMachineLetter}
        onClose={() => setModalVisible(false)}
        onSelectItem={item => {
          if (
            !addItemToSelectedSection(item)
          ) {
            Alert.alert(
              'Atenção',
              'Este item já está na seção.',
            );
          }
        }}
        onAddMachine={handleAddMachine}
        onMachineLetterChange={
          setNewMachineLetter
        }
      />
    </ScrollView>
  );
}

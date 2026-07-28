import {
  type NavigationProp,
  useNavigation,
} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {useAppTheme} from '../../core/theme/appTheme';
import Checklist from './Checklist';
import type {TipoServico} from './models';
import styles from './preventiva.styles';

type PreventiveNavigation = {
  Patrimonio: {
    filial: string;
    option: TipoServico;
  };
};

const SERVICE_TYPES: TipoServico[] = [
  'PREVENTIVA',
  'MONTAGEM',
  'INCLUSÃO',
  'REFORMA',
  'TROCA',
];

export default function PreventivaScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const navigation =
    useNavigation<
      NavigationProp<PreventiveNavigation>
    >();

  const [filial, setFilial] = useState('');
  const [serviceModalVisible, setServiceModalVisible] =
    useState(false);
  const [checklistVisible, setChecklistVisible] =
    useState(false);

  const selectService = (
    serviceType: TipoServico,
  ): void => {
    const normalizedStore = filial.trim();

    if (!normalizedStore) {
      Alert.alert(
        'Atenção',
        'Informe a filial antes de selecionar o serviço.',
      );
      return;
    }

    setServiceModalVisible(false);
    navigation.navigate('Patrimonio', {
      filial: normalizedStore,
      option: serviceType,
    });
  };

  return (
    <View
      style={[
        styles.centeredContainer,
        {
          backgroundColor:
            theme.colors.background,
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          {color: theme.colors.onBackground},
        ]}
      >
        REGISTRO DE PATRIMÔNIO
      </Text>

      <Text
        style={[
          styles.label,
          {color: theme.colors.onBackground},
        ]}
      >
        INICIE AS ANOTAÇÕES:
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          value={filial}
          onChangeText={setFilial}
          placeholder="DIGITE A FILIAL"
          placeholderTextColor={
            theme.colors.onSurfaceVariant
          }
          keyboardType="numeric"
          style={[
            styles.input,
            {
              backgroundColor:
                theme.colors.surfaceVariant,
              color: theme.colors.onSurface,
              borderColor:
                theme.colors.outline,
            },
          ]}
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              backgroundColor:
                theme.colors.primary,
            },
          ]}
          onPress={() =>
            setServiceModalVisible(true)
          }
        >
          <Text
            style={[
              styles.primaryButtonText,
              {color: theme.colors.onPrimary},
            ]}
          >
            COMEÇAR
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.checklistToggle}
        onPress={() =>
          setChecklistVisible(current => !current)
        }
      >
        <Text
          style={[
            styles.checklistToggleText,
            {color: theme.colors.onBackground},
          ]}
        >
          {checklistVisible
            ? 'Esconder checklist ▲'
            : 'Visualizar checklist ▼'}
        </Text>
      </TouchableOpacity>

      {checklistVisible && <Checklist />}

      <Modal
        visible={serviceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setServiceModalVisible(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor:
                  theme.colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                {color: theme.colors.onSurface},
              ]}
            >
              Escolha uma opção
            </Text>

            {SERVICE_TYPES.map(serviceType => (
              <TouchableOpacity
                key={serviceType}
                style={[
                  styles.modalOption,
                  {
                    borderBottomColor:
                      theme.colors.outline,
                  },
                ]}
                onPress={() =>
                  selectService(serviceType)
                }
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color:
                        theme.colors.onSurface,
                    },
                  ]}
                >
                  {serviceType}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor:
                    theme.colors
                      .buttonBackground,
                },
              ]}
              onPress={() =>
                setServiceModalVisible(false)
              }
            >
              <Text
                style={{
                  color:
                    theme.colors
                      .buttonForeground,
                }}
              >
                Fechar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

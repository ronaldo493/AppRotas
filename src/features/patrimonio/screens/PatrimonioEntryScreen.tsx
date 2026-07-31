import {
  type NavigationProp,
  useNavigation,
} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {Button, TextInput} from 'react-native-paper';

import {useAppTheme} from '../../../core/theme/appTheme';
import PreventivaChecklist from '../components/PreventivaChecklist';
import SelectField from '../components/SelectField';
import SelectionSheet, {
  type SelectionOption,
} from '../components/SelectionSheet';
import type {TipoServico} from '../models/Patrimonio';
import styles from './patrimonioEntryScreen.styles';

type PatrimonioNavigation = {
  Patrimonio: {
    filial: string;
    option: TipoServico;
  };
};

const SERVICE_OPTIONS: Array<SelectionOption & {value: TipoServico}> = [
  {value: 'PREVENTIVA', label: 'Preventiva'},
  {value: 'MONTAGEM', label: 'Montagem'},
  {value: 'INCLUSÃO', label: 'Inclusão'},
  {value: 'REFORMA', label: 'Reforma'},
  {value: 'TROCA', label: 'Troca'},
];

/**
 * Reúne os dados que identificam um registro de patrimônio. A preventiva é
 * tratada como um tipo de serviço, e não como o nome da funcionalidade.
 */
export default function PatrimonioEntryScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProp<PatrimonioNavigation>>();
  const [filial, setFilial] = useState('');
  const [serviceType, setServiceType] = useState<TipoServico | null>(null);
  const [serviceSheetVisible, setServiceSheetVisible] = useState(false);
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [filialError, setFilialError] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);

  const selectedServiceLabel =
    SERVICE_OPTIONS.find(option => option.value === serviceType)?.label ?? null;

  const startRegistration = (): void => {
    const normalizedStore = filial.trim();
    const missingStore = !normalizedStore;
    const missingService = !serviceType;

    setFilialError(missingStore ? 'Informe o número da filial.' : null);
    setServiceError(missingService ? 'Selecione o tipo de serviço.' : null);

    if (missingStore || missingService || !serviceType) return;

    navigation.navigate('Patrimonio', {
      filial: normalizedStore,
      option: serviceType,
    });
  };

  const selectService = (value: string): void => {
    const selected = SERVICE_OPTIONS.find(option => option.value === value);
    if (!selected) return;

    setServiceType(selected.value);
    setServiceError(null);
    setChecklistVisible(false);
    setServiceSheetVisible(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, {backgroundColor: theme.colors.background}]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, {color: theme.colors.onBackground}]}>
          Registro de patrimônio
        </Text>
        <Text style={[styles.description, {color: theme.colors.onSurfaceVariant}]}>
          Identifique a filial e o serviço realizado para registrar os equipamentos.
        </Text>

        <View
          style={[
            styles.form,
            {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
          ]}
        >
          <TextInput
            mode="outlined"
            label="Número da filial"
            value={filial}
            error={Boolean(filialError)}
            keyboardType="numeric"
            returnKeyType="next"
            maxLength={4}
            style={styles.storeInput}
            onChangeText={value => {
              setFilial(value.replace(/\D/g, ''));
              setFilialError(null);
            }}
            onSubmitEditing={() => setServiceSheetVisible(true)}
          />

          {filialError ? (
            <Text style={[styles.fieldError, {color: theme.colors.error}]}>
              {filialError}
            </Text>
          ) : null}

          <View style={styles.serviceField}>
            <SelectField
              label="Tipo de serviço"
              value={selectedServiceLabel}
              placeholder="Selecione o serviço realizado"
              error={Boolean(serviceError)}
              onPress={() => setServiceSheetVisible(true)}
            />
          </View>

          {serviceError ? (
            <Text style={[styles.fieldError, {color: theme.colors.error}]}>
              {serviceError}
            </Text>
          ) : null}

          <Button
            mode="contained"
            contentStyle={styles.primaryButtonContent}
            buttonColor={theme.colors.actionBackground}
            textColor={theme.colors.actionForeground}
            style={styles.primaryButton}
            onPress={startRegistration}
          >
            Iniciar registro
          </Button>
        </View>

        {serviceType === 'PREVENTIVA' ? (
          <>
            <View style={[styles.divider, {backgroundColor: theme.colors.outline}]} />

            <TouchableOpacity
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{expanded: checklistVisible}}
              style={styles.checklistToggle}
              onPress={() => setChecklistVisible(current => !current)}
            >
              <View style={styles.checklistToggleText}>
                <Text style={[styles.checklistTitle, {color: theme.colors.onSurface}]}>
                  Checklist da preventiva
                </Text>
                <Text
                  style={[
                    styles.checklistDescription,
                    {color: theme.colors.onSurfaceVariant},
                  ]}
                >
                  Consulta rápida das verificações da visita
                </Text>
              </View>

              <Text style={[styles.checklistAction, {color: theme.colors.primary}]}>
                {checklistVisible ? 'Ocultar' : 'Mostrar'}
              </Text>
            </TouchableOpacity>

            {checklistVisible ? <PreventivaChecklist /> : null}
          </>
        ) : null}
      </ScrollView>

      <SelectionSheet
        visible={serviceSheetVisible}
        title="Tipo de serviço"
        description="Selecione o serviço relacionado ao registro."
        options={SERVICE_OPTIONS}
        value={serviceType}
        onSelect={selectService}
        onDismiss={() => setServiceSheetVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

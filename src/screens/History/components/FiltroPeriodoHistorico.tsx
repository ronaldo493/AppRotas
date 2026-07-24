import DateTimePicker, { DateTimePickerEvent} from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { FiltroHistoricoRota } from '../../../type/Historico';
import HistoricoStyles from '../styles/HistoricoStyles';
import { useAppTheme } from '../../../components/ThemeStyles';

type PickerType = 'inicial' | 'final' | null;

interface FiltroPeriodoHistoricoProps {
  filtro: FiltroHistoricoRota;
  loading: boolean;
  onAplicar: (
    dataInicial?: Date,
    dataFinal?: Date,
  ) => void;
  onLimpar: () => void;
}

interface CampoDataProps {
  label: string;
  data?: Date;
  disabled: boolean;
  onPress: () => void;
}

function CampoData({
  label,
  data,
  disabled,
  onPress,
}: CampoDataProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        HistoricoStyles.dateField,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <MaterialIcons
        name="calendar-today"
        size={16}
        color={theme.colors.iconDefault}
      />

      <View style={HistoricoStyles.dateFieldContent}>
        <Text  style={[HistoricoStyles.dateFieldLabel, { color: theme.colors.onSurfaceVariant}]}>
          {label}
        </Text>

        <Text
          numberOfLines={1}
          style={[
            HistoricoStyles.dateFieldValue,
            {
              color: data
                ? theme.colors.onSurface
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {data ? data.toLocaleDateString('pt-BR') : 'Selecionar'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function FiltroPeriodoHistorico({
  filtro,
  loading,
  onAplicar,
  onLimpar,
}: FiltroPeriodoHistoricoProps): React.JSX.Element {
  const theme = useAppTheme();

  const [dataInicial, setDataInicial] = useState<Date | undefined>(filtro.dataInicial);
  const [dataFinal, setDataFinal] = useState<Date | undefined>(filtro.dataFinal);
  const [picker, setPicker] = useState<PickerType>(null);

  const possuiData = Boolean(dataInicial || dataFinal);
  const filtroAtivo = Boolean( filtro.dataInicial || filtro.dataFinal,);

  useEffect(() => {
    setDataInicial(filtro.dataInicial);
    setDataFinal(filtro.dataFinal);
  }, [filtro.dataFinal, filtro.dataInicial]);

  const handleChangeDate = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ): void => {
    const pickerSelecionado = picker;

    setPicker(null);

    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    if (pickerSelecionado === 'inicial') {
      setDataInicial(selectedDate);

      if (dataFinal && selectedDate.getTime() > dataFinal.getTime()) {
        setDataFinal(undefined);
      }

      return;
    }

    if (pickerSelecionado === 'final') {
      setDataFinal(selectedDate);
    }
  };

  const handleLimpar = (): void => {
    setDataInicial(undefined);
    setDataFinal(undefined);
    setPicker(null);

    onLimpar();
  };

  return (
    <View style={HistoricoStyles.filterContainer}>
      <View style={HistoricoStyles.filterHeader}>
        {(possuiData || filtroAtivo) && (
          <TouchableOpacity
            disabled={loading}
            onPress={handleLimpar}
          >
            <Text style={[HistoricoStyles.filterClearText, {color: theme.colors.primary}]}>
              Limpar
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={HistoricoStyles.filterRow}>
        <CampoData
          label="De"
          data={dataInicial}
          disabled={loading}
          onPress={() => setPicker('inicial')}
        />

        <MaterialIcons
          name="arrow-forward"
          size={16}
          color={theme.colors.onSurfaceVariant}
        />

        <CampoData
          label="Até"
          data={dataFinal}
          disabled={loading}
          onPress={() => setPicker('final')}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={loading || !possuiData}
          onPress={() => onAplicar(dataInicial, dataFinal)}
          style={[
            HistoricoStyles.filterSearchButton,
            {
              backgroundColor:
                loading || !possuiData
                  ? theme.colors.surfaceVariant
                  : theme.colors.buttonBackground,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.onSurfaceVariant}/>
          ) : (
            <MaterialIcons
              name="search"
              size={21}
              color={
                possuiData
                  ? theme.colors.buttonForeground
                  : theme.colors.onSurfaceVariant
              }
            />
          )}
        </TouchableOpacity>
      </View>

      {picker && (
        <DateTimePicker
          value={
            picker === 'inicial'
              ? dataInicial ?? new Date()
              : dataFinal ?? dataInicial ?? new Date()
          }
          mode="date"
          display={
            Platform.OS === 'ios'
              ? 'compact'
              : 'default'
          }
          minimumDate={
            picker === 'final'
              ? dataInicial
              : undefined
          }
          maximumDate={
            picker === 'inicial'
              ? dataFinal ?? new Date()
              : new Date()
          }
          onChange={handleChangeDate}
        />
      )}
    </View>
  );
}
import React from 'react';
import {Text, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {PainelAdminRotas} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';

function Metric({value, label}: {value: number; label: string}): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View style={styles.mainMetric}>
      <Text style={[styles.mainMetricValue, {color: theme.colors.onSurface}]}>
        {value}
      </Text>
      <Text style={[styles.mainMetricLabel, {color: theme.colors.onSurfaceVariant}]}>
        {label}
      </Text>
    </View>
  );
}

/** Mostra apenas os números necessários para orientar a leitura da lista. */
export default function AdminDashboardSummary({
  dados,
}: {
  dados: PainelAdminRotas;
}): React.JSX.Element {
  const theme = useAppTheme();
  const {metricas} = dados;

  return (
    <View style={styles.summarySection}>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>
          Resumo
        </Text>
        <Text style={[styles.sectionAside, {color: theme.colors.onSurfaceVariant}]}>
          {metricas.totalExecucoes} {metricas.totalExecucoes === 1 ? 'registro' : 'registros'}
        </Text>
      </View>

      <View
        style={[
          styles.summaryCard,
          {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
        ]}
      >
        <View style={styles.mainMetricsRow}>
          <Metric value={metricas.emAndamento} label="Em andamento" />
          <Metric value={metricas.percursosConfirmados ?? 0} label="Confirmados" />
          <Metric value={metricas.interrompidas} label="Interrompidos" />
        </View>
        <View style={[styles.summaryDivider, {backgroundColor: theme.colors.outline}]} />
        <Text style={[styles.summaryLine, {color: theme.colors.onSurfaceVariant}]}>
          {metricas.destinosVisitados} de {metricas.destinosPlanejados} destinos confirmados
          {(metricas.evidenciasInsuficientes ?? 0) > 0
            ? ` · ${metricas.evidenciasInsuficientes} com evidência insuficiente`
            : ''}
        </Text>
      </View>

      {dados.metricasLimitadas && (
        <Text style={[styles.limitText, {color: theme.colors.onSurfaceVariant}]}>
          Totais limitados aos 10 mil registros mais recentes.
        </Text>
      )}
    </View>
  );
}

import React from 'react';
import {Text, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {PainelAdminRotas} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';

function MainMetric({value, label}: {value: number; label: string}): React.JSX.Element {
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

/** Resume situação e evidências sem misturar os segmentos técnicos à operação. */
export default function AdminDashboardSummary({
  dados,
}: {
  dados: PainelAdminRotas;
}): React.JSX.Element {
  const theme = useAppTheme();
  const {metricas} = dados;
  const concluidas = metricas.concluidas + metricas.concluidasParcialmente;

  return (
    <View style={styles.summarySection}>
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, {color: theme.colors.onBackground}]}>
          Resumo do período
        </Text>
        <Text style={[styles.sectionAside, {color: theme.colors.onSurfaceVariant}]}>
          {metricas.totalExecucoes} {metricas.totalExecucoes === 1 ? 'execução' : 'execuções'}
        </Text>
      </View>

      <View
        style={[
          styles.summaryCard,
          {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
        ]}
      >
        <View style={styles.mainMetricsRow}>
          <MainMetric value={metricas.emAndamento} label="Em andamento" />
          <MainMetric value={concluidas} label="Concluídas" />
          <MainMetric value={metricas.interrompidas} label="Interrompidas" />
        </View>

        <View style={[styles.summaryDivider, {backgroundColor: theme.colors.outline}]} />

        <Text style={[styles.summaryLine, {color: theme.colors.onSurfaceVariant}]}>
          {metricas.confirmadasPorGps} com percurso integral confirmado por GPS
        </Text>
        <Text style={[styles.summaryLine, {color: theme.colors.onSurfaceVariant}]}>
          {metricas.destinosVisitados} de {metricas.destinosPlanejados} destinos confirmados · {metricas.canceladas} cancelados
        </Text>
      </View>

      {dados.metricasLimitadas && (
        <Text style={[styles.limitText, {color: theme.colors.onSurfaceVariant}]}>
          Os totais consideram os 10 mil percursos mais recentes.
        </Text>
      )}
    </View>
  );
}

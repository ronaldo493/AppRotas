import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {ExecucaoRotaAdmin} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';
import {
  formatarDataHoraAdmin,
  formatarDistanciaAdmin,
  formatarDuracaoAdmin,
  formatarResultadoViagemAdmin,
  formatarStatusOperacionalAdmin,
  formatarTempoRelativoAdmin,
} from '../useCases/formatAdminRouteDashboard';

const descreverDestinos = (execucao: ExecucaoRotaAdmin): string => {
  const planejados = execucao.quantidadeDestinosPlanejados ?? execucao.destinos.length;
  const visitados = execucao.quantidadeDestinosVisitados ?? 0;
  return `${visitados} de ${planejados} destinos confirmados`;
};

const listarDestinos = (execucao: ExecucaoRotaAdmin): string => {
  if (execucao.destinos.length === 0) {
    return 'Destinos não informados';
  }

  const nomes = execucao.destinos
    .slice(0, 2)
    .map(destino =>
      destino.codigo
        ? `Filial ${destino.codigo}`
        : destino.nome,
    )
    .filter(Boolean);
  const restantes = execucao.destinos.length - nomes.length;

  return restantes > 0
    ? `${nomes.join(' → ')} e mais ${restantes}`
    : nomes.join(' → ');
};

/** Linha resumida; as evidências completas ficam no detalhe sob demanda. */
export default function AdminRouteExecutionCard({
  execucao,
  onPress,
}: {
  execucao: ExecucaoRotaAdmin;
  onPress: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const emAndamento = execucao.situacaoExecucao === 'em_andamento';
  const statusOperacional = formatarStatusOperacionalAdmin(
    execucao.statusOperacional,
  );
  const resultado = formatarResultadoViagemAdmin(
    execucao.resultadoViagem,
    execucao.situacaoExecucao,
  );
  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`Ver percurso de ${execucao.username}`}
      onPress={onPress}
      style={[
        styles.routeCard,
        {backgroundColor: theme.colors.surface, borderColor: theme.colors.outline},
      ]}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeIdentity}>
          <Text style={[styles.routeUsername, {color: theme.colors.onSurface}]}>
            {execucao.username || 'Usuário não informado'}
          </Text>
          <Text style={[styles.routeMeta, {color: theme.colors.onSurfaceVariant}]}>
            {execucao.setor || 'Setor não informado'} · {formatarDataHoraAdmin(execucao.iniciadaEm)}
          </Text>
        </View>

      </View>

      <View style={[styles.routeStatusBox, {backgroundColor: theme.colors.primarySoft}]}>
        <Text style={[styles.routeStatus, {color: theme.colors.primary}]}>
          {resultado}
        </Text>
      </View>

      <Text numberOfLines={1} style={[styles.routeOrigin, {color: theme.colors.onSurfaceVariant}]}>
        {execucao.cidadeOrigem || 'Origem não informada'} → {listarDestinos(execucao)}
      </Text>

      <Text style={[styles.routeSummary, {color: theme.colors.onSurface}]}>
        {descreverDestinos(execucao)}
      </Text>

      {!emAndamento && (
        <Text style={[styles.routeTripSummary, {color: theme.colors.onSurfaceVariant}]}>
          {formatarDistanciaAdmin(execucao.distanciaPercorridaMetros)} · {formatarDuracaoAdmin(execucao.duracaoTotalSegundos)}
        </Text>
      )}

      {emAndamento && statusOperacional ? (
        <Text
          style={[
            styles.routeEvidence,
            {color: theme.colors.onSurfaceVariant},
          ]}
        >
          {statusOperacional} · {formatarTempoRelativoAdmin(execucao.atualizadaHaSegundos)}
        </Text>
      ) : execucao.rotaConfirmadaPorGps ? (
        <Text style={[styles.routeEvidence, {color: theme.colors.success}]}>
          Percurso confirmado por GPS
        </Text>
      ) : null}

      {emAndamento && !statusOperacional && (
        <Text style={[styles.routeEvidence, {color: theme.colors.info}]}>
          Último sinal: {formatarDataHoraAdmin(execucao.ultimaLocalizacaoEm)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

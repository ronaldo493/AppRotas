import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {ExecucaoRotaAdmin} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';
import {
  formatarDataHoraAdmin,
  formatarDistanciaAdmin,
  formatarDuracaoAdmin,
  formatarSituacaoAdmin,
} from '../useCases/formatAdminRouteDashboard';

const descreverDestinos = (execucao: ExecucaoRotaAdmin): string => {
  const planejados = execucao.quantidadeDestinosPlanejados ?? execucao.destinos.length;
  const visitados = execucao.quantidadeDestinosVisitados ?? 0;
  return `${visitados} de ${planejados} destinos`;
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

        <Text style={[styles.routeStatus, {color: theme.colors.primary}]}>
          {formatarSituacaoAdmin(execucao.situacaoExecucao)}
        </Text>
      </View>

      <Text numberOfLines={1} style={[styles.routeOrigin, {color: theme.colors.onSurfaceVariant}]}>
        Origem: {execucao.cidadeOrigem || 'não informada'}
      </Text>

      <Text style={[styles.routeSummary, {color: theme.colors.onSurface}]}>
        {emAndamento
          ? `${descreverDestinos(execucao)} · ${execucao.quantidadePontos ?? 0} leituras`
          : `${descreverDestinos(execucao)} · ${formatarDistanciaAdmin(execucao.distanciaPercorridaMetros)} · ${formatarDuracaoAdmin(execucao.duracaoTotalSegundos)}`}
      </Text>

      {execucao.rotaConfirmadaPorGps && (
        <Text style={[styles.routeEvidence, {color: theme.colors.success}]}>
          Percurso confirmado por GPS
        </Text>
      )}

      {emAndamento && (
        <Text style={[styles.routeEvidence, {color: theme.colors.info}]}>
          Último sinal: {formatarDataHoraAdmin(execucao.ultimaLocalizacaoEm)}
        </Text>
      )}
    </TouchableOpacity>
  );
}

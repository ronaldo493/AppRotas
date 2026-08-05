import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useAppTheme} from '../../../core/theme/appTheme';
import type {ExecucaoRotaAdmin} from '../models/AdminRouteDashboard';
import styles from '../styles/adminDashboard.styles';
import {
  formatarDataHoraAdmin,
  formatarDistanciaAdmin,
  formatarDuracaoAdmin,
  formatarMotivoFinalizacaoAdmin,
  formatarSituacaoAdmin,
} from '../useCases/formatAdminRouteDashboard';

function DetailRow({label, value}: {label: string; value: string}): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, {color: theme.colors.onSurfaceVariant}]}>
        {label}
      </Text>
      <Text style={[styles.detailValue, {color: theme.colors.onSurface}]}>
        {value}
      </Text>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: React.PropsWithChildren<{title: string}>): React.JSX.Element {
  const theme = useAppTheme();
  return (
    <View style={styles.detailSection}>
      <Text style={[styles.detailSectionTitle, {color: theme.colors.onSurface}]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Detalhe operacional; dados técnicos que não ajudam a decisão ficam ocultos. */
export default function AdminRouteDetailSheet({
  execucao,
  onClose,
  onViewMap,
}: {
  execucao: ExecucaoRotaAdmin | null;
  onClose: () => void;
  onViewMap: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  if (!execucao) return <></>;

  const destinosPlanejados = execucao.quantidadeDestinosPlanejados
    ?? execucao.destinos.length;
  const destinosVisitados = execucao.quantidadeDestinosVisitados ?? 0;
  const exibirInterrupcao = execucao.teveInterrupcaoLocalizacao
    || (execucao.duracaoLocalizacaoIndisponivelSegundos ?? 0) > 0;

  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar detalhes"
          onPress={onClose}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={[styles.sheetHandle, {backgroundColor: theme.colors.outline}]} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, {color: theme.colors.onSurface}]}>
              {execucao.username || 'Percurso'}
            </Text>
            <Text style={[styles.sheetSubtitle, {color: theme.colors.onSurfaceVariant}]}>
              {formatarSituacaoAdmin(execucao.situacaoExecucao)} · {execucao.setor || 'Setor não informado'}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <DetailSection title="Percurso">
              <DetailRow label="Início" value={formatarDataHoraAdmin(execucao.iniciadaEm)} />
              <DetailRow label="Fim" value={formatarDataHoraAdmin(execucao.finalizadaEm)} />
              <DetailRow label="Origem" value={execucao.cidadeOrigem || 'Não informada'} />
              <DetailRow
                label="Destinos confirmados"
                value={`${destinosVisitados} de ${destinosPlanejados}`}
              />
            </DetailSection>

            <DetailSection title="Resultado">
              <DetailRow
                label="Distância estimada"
                value={formatarDistanciaAdmin(execucao.distanciaPlanejadaMetros)}
              />
              <DetailRow
                label="Distância registrada"
                value={formatarDistanciaAdmin(execucao.distanciaPercorridaMetros)}
              />
              <DetailRow
                label="Duração estimada"
                value={formatarDuracaoAdmin(execucao.duracaoPlanejadaSegundos)}
              />
              <DetailRow
                label="Duração registrada"
                value={formatarDuracaoAdmin(execucao.duracaoTotalSegundos)}
              />
              <DetailRow
                label="Confirmação por GPS"
                value={execucao.rotaConfirmadaPorGps ? 'Integral' : 'Não integral'}
              />
              {(execucao.quantidadeDesvios ?? 0) > 0 && (
                <DetailRow
                  label="Desvios identificados"
                  value={String(execucao.quantidadeDesvios)}
                />
              )}
              <DetailRow
                label="Encerramento"
                value={formatarMotivoFinalizacaoAdmin(execucao.motivoFinalizacao) ?? '—'}
              />
            </DetailSection>

            {exibirInterrupcao && (
              <DetailSection title="Disponibilidade da localização">
                <DetailRow
                  label="Interrupções"
                  value={String(execucao.quantidadeInterrupcoesLocalizacao ?? 0)}
                />
                <DetailRow
                  label="Tempo indisponível"
                  value={formatarDuracaoAdmin(
                    execucao.duracaoLocalizacaoIndisponivelSegundos,
                  )}
                />
                <DetailRow
                  label="Última leitura"
                  value={formatarDataHoraAdmin(execucao.ultimaLocalizacaoEm)}
                />
              </DetailSection>
            )}

            <DetailSection title={`Destinos (${execucao.destinos.length})`}>
              {execucao.destinos.length === 0 ? (
                <Text style={[styles.detailLabel, {color: theme.colors.onSurfaceVariant}]}>
                  Nenhum destino disponível.
                </Text>
              ) : execucao.destinos.map((destino, index) => (
                <View
                  key={`${destino.codigo ?? 'destino'}-${destino.ordem ?? index}`}
                  style={[styles.destination, {borderBottomColor: theme.colors.outline}]}
                >
                  <Text style={[styles.destinationTitle, {color: theme.colors.onSurface}]}>
                    {destino.ordem ?? index + 1}. {destino.nome || `Destino ${destino.codigo ?? ''}`}
                  </Text>
                  <Text style={[styles.destinationMeta, {color: theme.colors.onSurfaceVariant}]}>
                    {[destino.codigo ? `Código ${destino.codigo}` : '', destino.cidade]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
              ))}
            </DetailSection>

            <View style={styles.detailActions}>
              {execucao.situacaoExecucao !== 'em_andamento' && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={onViewMap}
                  style={[styles.mapButton, {borderColor: theme.colors.primary}]}
                >
                  <Text style={[styles.mapButtonText, {color: theme.colors.primary}]}>
                    Ver trajeto no mapa
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onClose}
                style={[styles.closeButton, {backgroundColor: theme.colors.actionBackground}]}
              >
                <Text style={[styles.closeButtonText, {color: theme.colors.actionForeground}]}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
  descreverExecucaoRotaAdmin,
  formatarAlertaOperacionalAdmin,
  formatarConfiabilidadeAdmin,
  formatarMotivoFinalizacaoAdmin,
  formatarOrigemFinalizacaoAdmin,
  formatarResultadoViagemAdmin,
  formatarSituacaoAdmin,
  formatarStatusOperacionalAdmin,
} from '../useCases/formatAdminRouteDashboard';

const DESCRICOES_TELEMETRIA: Record<string, string> = {
  rastreamento_iniciado: 'Inicialização solicitada',
  rastreamento_confirmado: 'Serviço de localização ativo',
  localizacao_recebida: 'Localização recebida no aparelho',
  gps_indisponivel: 'GPS indisponível',
  permissao_revogada: 'Permissão de localização removida',
  servico_interrompido: 'Serviço de rastreamento interrompido',
  aplicativo_primeiro_plano: 'Aplicativo aberto novamente',
  sincronizacao_pendente: 'Dados aguardando envio',
  lote_enviado: 'Último lote enviado',
};

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
  const statusOperacional = formatarStatusOperacionalAdmin(
    execucao.statusOperacional,
  );
  const alertas = (execucao.alertasOperacionais ?? []).filter(
    alerta => alerta !== 'velocidade_incompativel',
  );
  const resultadoViagem = formatarResultadoViagemAdmin(
    execucao.resultadoViagem,
    execucao.situacaoExecucao,
  );

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
              {resultadoViagem} · {execucao.setor || 'Setor não informado'}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View
              style={[
                styles.detailSummary,
                {backgroundColor: theme.colors.surfaceVariant},
              ]}
            >
              <Text style={[styles.detailSummaryTitle, {color: theme.colors.onSurface}]}>
                O que aconteceu
              </Text>
              <Text style={[styles.detailSummaryText, {color: theme.colors.onSurfaceVariant}]}>
                {descreverExecucaoRotaAdmin(execucao)}
              </Text>
            </View>

            {alertas.length > 0 && (
              <DetailSection title="Pontos de atenção">
                {alertas.map(alerta => (
                  <Text
                    key={alerta}
                    style={[
                      styles.detailNotice,
                      {color: theme.colors.onSurfaceVariant},
                    ]}
                  >
                    {formatarAlertaOperacionalAdmin(alerta)}
                  </Text>
                ))}
              </DetailSection>
            )}

            <DetailSection title="Situação do registro">
              <DetailRow label="Resultado" value={resultadoViagem} />
              <DetailRow
                label="Situação técnica"
                value={formatarSituacaoAdmin(execucao.situacaoExecucao)}
              />
              {statusOperacional && (
                <DetailRow label="Estado operacional" value={statusOperacional} />
              )}
              <DetailRow
                label="Confiabilidade das evidências"
                value={formatarConfiabilidadeAdmin(execucao.confiabilidade)}
              />
              <DetailRow
                label="Leituras de localização"
                value={String(execucao.quantidadePontos ?? 0)}
              />
              {(execucao.atrasoUltimaSincronizacaoSegundos ?? 0) > 0 && (
                <DetailRow
                  label="Atraso do último envio"
                  value={formatarDuracaoAdmin(
                    execucao.atrasoUltimaSincronizacaoSegundos ?? null,
                  )}
                />
              )}
              {(execucao.maiorAtrasoSincronizacaoSegundos ?? 0) > 0 && (
                <DetailRow
                  label="Maior atraso registrado"
                  value={formatarDuracaoAdmin(
                    execucao.maiorAtrasoSincronizacaoSegundos ?? null,
                  )}
                />
              )}
            </DetailSection>

            {execucao.ultimoEventoRastreamento && (
              <DetailSection title="Diagnóstico do aparelho">
                <DetailRow
                  label="Último evento"
                  value={
                    DESCRICOES_TELEMETRIA[execucao.ultimoEventoRastreamento] ??
                    execucao.ultimoEventoRastreamento
                  }
                />
                <DetailRow
                  label="Ocorreu em"
                  value={formatarDataHoraAdmin(execucao.ultimoEventoRastreamentoEm ?? null)}
                />
                <DetailRow
                  label="Recebido pelo servidor"
                  value={formatarDataHoraAdmin(execucao.telemetriaRecebidaEm ?? null)}
                />
                <DetailRow
                  label="Pontos aguardando envio"
                  value={String(execucao.pontosPendentesDispositivo ?? 0)}
                />
              </DetailSection>
            )}

            <DetailSection title="Horários">
              <DetailRow label="Início" value={formatarDataHoraAdmin(execucao.iniciadaEm)} />
              <DetailRow
                label="Última leitura GPS"
                value={formatarDataHoraAdmin(execucao.ultimaLocalizacaoEm)}
              />
              <DetailRow
                label="Recebida pelo servidor"
                value={formatarDataHoraAdmin(execucao.ultimaSincronizacaoEm ?? null)}
              />
              {execucao.conclusaoConfirmadaEm && (
                <DetailRow
                  label="Destino final confirmado"
                  value={formatarDataHoraAdmin(execucao.conclusaoConfirmadaEm)}
                />
              )}
              <DetailRow label="Fim" value={formatarDataHoraAdmin(execucao.finalizadaEm)} />
            </DetailSection>

            <DetailSection title="Origem e destinos">
              <DetailRow label="Origem" value={execucao.cidadeOrigem || 'Não informada'} />
              <DetailRow
                label="Destinos confirmados"
                value={`${destinosVisitados} de ${destinosPlanejados}`}
              />
            </DetailSection>

            <DetailSection title="Medidas da viagem">
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
              {execucao.finalizadaEm && (
                <DetailRow
                  label="Registrado por"
                  value={formatarOrigemFinalizacaoAdmin(execucao.origemFinalizacao)}
                />
              )}
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
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onViewMap}
                style={[styles.mapButton, {borderColor: theme.colors.primary}]}
              >
                <Text style={[styles.mapButtonText, {color: theme.colors.primary}]}>
                  {execucao.situacaoExecucao === 'em_andamento'
                    ? 'Acompanhar trajeto no mapa'
                    : 'Ver trajeto no mapa'}
                </Text>
              </TouchableOpacity>
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

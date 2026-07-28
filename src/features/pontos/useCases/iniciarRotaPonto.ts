import type {Filial} from '../../filiais/models/Filial';
import {
  TIPO_HISTORICO,
  type TipoHistorico,
} from '../../historico/models/Historico';
import {
  registrarHistoricoRota,
  type EnviarHistoricoRota,
  type ResultadoRegistroHistorico,
} from '../../historico/useCases/registrarHistoricoRota';
import type {
  CategoriaPonto,
  PontoInteresse,
} from '../models/Ponto';

interface IniciarRotaPontoInput {
  ponto: PontoInteresse;
  cidadeOrigem: string | null;
}

interface IniciarRotaPontoDependencies {
  abrirRota: (
    rotas: readonly Filial[],
  ) => Promise<boolean>;
  enviarHistorico: EnviarHistoricoRota;
  sincronizarHistoricos: (
    enviar: EnviarHistoricoRota,
  ) => Promise<number>;
  adicionarHistoricoPendente: (
    rotas: Filial[],
    datahora: string,
    cidadeOrigem: string | null,
    tipoHistorico: TipoHistorico,
  ) => Promise<void>;
  agora?: () => Date;
}

export type ResultadoInicioRotaPonto =
  | {status: 'rota_nao_aberta'}
  | {
      status: 'rota_aberta';
      historico: ResultadoRegistroHistorico;
    };

const obterTipoHistorico = (
  categoria: CategoriaPonto,
): TipoHistorico =>
  categoria === 'Restaurante'
    ? TIPO_HISTORICO.RESTAURANTE
    : TIPO_HISTORICO.POSTO_COMBUSTIVEL;

const converterPontoEmRota = (
  ponto: PontoInteresse,
  cidadeOrigem: string | null,
): Filial => ({
  codigofilial: ponto.id ?? 0,
  nomefilial: ponto.descricao,
  nomecidade:
    cidadeOrigem ?? 'Não informado',
  latitude: ponto.latitude,
  longitude: ponto.longitude,
});

export async function iniciarRotaPonto(
  {
    ponto,
    cidadeOrigem,
  }: IniciarRotaPontoInput,
  {
    abrirRota,
    enviarHistorico,
    sincronizarHistoricos,
    adicionarHistoricoPendente,
    agora,
  }: IniciarRotaPontoDependencies,
): Promise<ResultadoInicioRotaPonto> {
  const rota = converterPontoEmRota(
    ponto,
    cidadeOrigem,
  );
  const rotaAberta = await abrirRota([rota]);

  /*
   * Selecionar ou cadastrar um ponto não gera histórico.
   * O registro só acontece depois que a navegação é aberta.
   */
  if (!rotaAberta) {
    return {status: 'rota_nao_aberta'};
  }

  const historico = await registrarHistoricoRota(
    {
      rotas: [rota],
      cidadeOrigem,
      tipoHistorico: obterTipoHistorico(
        ponto.categoria,
      ),
      sincronizarPendentes: false,
    },
    {
      enviar: enviarHistorico,
      sincronizar: sincronizarHistoricos,
      adicionarPendente:
        adicionarHistoricoPendente,
      agora,
    },
  );

  return {
    status: 'rota_aberta',
    historico,
  };
}

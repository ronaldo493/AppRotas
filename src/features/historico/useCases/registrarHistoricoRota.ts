import type {Filial} from '../../filiais/models/Filial';
import type {TipoHistorico} from '../models/Historico';

export type EnviarHistoricoRota = (
  rotas: Filial[],
  datahora: string | undefined,
  exibirErro: boolean | undefined,
  cidadeOrigem: string | null,
  tipoHistorico: TipoHistorico,
) => Promise<boolean>;

interface RegistrarHistoricoRotaInput {
  rotas: Filial[];
  cidadeOrigem: string | null;
  tipoHistorico: TipoHistorico;
  sincronizarPendentes?: boolean;
}

interface RegistrarHistoricoRotaDependencies {
  enviar: EnviarHistoricoRota;
  sincronizar: (
    enviar: EnviarHistoricoRota,
  ) => Promise<number>;
  adicionarPendente: (
    rotas: Filial[],
    datahora: string,
    cidadeOrigem: string | null,
    tipoHistorico: TipoHistorico,
  ) => Promise<void>;
  agora?: () => Date;
}

export type ResultadoRegistroHistorico =
  | {status: 'salvo'}
  | {status: 'pendente'}
  | {status: 'falha'; erro: unknown};

export async function registrarHistoricoRota(
  {
    rotas,
    cidadeOrigem,
    tipoHistorico,
    sincronizarPendentes = true,
  }: RegistrarHistoricoRotaInput,
  {
    enviar,
    sincronizar,
    adicionarPendente,
    agora = () => new Date(),
  }: RegistrarHistoricoRotaDependencies,
): Promise<ResultadoRegistroHistorico> {
  if (sincronizarPendentes) {
    try {
      await sincronizar(enviar);
    } catch {
      /*
       * Uma falha ao sincronizar registros antigos não deve
       * impedir o registro da rota que acabou de ser iniciada.
       */
    }
  }

  const datahora = agora().toISOString();

  try {
    const salvo = await enviar(
      rotas,
      datahora,
      false,
      cidadeOrigem,
      tipoHistorico,
    );

    if (salvo) {
      return {status: 'salvo'};
    }
  } catch {
    /*
     * A fila local é a estratégia de contingência para
     * indisponibilidade de rede ou do Strapi.
     */
  }

  try {
    await adicionarPendente(
      rotas,
      datahora,
      cidadeOrigem,
      tipoHistorico,
    );

    return {status: 'pendente'};
  } catch (erro: unknown) {
    return {status: 'falha', erro};
  }
}

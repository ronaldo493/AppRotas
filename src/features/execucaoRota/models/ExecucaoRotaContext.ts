import type {Filial} from '../../filiais/models/Filial';
import type {ResultadoPermissaoRastreamento} from '../services/backgroundLocationTask';
import type {
  ExecucaoRota,
  NavegadorRota,
  PlanejamentoExecucaoRota,
  TipoDestinoRota,
} from './ExecucaoRota';

export interface IniciarExecucaoRotaInput {
  rotas: readonly Filial[];
  navegador: NavegadorRota;
  tipoDestino?: TipoDestinoRota;
  planejamento?: PlanejamentoExecucaoRota;
}

export type PermissaoRastreamentoNegada = Exclude<
  ResultadoPermissaoRastreamento,
  {concedida: true}
>;

export type ResultadoInicioExecucaoRota =
  | {status: 'iniciada'; execucao: ExecucaoRota}
  | {status: 'ja_existe'; execucao: ExecucaoRota}
  | {
      status: 'permissao_negada';
      permissao: PermissaoRastreamentoNegada;
    }
  | {
      status:
        | 'usuario_nao_identificado'
        | 'destino_invalido'
        | 'erro';
      mensagem: string;
    };

export interface ExecucaoRotaContextValue {
  execucaoAtiva: ExecucaoRota | null;
  inicializando: boolean;
  iniciando: boolean;
  finalizando: boolean;
  indisponibilidadeLocalizacao:
    | PermissaoRastreamentoNegada
    | null;
  verificandoLocalizacao: boolean;
  iniciarExecucao: (
    input: IniciarExecucaoRotaInput,
  ) => Promise<ResultadoInicioExecucaoRota>;
  cancelarPorFalhaAoAbrirNavegador: (
    codigoSessao: string,
  ) => Promise<boolean>;
  interromperExecucao: () => Promise<boolean>;
  abrirConfiguracoesLocalizacao: () => Promise<void>;
  verificarLocalizacao: () => Promise<void>;
  sincronizar: () => Promise<void>;
}

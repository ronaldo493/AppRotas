import type {CategoriaPonto} from '../../pontos/models/Ponto';
import type {TipoHistorico} from '../../historico/models/Historico';

export type DestinoAssistente =
  | 'inicio'
  | 'mapa_filiais'
  | 'historico'
  | 'pontos'
  | 'preventiva'
  | 'chamados'
  | 'contatos'
  | 'admin'
  | 'perfil'
  | 'sobre';

export type TopicoAjudaAssistente =
  | 'rotas'
  | 'pontos'
  | 'contatos'
  | 'historico'
  | 'chamados'
  | 'preventiva'
  | 'perfil';

export type ComandoAssistente =
  | {dominio: 'sistema'; acao: 'ajuda' | 'confirmar' | 'cancelar'}
  | {
      dominio: 'sistema';
      acao: 'orientar';
      topico: TopicoAjudaAssistente;
    }
  | {dominio: 'navegacao'; acao: 'abrir' | 'voltar'; destino?: DestinoAssistente}
  | {
      dominio: 'pontos';
      acao: 'mostrar_proximos' | 'tracar_mais_proximo';
      categoria: CategoriaPonto;
      quantidade: number;
    }
  | {dominio: 'pontos'; acao: 'tracar_ultimo'}
  | {
      dominio: 'contatos';
      acao: 'consultar';
      termo: string;
    }
  | {
      dominio: 'historico';
      acao: 'resumir';
      periodo: 'hoje' | 'geral';
      tipo?: TipoHistorico;
    }
  | {dominio: 'chamados'; acao: 'resumir'}
  | {
      dominio: 'preferencias';
      acao: 'definir_tema';
      modo: 'claro' | 'escuro';
    }
  | {
      dominio: 'preferencias';
      acao: 'definir_voz';
      ativa: boolean;
    }
  | {
      dominio: 'preferencias';
      acao: 'consultar_voz';
    }
  | {dominio: 'perfil'; acao: 'consultar'; campo: 'resumo' | 'email' | 'setor'}
  | {dominio: 'aplicativo'; acao: 'consultar_versao'}
  | {dominio: 'sugestoes'; acao: 'abrir'};

export interface ContextoInterpretacaoAssistente {
  possuiUltimoPonto?: boolean;
  aguardandoRefinoContato?: boolean;
}

export interface ResultadoInterpretacaoAssistente {
  comando: ComandoAssistente;
  transcricao: string;
}

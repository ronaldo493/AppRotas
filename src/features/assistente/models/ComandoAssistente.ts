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

export type PeriodoHistoricoAssistente =
  | 'hoje'
  | 'ontem'
  | 'ultimos_7_dias'
  | 'mes_atual'
  | 'geral';

export type ComandoAssistente =
  | {dominio: 'sistema'; acao: 'ajuda' | 'confirmar' | 'cancelar'}
  | {
      dominio: 'sistema';
      acao: 'orientar';
      topico: TopicoAjudaAssistente;
    }
  | {dominio: 'navegacao'; acao: 'abrir' | 'voltar'; destino?: DestinoAssistente}
  | {dominio: 'mapa'; acao: 'pesquisar_filiais'; termo: string}
  | {dominio: 'filiais'; acao: 'contar_total'}
  | {dominio: 'filiais'; acao: 'contar_cidade'; termo: string}
  | {dominio: 'filiais'; acao: 'listar_cidades'}
  | {
      dominio: 'filiais';
      acao: 'ranking';
      agrupamento: 'cidade' | 'regiao';
      ordem: 'mais' | 'menos';
      quantidade: number;
    }
  | {
      dominio: 'pontos';
      acao: 'mostrar_proximos' | 'tracar_mais_proximo';
      categoria: CategoriaPonto;
      quantidade: number;
    }
  | {dominio: 'pontos'; acao: 'tracar_ultimo'}
  | {
      dominio: 'pontos';
      acao: 'buscar';
      termo: string;
      categoria?: CategoriaPonto;
      iniciarRota: boolean;
    }
  | {
      dominio: 'contatos';
      acao: 'consultar';
      termo: string;
    }
  | {
      dominio: 'contatos';
      acao: 'consultar_ultimo';
      campo: 'resumo' | 'telefone' | 'email';
    }
  | {dominio: 'contatos'; acao: 'listar_departamentos'}
  | {
      dominio: 'contatos';
      acao: 'ranking_departamentos';
      ordem: 'mais' | 'menos';
      quantidade: number;
    }
  | {
      dominio: 'contatos';
      acao: 'listar_pessoas' | 'contar_pessoas';
      departamento?: string;
    }
  | {
      dominio: 'historico';
      acao: 'resumir';
      periodo: PeriodoHistoricoAssistente;
      tipo?: TipoHistorico;
    }
  | {
      dominio: 'historico';
      acao: 'consultar_ultimo';
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
  possuiUltimoContato?: boolean;
  aguardandoRefinoContato?: boolean;
  ultimoDepartamento?: string;
  telaAtual?: string;
}

export interface ResultadoInterpretacaoAssistente {
  comando: ComandoAssistente;
  transcricao: string;
}

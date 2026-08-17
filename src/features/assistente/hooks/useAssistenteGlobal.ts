import Constants from 'expo-constants';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';

import {
  getCurrentRouteName,
  navigateBack,
  navigateToDrawerScreen,
  navigateToMenu,
} from '../../../application/navigation/navigationService';
import type {MenuRouteName} from '../../../application/navigation/menuRegistry';
import type {Filial} from '../../filiais/models/Filial';
import useStrapiClient from '../../../core/api/strapiClient';
import {useAuthContext} from '../../../core/auth/AuthContext';
import {useAssistentePreferences} from '../context/AssistentePreferencesContext';
import {useThemeContext} from '../../../core/theme/ThemeContext';
import {resolveMenuNavigation} from '../../../application/navigation/menuRegistry';
import useRotaPorVoz from '../../rotas/hooks/useRotaPorVoz';
import {useRotasContext} from '../../rotas/RotasContext';
import type {
  ComandoAssistente,
  DestinoAssistente,
  ResultadoInterpretacaoAssistente,
  TopicoAjudaAssistente,
} from '../models/ComandoAssistente';
import type {MemoriaAssistenteOrquestrador} from '../models/AssistenteOrquestrador';
import {
  conversarComAssistenteOrquestrador,
  limparCacheAssistenteOrquestrador,
} from '../services/assistenteOrquestradorApi';
import {
  solicitarInterpretacaoAssistenteIa,
  type InteracaoRecenteAssistenteIa,
} from '../services/assistenteIaApi';
import {
  registrarMetricaAssistente,
  type OrigemMetricaAssistente,
  type ResultadoMetricaAssistente,
} from '../services/metricaAssistenteApi';
import {
  aguardarDadosAssistente,
  type ResultadoEsperaAssistente,
} from '../useCases/aguardarDadosAssistente';
import {interpretarComandoAssistente} from '../useCases/interpretarComandoAssistente';
import {deveConsultarOrquestrador} from '../useCases/deveConsultarOrquestrador';
import useChamadosAssistenteHandler from '../handlers/useChamadosAssistenteHandler';
import useContatosAssistenteHandler from '../handlers/useContatosAssistenteHandler';
import useFiliaisAssistenteHandler from '../handlers/useFiliaisAssistenteHandler';
import useHistoricoAssistenteHandler from '../handlers/useHistoricoAssistenteHandler';
import usePontosAssistenteHandler from '../handlers/usePontosAssistenteHandler';
import useAssistenteFalante from './useAssistenteFalante';
import useReconhecimentoVoz, {
  type ErroReconhecimentoVoz,
} from './useReconhecimentoVoz';

interface UseAssistenteGlobalReturn {
  visivel: boolean;
  ativo: boolean;
  ouvindo: boolean;
  processando: boolean;
  transcricao: string | null;
  mensagem: string;
  sugestaoVisivel: boolean;
  respostasFaladasAtivas: boolean;
  sugestoesDinamicas: readonly string[];
  abrir: () => void;
  fechar: () => void;
  ouvir: () => Promise<void>;
  alterarRespostasFaladas: (ativas: boolean) => Promise<void>;
  executarAcaoRapida: (
    texto: string,
    comando: ComandoAssistente,
  ) => void;
  executarSugestao: (texto: string) => void;
  fecharSugestao: () => void;
}

interface UseAssistenteGlobalParams {
  iaHabilitada: boolean;
  orquestradorHabilitado: boolean;
}

const MENSAGEM_INICIAL =
  'Como posso ajudar? Monte uma rota, procure locais, consulte históricos, contatos ou dados das filiais.';

const ORIENTACOES: Record<TopicoAjudaAssistente, string> = {
  rotas:
    'Diga os números na ordem da visita, por exemplo: primeiro 25, depois 35 e por fim 48. Você também pode reorganizar a rota, contar filiais por cidade e consultar endereço, telefone, horário, gerente, supervisor e CNPJ de uma loja.',
  pontos:
    'Peça o restaurante ou posto mais próximo, ou procure pelo nome e pela cidade. Para iniciar uma rota, eu sempre mostro uma confirmação antes de continuar.',
  contatos:
    'Peça pelo nome, departamento, ramal, DDR ou e-mail. Também posso listar departamentos e pessoas. Depois de um resultado, continue com: e o ramal dela? ou quem mais trabalha nesse departamento?',
  historico:
    'Consulte hoje, ontem, os últimos sete dias, este mês ou a visita mais recente. Você também pode filtrar por filiais, restaurantes ou postos.',
  chamados:
    'Eu posso informar um resumo dos chamados do seu setor ou abrir a tela de chamados. A alteração dos chamados continua sendo feita no fluxo próprio da tela.',
  preventiva:
    'Abra Patrimônio, selecione a filial e preencha o registro do serviço e dos equipamentos.',
  perfil:
    'No perfil você consulta seus dados, adiciona o e-mail Drogal e abre a opção de alterar senha. Essas alterações também são registradas na auditoria.',
};

interface CapacidadeAssistente {
  rota: MenuRouteName;
  descricao: string;
  resumoFalado: string;
}

const CAPACIDADES_POR_MENU: readonly CapacidadeAssistente[] = [
  {
    rota: 'Home',
    descricao:
      'Montar, consultar e reorganizar rotas de filiais, incluindo desfazer alterações.',
    resumoFalado: 'montar e reorganizar rotas de filiais',
  },
  {
    rota: 'MapaLojas',
    descricao:
      'Localizar filiais, consultar seus dados e analisar quantidade por cidade ou região.',
    resumoFalado: 'localizar filiais, consultar seus dados e analisar sua distribuição',
  },
  {
    rota: 'Pontos',
    descricao:
      'Encontrar restaurantes e postos próximos, mostrar no mapa e iniciar a navegação.',
    resumoFalado: 'encontrar restaurantes e postos próximos',
  },
  {
    rota: 'Contatos',
    descricao:
      'Localizar contatos, listar departamentos e consultar as pessoas de cada área.',
    resumoFalado: 'consultar contatos, departamentos e ramais',
  },
  {
    rota: 'Historico',
    descricao:
      'Consultar períodos, tipos de destino e a visita mais recente.',
    resumoFalado: 'resumir seu histórico',
  },
  {
    rota: 'Chamados',
    descricao: 'Consultar o resumo dos chamados do seu setor.',
    resumoFalado: 'consultar chamados',
  },
  {
    rota: 'Patrimonio',
    descricao: 'Abrir e explicar o fluxo de registro de patrimônio.',
    resumoFalado: 'orientar sobre patrimônio',
  },
  {
    rota: 'Admin',
    descricao: 'Abrir a área administrativa quando autorizada.',
    resumoFalado: 'abrir a área administrativa',
  },
];

/**
 * Monta uma ajuda coerente com os menus realmente liberados para a sessão.
 */
const criarResumoCapacidades = (
  menusPermitidos: ReadonlySet<MenuRouteName>,
): {visual: string; falado: string} => {
  const capacidades = CAPACIDADES_POR_MENU.filter(item =>
    menusPermitidos.has(item.rota),
  );
  const descricoes = capacidades.map(item => `• ${item.descricao}`);
  const recursosGerais = [
    '• Consultar seus dados de perfil e a versão instalada.',
    '• Alterar o tema, controlar a voz e enviar sugestões.',
  ];
  const resumosFalados = capacidades.map(item => item.resumoFalado);
  const capacidadesFaladas =
    resumosFalados.length > 0
      ? `Posso ${resumosFalados.join(', ')}.`
      : 'Posso ajudar com os recursos gerais do aplicativo.';

  return {
    visual: [
      'Posso ajudar nestas áreas:',
      '',
      ...descricoes,
      ...recursosGerais,
      '',
      'Você pode falar naturalmente ou usar os atalhos abaixo.',
    ].join('\n'),
    falado:
      `${capacidadesFaladas} Também posso consultar seus dados, ` +
      'alterar preferências e enviar sugestões.',
  };
};

const MENSAGENS_ERRO: Record<
  ErroReconhecimentoVoz,
  {titulo: string; mensagem: string}
> = {
  modulo_ausente: {
    titulo: 'Nova instalação necessária',
    mensagem: 'Esta instalação ainda não contém o recurso de voz. Instale uma nova build.',
  },
  servico_indisponivel: {
    titulo: 'Serviço de voz indisponível',
    mensagem: 'Ative ou atualize o reconhecimento de voz nas configurações do aparelho.',
  },
  permissao_negada: {
    titulo: 'Permissão necessária',
    mensagem: 'Permita o uso do microfone nas configurações do aplicativo.',
  },
  sem_fala: {
    titulo: 'Não consegui ouvir',
    mensagem: 'Toque no microfone e tente falar novamente.',
  },
  sem_conexao: {
    titulo: 'Reconhecimento sem conexão',
    mensagem: 'Verifique sua internet e tente novamente.',
  },
  ocupado: {
    titulo: 'Microfone ocupado',
    mensagem: 'Aguarde um instante e tente novamente.',
  },
  falha: {
    titulo: 'Não foi possível reconhecer',
    mensagem: 'Tente novamente em alguns segundos.',
  },
};

const DESTINO_PARA_ROTA: Partial<
  Record<DestinoAssistente, MenuRouteName>
> = {
  inicio: 'Home',
  mapa_filiais: 'MapaLojas',
  historico: 'Historico',
  pontos: 'Pontos',
  preventiva: 'Patrimonio',
  chamados: 'Chamados',
  contatos: 'Contatos',
  admin: 'Admin',
};

const ROTULO_DESTINO: Record<DestinoAssistente, string> = {
  inicio: 'início',
  mapa_filiais: 'mapa de filiais',
  historico: 'histórico',
  pontos: 'pontos de interesse',
  preventiva: 'patrimônio',
  chamados: 'chamados',
  contatos: 'contatos',
  admin: 'área administrativa',
  perfil: 'perfil',
  sobre: 'sobre o aplicativo',
};

const LIMITE_ESPERA_INTERATIVA_MS = 10_000;
const ATRASO_FEEDBACK_CARREGAMENTO_MS = 600;
const LIMITE_MEMORIA_IA = 4;

/**
 * Centraliza a conversa e distribui cada intenção para o módulo responsável.
 */
export default function useAssistenteGlobal({
  iaHabilitada,
  orquestradorHabilitado,
}: UseAssistenteGlobalParams): UseAssistenteGlobalReturn {
  const client = useStrapiClient();
  const {user} = useAuthContext();
  const {isDarkMode, toggleTheme} = useThemeContext();
  const {
    respostasFaladasAtivas,
    definirRespostasFaladasAtivas,
  } = useAssistentePreferences();
  const {
    rotas,
    setRotas,
    solicitarTracado,
  } = useRotasContext();
  const {falar, parar: pararFala} = useAssistenteFalante();

  const [visivel, setVisivel] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [transcricao, setTranscricao] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState(MENSAGEM_INICIAL);
  const [sugestaoVisivel, setSugestaoVisivel] = useState(false);
  const [sugestoesDinamicas, setSugestoesDinamicas] = useState<string[]>([]);
  const memoriaIaRef = useRef<InteracaoRecenteAssistenteIa[]>([]);
  const memoriaOrquestradorRef = useRef<MemoriaAssistenteOrquestrador>({});

  /** Registra uma interação concluída sem enviar a frase pronunciada. */
  const registrarMetricaUso = useCallback(
    (
      origemInterpretacao: OrigemMetricaAssistente,
      resultado: ResultadoMetricaAssistente,
      dominio: string,
      acao: string,
      iniciadoEm: number,
    ): void => {
      registrarMetricaAssistente(client, {
        tela: getCurrentRouteName() ?? 'Desconhecida',
        origemInterpretacao,
        resultado,
        dominio,
        acao,
        tempoRespostaMs: Date.now() - iniciadoEm,
        versaoApp: Constants.expoConfig?.version,
      });
    },
    [client],
  );

  useEffect(() => {
    memoriaIaRef.current = [];
    memoriaOrquestradorRef.current = {};
    setSugestoesDinamicas([]);
    limparCacheAssistenteOrquestrador();
  }, [user?.username]);

  /**
   * Mantém somente a fala e a intenção recente em memória volátil. Respostas,
   * e-mails, telefones e outros dados consultados nunca são enviados à IA.
   */
  const registrarInteracaoIa = useCallback(
    (texto: string, comando?: ComandoAssistente): void => {
      const textoUsuario = texto.replace(/\s+/g, ' ').trim().slice(0, 320);
      if (!textoUsuario) return;

      memoriaIaRef.current = [
        ...memoriaIaRef.current,
        {
          textoUsuario,
          ...(comando ? {
            dominio: comando.dominio,
            acao: comando.acao,
          } : {}),
        },
      ].slice(-LIMITE_MEMORIA_IA);
    },
    [],
  );

  const menusPermitidos = useMemo(
    () =>
      new Set(
        resolveMenuNavigation(user?.menus ?? []).menus.map(menu => menu.rota),
      ),
    [user?.menus],
  );

  const responder = useCallback(
    (texto: string, textoFalado = texto): void => {
      setMensagem(texto);
      setVisivel(true);
      if (textoFalado) void falar(textoFalado);
    },
    [falar],
  );

  const aguardarComFeedback = useCallback(
    async <T,>(
      promessa: Promise<T>,
      mensagem: string,
    ): Promise<ResultadoEsperaAssistente<T>> => {
      const feedbackTimer = setTimeout(() => {
        responder(mensagem, 'Só um instante. Estou consultando os dados.');
      }, ATRASO_FEEDBACK_CARREGAMENTO_MS);

      try {
        return await aguardarDadosAssistente(
          promessa,
          LIMITE_ESPERA_INTERATIVA_MS,
        );
      } finally {
        clearTimeout(feedbackTimer);
      }
    },
    [responder],
  );

  const solicitarFluxoRota = useCallback((): void => {
    const aberto = navigateToMenu('Home');

    if (!aberto) {
      responder('A navegação ainda não está pronta. Tente novamente.');
      return;
    }

    solicitarTracado();
    setVisivel(false);
  }, [responder, solicitarTracado]);

  const atualizarRota = useCallback(
    (proximasRotas: readonly Filial[]): void => {
      setRotas([...proximasRotas]);
    },
    [setRotas],
  );

  const comandosRota = useRotaPorVoz({
    rotas,
    onAtualizarRota: atualizarRota,
    onTracarRota: solicitarFluxoRota,
    onResponder: responder,
  });

  const temAcesso = useCallback(
    (rota: MenuRouteName): boolean => menusPermitidos.has(rota),
    [menusPermitidos],
  );

  const informarAcessoNegado = useCallback(
    (recurso: string): void => {
      responder(
        `O menu de ${recurso} não está disponível para o seu acesso.`,
      );
    },
    [responder],
  );

  const ocultarAssistente = useCallback((): void => {
    setVisivel(false);
  }, []);

  const {
    pesquisarFiliaisNoMapa,
    consultarFiliais,
    limparContextoFilial,
    obterContextoFilial,
  } =
    useFiliaisAssistenteHandler({
      responder,
      aguardarComFeedback,
      temAcesso,
      informarAcessoNegado,
      ocultarAssistente,
    });

  useEffect(() => {
    limparContextoFilial();
  }, [limparContextoFilial, user?.username]);

  const abrirDestino = useCallback(
    (destino: DestinoAssistente): void => {
      if (destino === 'perfil' || destino === 'sobre') {
        const aberto = navigateToDrawerScreen(
          destino === 'perfil' ? 'EditProfile' : 'Sobre',
        );

        responder(
          aberto
            ? `Abrindo ${ROTULO_DESTINO[destino]}.`
            : 'A navegação ainda não está pronta. Tente novamente.',
        );
        if (aberto) setVisivel(false);
        return;
      }

      const rota = DESTINO_PARA_ROTA[destino];
      if (!rota) return;

      if (!temAcesso(rota)) {
        informarAcessoNegado(ROTULO_DESTINO[destino]);
        return;
      }

      const aberto = navigateToMenu(rota);
      responder(
        aberto
          ? `Abrindo ${ROTULO_DESTINO[destino]}.`
          : 'A navegação ainda não está pronta. Tente novamente.',
      );
      if (aberto) setVisivel(false);
    },
    [informarAcessoNegado, responder, temAcesso],
  );

  const {
    acaoPendente,
    buscarPontoPorNome,
    cancelarAcaoPendente,
    confirmarRotaPonto,
    consultarPontos,
    possuiUltimoPonto,
    prepararRotaUltimoPonto,
  } = usePontosAssistenteHandler({
    responder,
    aguardarComFeedback,
    temAcesso,
    informarAcessoNegado,
    ocultarAssistente,
  });

  const {
    consultarContato,
    limparRefinoContato,
    obterContextoContato,
  } = useContatosAssistenteHandler({
    responder,
    temAcesso,
    informarAcessoNegado,
  });

  const {consultarHistorico} = useHistoricoAssistenteHandler({
    responder,
    temAcesso,
    informarAcessoNegado,
  });
  const {consultarChamados} = useChamadosAssistenteHandler({
    responder,
    temAcesso,
    informarAcessoNegado,
  });

  /** Persiste a preferência de áudio sem acoplar o assistente à Sidebar. */
  const alterarRespostasFaladas = useCallback(
    async (ativas: boolean): Promise<void> => {
      if (ativas === respostasFaladasAtivas) {
        responder(
          `As respostas faladas já estão ${ativas ? 'ativadas' : 'desativadas'}.`,
        );
        return;
      }

      const preferenciaSalva = await definirRespostasFaladasAtivas(ativas);

      if (!preferenciaSalva) {
        responder('Não consegui salvar essa preferência. Tente novamente.');
        return;
      }

      responder(
        `Respostas faladas ${ativas ? 'ativadas' : 'desativadas'}.`,
        ativas ? undefined : '',
      );
    },
    [
      definirRespostasFaladasAtivas,
      responder,
      respostasFaladasAtivas,
    ],
  );

  const executarComandoGlobal = useCallback(
    async ({
      comando,
    }: ResultadoInterpretacaoAssistente): Promise<boolean> => {
      if (comando.dominio !== 'contatos') {
        limparRefinoContato();
      }

      if (acaoPendente && comando.acao !== 'confirmar' && comando.acao !== 'cancelar') {
        cancelarAcaoPendente();
      }

      if (comando.dominio === 'sistema') {
        if (comando.acao === 'ajuda') {
          const ajuda = criarResumoCapacidades(menusPermitidos);

          responder(ajuda.visual, ajuda.falado);
          return true;
        }

        if (comando.acao === 'orientar') {
          responder(ORIENTACOES[comando.topico]);
          return true;
        }

        if (comando.acao === 'confirmar' && acaoPendente) {
          await confirmarRotaPonto();
          return true;
        }

        if (comando.acao === 'cancelar' && acaoPendente) {
          cancelarAcaoPendente();
          responder('Tudo bem. Cancelei essa ação.');
          return true;
        }

        return false;
      }

      if (comando.dominio === 'navegacao') {
        if (comando.acao === 'voltar') {
          responder(
            navigateBack()
              ? 'Voltando para a tela anterior.'
              : 'Você já está na primeira tela.',
          );
          return true;
        }

        if (comando.destino) abrirDestino(comando.destino);
        return true;
      }

      if (comando.dominio === 'mapa') {
        await pesquisarFiliaisNoMapa(comando);
        return true;
      }

      if (comando.dominio === 'filiais') {
        await consultarFiliais(comando);
        return true;
      }

      if (comando.dominio === 'pontos') {
        if (comando.acao === 'tracar_ultimo') {
          prepararRotaUltimoPonto();
          return true;
        }

        if (comando.acao === 'buscar') {
          await buscarPontoPorNome(comando);
          return true;
        }

        await consultarPontos(comando);
        return true;
      }

      if (comando.dominio === 'contatos') {
        await consultarContato(comando);
        return true;
      }

      if (comando.dominio === 'historico') {
        await consultarHistorico(comando);
        return true;
      }

      if (comando.dominio === 'chamados') {
        await consultarChamados();
        return true;
      }

      if (comando.dominio === 'preferencias') {
        if (comando.acao === 'consultar_voz') {
          responder(
            `As respostas faladas estão ${respostasFaladasAtivas ? 'ativadas' : 'desativadas'}. O microfone continua disponível nos dois modos.`,
          );
          return true;
        }

        if (comando.acao === 'definir_voz') {
          await alterarRespostasFaladas(comando.ativa);
          return true;
        }

        const desejaEscuro = comando.modo === 'escuro';

        if (desejaEscuro === isDarkMode) {
          responder(`O modo ${comando.modo} já está ativado.`);
          return true;
        }

        await toggleTheme();
        responder(`Modo ${comando.modo} ativado.`);
        return true;
      }

      if (comando.dominio === 'perfil') {
        if (comando.campo === 'email') {
          responder(
            user?.emailSec
              ? `Seu e-mail Drogal cadastrado é ${user.emailSec}.`
              : 'Você ainda não possui um e-mail Drogal cadastrado. Posso abrir seu perfil para adicionar.',
          );
          return true;
        }

        if (comando.campo === 'setor') {
          responder(
            user?.setor
              ? `Seu setor cadastrado é ${user.setor}.`
              : 'Seu setor não está informado no cadastro.',
          );
          return true;
        }

        const dados = [
          user?.username ? `usuário ${user.username}` : null,
          user?.setor ? `setor ${user.setor}` : null,
          user?.emailSec ? `e-mail ${user.emailSec}` : 'sem e-mail cadastrado',
        ].filter(Boolean);
        responder(`Seu perfil possui: ${dados.join(', ')}.`);
        return true;
      }

      if (comando.dominio === 'aplicativo') {
        const versao = Constants.expoConfig?.version ?? 'não informada';
        responder(`A versão instalada do aplicativo é ${versao}.`);
        return true;
      }

      if (comando.dominio === 'sugestoes') {
        setSugestaoVisivel(true);
        responder('Abrindo o formulário de sugestão.');
        return true;
      }

      return false;
    },
    [
      acaoPendente,
      abrirDestino,
      buscarPontoPorNome,
      cancelarAcaoPendente,
      confirmarRotaPonto,
      consultarChamados,
      consultarFiliais,
      consultarContato,
      consultarHistorico,
      consultarPontos,
      isDarkMode,
      limparRefinoContato,
      alterarRespostasFaladas,
      menusPermitidos,
      pesquisarFiliaisNoMapa,
      prepararRotaUltimoPonto,
      responder,
      respostasFaladasAtivas,
      toggleTheme,
      user?.emailSec,
      user?.setor,
      user?.username,
    ],
  );

  /**
   * Prioriza a árvore determinística e o interpretador especializado de rotas.
   * Intenções estruturadas da IA chegam ao executor por outra entrada, depois
   * de serem reconstruídas pela allowlist local.
   */
  const tentarProcessarLocalmente = useCallback(
    async (
      transcricoes: readonly string[],
      textoMemoria = transcricoes[0] ?? '',
      origemMetrica: OrigemMetricaAssistente = 'LOCAL',
      iniciadoEm = Date.now(),
    ): Promise<boolean> => {
      const contextoContato = obterContextoContato();
      const contextoFilial = obterContextoFilial();
      const interpretacaoGlobal = interpretarComandoAssistente(
        transcricoes,
        {
          possuiUltimoPonto: possuiUltimoPonto(),
          ...contextoContato,
          ...contextoFilial,
          telaAtual: getCurrentRouteName(),
        },
      );

      if (interpretacaoGlobal) {
        const processado = await executarComandoGlobal(interpretacaoGlobal);
        if (processado) {
          registrarInteracaoIa(textoMemoria, interpretacaoGlobal.comando);
          registrarMetricaUso(
            origemMetrica,
            'SUCESSO',
            interpretacaoGlobal.comando.dominio,
            interpretacaoGlobal.comando.acao,
            iniciadoEm,
          );
          return true;
        }
      }

      const processadoComoRota = temAcesso('Home')
        ? comandosRota.tentarProcessarTranscricoes(transcricoes)
        : false;
      if (processadoComoRota) {
        registrarInteracaoIa(textoMemoria);
        registrarMetricaUso(
          origemMetrica,
          'SUCESSO',
          'rotas',
          'comando_voz',
          iniciadoEm,
        );
      }
      return processadoComoRota;
    },
    [
      comandosRota,
      executarComandoGlobal,
      obterContextoContato,
      obterContextoFilial,
      possuiUltimoPonto,
      registrarInteracaoIa,
      registrarMetricaUso,
      temAcesso,
    ],
  );

  /**
   * Atalhos visuais já representam intenções validadas. Executá-los diretamente
   * evita que contexto ou variações do reconhecimento alterem seu significado.
   */
  const executarAcaoRapida = useCallback(
    (texto: string, comando: ComandoAssistente): void => {
      setTranscricao(texto);

      void (async () => {
        const iniciadoEm = Date.now();
        setProcessando(true);
        try {
          const processado = await executarComandoGlobal({
            comando,
            transcricao: texto,
          });
          if (processado) {
            registrarInteracaoIa(texto, comando);
            registrarMetricaUso(
              'ATALHO',
              'SUCESSO',
              comando.dominio,
              comando.acao,
              iniciadoEm,
            );
          } else {
            registrarMetricaUso(
              'ATALHO',
              'NAO_COMPREENDIDO',
              comando.dominio,
              comando.acao,
              iniciadoEm,
            );
          }
        } finally {
          setProcessando(false);
        }
      })();
    },
    [executarComandoGlobal, registrarInteracaoIa, registrarMetricaUso],
  );

  /**
   * Consulta o backend server-driven. Uma resposta ausente ou inválida não
   * encerra a interação: o interpretador local e o fallback legado continuam.
   */
  const tentarProcessarNoOrquestrador = useCallback(
    async (
      transcricoes: readonly string[],
      iniciadoEm: number,
    ): Promise<boolean> => {
      if (!orquestradorHabilitado || !transcricoes[0]?.trim()) return false;
      const feedbackTimer = setTimeout(() => {
        setMensagem('Consultando os dados…');
      }, ATRASO_FEEDBACK_CARREGAMENTO_MS);
      const resposta = await conversarComAssistenteOrquestrador(client, {
        transcricoes,
        telaAtual: getCurrentRouteName(),
        memoria: memoriaOrquestradorRef.current,
      }).finally(() => clearTimeout(feedbackTimer));
      if (!resposta?.processado) return false;

      memoriaOrquestradorRef.current = resposta.memoria;
      setSugestoesDinamicas(resposta.sugestoes);
      const mensagemResposta = resposta.precisaEsclarecimento
        ? resposta.esclarecimento || resposta.texto
        : resposta.texto;
      responder(mensagemResposta, resposta.textoFalado || mensagemResposta);
      registrarMetricaUso(
        resposta.fonte === 'BACKEND' ? 'BACKEND' : 'GEMINI',
        resposta.precisaEsclarecimento ? 'ESCLARECIMENTO' : 'SUCESSO',
        resposta.dominio,
        resposta.acao,
        iniciadoEm,
      );
      return true;
    },
    [client, orquestradorHabilitado, registrarMetricaUso, responder],
  );

  const handleTranscricoes = useCallback(
    (
      transcricoes: readonly string[],
      origemEntrada: OrigemMetricaAssistente = 'LOCAL',
    ): void => {
      const primeiraTranscricao = transcricoes[0]?.trim() ?? '';
      setTranscricao(primeiraTranscricao);

      void (async () => {
        const iniciadoEm = Date.now();
        setProcessando(true);

        try {
          let orquestradorConsultado = false;
          if (
            orquestradorHabilitado &&
            deveConsultarOrquestrador(primeiraTranscricao)
          ) {
            orquestradorConsultado = true;
            if (await tentarProcessarNoOrquestrador(transcricoes, iniciadoEm)) {
              return;
            }
          }

          if (
            await tentarProcessarLocalmente(
              transcricoes,
              primeiraTranscricao,
              origemEntrada,
              iniciadoEm,
            )
          ) return;

          if (
            orquestradorHabilitado &&
            !orquestradorConsultado &&
            await tentarProcessarNoOrquestrador(transcricoes, iniciadoEm)
          ) return;

          if (iaHabilitada && primeiraTranscricao) {
            const feedbackTimer = setTimeout(() => {
              setMensagem('Estou interpretando o seu pedido…');
            }, ATRASO_FEEDBACK_CARREGAMENTO_MS);

            try {
              const contextoContatoIa = obterContextoContato();
              const contextoFilialIa = obterContextoFilial();
              const respostaIa = await solicitarInterpretacaoAssistenteIa(
                client,
                {
                  transcricoes,
                  telaAtual: getCurrentRouteName(),
                  contextoConversa: {
                    interacoesRecentes: memoriaIaRef.current,
                    rotaAtual: rotas.map(filial => filial.codigofilial),
                    possuiUltimoPonto: possuiUltimoPonto(),
                    possuiUltimoContato:
                      contextoContatoIa.possuiUltimoContato === true,
                    possuiUltimaFilial:
                      contextoFilialIa.possuiUltimaFilial === true,
                    ultimoDepartamento: contextoContatoIa.ultimoDepartamento,
                  },
                },
              );

              if (respostaIa.interpretado && respostaIa.comando) {
                const processado = await executarComandoGlobal({
                  comando: respostaIa.comando,
                  transcricao: primeiraTranscricao,
                });
                if (processado) {
                  registrarInteracaoIa(
                    primeiraTranscricao,
                    respostaIa.comando,
                  );
                  registrarMetricaUso(
                    'GEMINI',
                    'SUCESSO',
                    respostaIa.comando.dominio,
                    respostaIa.comando.acao,
                    iniciadoEm,
                  );
                  return;
                }
              }

              if (
                respostaIa.interpretado &&
                respostaIa.comandoCanonico &&
                await tentarProcessarLocalmente([
                  respostaIa.comandoCanonico,
                ], primeiraTranscricao, 'GEMINI', iniciadoEm)
              ) {
                return;
              }

              if (
                respostaIa.precisaEsclarecimento &&
                respostaIa.esclarecimento
              ) {
                responder(respostaIa.esclarecimento);
                registrarMetricaUso(
                  'GEMINI',
                  'ESCLARECIMENTO',
                  'sistema',
                  'esclarecer',
                  iniciadoEm,
                );
                return;
              }
            } finally {
              clearTimeout(feedbackTimer);
            }
          }

          if (!temAcesso('Home')) {
            informarAcessoNegado('rotas');
            registrarMetricaUso(
              iaHabilitada ? 'GEMINI' : origemEntrada,
              'ERRO',
              'sistema',
              'acesso_negado',
              iniciadoEm,
            );
            return;
          }

          registrarMetricaUso(
            iaHabilitada ? 'GEMINI' : origemEntrada,
            'NAO_COMPREENDIDO',
            'sistema',
            'comando_nao_reconhecido',
            iniciadoEm,
          );
          comandosRota.processarTranscricoes(transcricoes);
        } finally {
          setProcessando(false);
        }
      })();
    },
    [
      client,
      comandosRota,
      iaHabilitada,
      informarAcessoNegado,
      obterContextoContato,
      obterContextoFilial,
      orquestradorHabilitado,
      possuiUltimoPonto,
      registrarInteracaoIa,
      registrarMetricaUso,
      responder,
      rotas,
      temAcesso,
      tentarProcessarLocalmente,
      tentarProcessarNoOrquestrador,
    ],
  );

  const handleErro = useCallback(
    (erro: ErroReconhecimentoVoz): void => {
      const erroMapeado = MENSAGENS_ERRO[erro];

      Toast.show({
        type: erro === 'sem_fala' ? 'info' : 'error',
        text1: erroMapeado.titulo,
        text2: erroMapeado.mensagem,
      });
      responder(erroMapeado.mensagem);
      registrarMetricaUso(
        'LOCAL',
        'ERRO',
        'reconhecimento',
        erro,
        Date.now(),
      );
    },
    [registrarMetricaUso, responder],
  );

  const reconhecimento = useReconhecimentoVoz({
    onTranscricoes: handleTranscricoes,
    onErro: handleErro,
  });

  const ouvir = useCallback(async (): Promise<void> => {
    setVisivel(true);
    await pararFala();
    await reconhecimento.alternarReconhecimento();
  }, [pararFala, reconhecimento.alternarReconhecimento]);

  const abrir = useCallback((): void => {
    setVisivel(true);
  }, []);

  const fechar = useCallback((): void => {
    reconhecimento.cancelarReconhecimento();
    void pararFala();
    setVisivel(false);
  }, [pararFala, reconhecimento.cancelarReconhecimento]);

  const executarSugestao = useCallback(
    (texto: string): void => {
      handleTranscricoes([texto], 'ATALHO');
    },
    [handleTranscricoes],
  );

  return {
    visivel,
    ativo: reconhecimento.ativo,
    ouvindo: reconhecimento.ouvindo,
    processando,
    transcricao,
    mensagem,
    sugestaoVisivel,
    respostasFaladasAtivas,
    sugestoesDinamicas,
    abrir,
    fechar,
    ouvir,
    alterarRespostasFaladas,
    executarAcaoRapida,
    executarSugestao,
    fecharSugestao: () => setSugestaoVisivel(false),
  };
}

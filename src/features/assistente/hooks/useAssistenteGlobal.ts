import Constants from 'expo-constants';
import {useCallback, useMemo, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';

import {
  navigateBack,
  navigateToDrawerScreen,
  navigateToMenu,
} from '../../../application/navigation/navigationService';
import type {MenuRouteName} from '../../../application/navigation/menuRegistry';
import type {Filial} from '../../filiais/models/Filial';
import useStrapiClient from '../../../core/api/strapiClient';
import {useAuthContext} from '../../../core/auth/AuthContext';
import useLocation from '../../../core/location/useLocation';
import {useAssistentePreferences} from '../../../core/preferences/AssistentePreferencesContext';
import {useThemeContext} from '../../../core/theme/ThemeContext';
import useChamados from '../../chamados/hooks/useChamados';
import useContatos from '../../contatos/hooks/useContatos';
import useHistoricoOffline from '../../historico/hooks/useHistoricoOffline';
import useHistoricoRotas from '../../historico/hooks/useHistoricoRotas';
import {TIPO_HISTORICO} from '../../historico/models/Historico';
import {registrarHistoricoRota} from '../../historico/useCases/registrarHistoricoRota';
import {resolveMenuNavigation} from '../../../application/navigation/menuRegistry';
import usePontos from '../../pontos/hooks/usePontos';
import {usePontosContext} from '../../pontos/PontosContext';
import type {PontoInteresse} from '../../pontos/models/Ponto';
import {iniciarRotaPonto} from '../../pontos/useCases/iniciarRotaPonto';
import useRotaPorVoz from '../../rotas/hooks/useRotaPorVoz';
import {useRotasContext} from '../../rotas/RotasContext';
import MapService from '../../rotas/services/mapService';
import type {
  ComandoAssistente,
  DestinoAssistente,
  ResultadoInterpretacaoAssistente,
  TopicoAjudaAssistente,
} from '../models/ComandoAssistente';
import {consultarHistoricoAssistente} from '../services/consultasAssistenteService';
import {buscarContatosAssistente} from '../useCases/buscarContatosAssistente';
import {encontrarPontosProximos, type PontoProximo} from '../useCases/encontrarPontosProximos';
import {interpretarComandoAssistente} from '../useCases/interpretarComandoAssistente';
import useResetOnUserChange from '../../../shared/hooks/useResetOnUserChange';
import useAssistenteFalante from './useAssistenteFalante';
import useReconhecimentoVoz, {
  type ErroReconhecimentoVoz,
} from './useReconhecimentoVoz';

export type NavegadorAssistente = 'google' | 'waze';

interface UseAssistenteGlobalReturn {
  visivel: boolean;
  ativo: boolean;
  ouvindo: boolean;
  processando: boolean;
  transcricao: string | null;
  mensagem: string;
  navegadorVisivel: boolean;
  sugestaoVisivel: boolean;
  salvandoHistorico: boolean;
  respostasFaladasAtivas: boolean;
  abrir: () => void;
  fechar: () => void;
  ouvir: () => Promise<void>;
  executarSugestao: (texto: string) => void;
  abrirNavegador: (navegador: NavegadorAssistente) => Promise<void>;
  fecharNavegador: () => void;
  fecharSugestao: () => void;
}

interface AcaoPendentePonto {
  tipo: 'rota_ponto';
  pontoProximo: PontoProximo;
}

const MENSAGEM_INICIAL =
  'Como posso ajudar? Você pode pedir rotas, pontos próximos, contatos, histórico, chamados ou abrir uma tela.';

const ORIENTACOES: Record<TopicoAjudaAssistente, string> = {
  rotas:
    'Para montar uma rota, diga os números das filiais, por exemplo: traçar rota para as filiais 25, 35 e 48. Depois você pode remover, trocar ou mudar a ordem e pedir para abrir a navegação.',
  pontos:
    'Você pode pedir o restaurante ou posto mais próximo. Eu consulto os pontos cadastrados, mostro a distância aproximada em linha reta e posso abrir a navegação após sua confirmação.',
  contatos:
    'Peça pelo nome, departamento, ramal ou e-mail. Se houver mais de um resultado, eu apresento as opções e você pode falar apenas o nome completo para refinar.',
  historico:
    'O histórico guarda as rotas realmente abertas, separado por usuário. Você pode pedir um resumo geral, de hoje, de filiais, restaurantes ou postos.',
  chamados:
    'Eu posso informar um resumo dos chamados do seu setor ou abrir a tela de chamados. A alteração dos chamados continua sendo feita no fluxo próprio da tela.',
  preventiva:
    'Abra Preventiva, selecione a filial e preencha o checklist. O registro de patrimônio fica no fluxo específico e exige os dados do equipamento antes do envio.',
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
    descricao: 'Abrir o mapa de filiais.',
    resumoFalado: 'abrir o mapa de filiais',
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
      'Localizar contatos por nome, departamento, ramal, DDR ou e-mail.',
    resumoFalado: 'consultar contatos e ramais',
  },
  {
    rota: 'Historico',
    descricao:
      'Consultar resumos do histórico geral, de hoje ou por tipo de destino.',
    resumoFalado: 'resumir seu histórico',
  },
  {
    rota: 'Chamados',
    descricao: 'Consultar o resumo dos chamados do seu setor.',
    resumoFalado: 'consultar chamados',
  },
  {
    rota: 'Preventiva',
    descricao: 'Abrir e explicar os fluxos de preventiva e patrimônio.',
    resumoFalado: 'orientar sobre preventiva e patrimônio',
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
  preventiva: 'Preventiva',
  chamados: 'Chamados',
  contatos: 'Contatos',
  admin: 'Admin',
};

const ROTULO_DESTINO: Record<DestinoAssistente, string> = {
  inicio: 'início',
  mapa_filiais: 'mapa de filiais',
  historico: 'histórico',
  pontos: 'pontos de interesse',
  preventiva: 'preventiva',
  chamados: 'chamados',
  contatos: 'contatos',
  admin: 'área administrativa',
  perfil: 'perfil',
  sobre: 'sobre o aplicativo',
};

const formatarDistancia = (distanciaKm: number): string =>
  distanciaKm < 1
    ? `${Math.max(1, Math.round(distanciaKm * 1000))} metros`
    : `${distanciaKm.toFixed(1).replace('.', ',')} quilômetros`;

const obterRotuloCategoria = (categoria: PontoInteresse['categoria']): string =>
  categoria === 'Restaurante' ? 'restaurante' : 'posto';

/**
 * Centraliza a conversa e distribui cada intenção para o módulo responsável.
 */
export default function useAssistenteGlobal(): UseAssistenteGlobalReturn {
  const client = useStrapiClient();
  const {user} = useAuthContext();
  const {isDarkMode, toggleTheme} = useThemeContext();
  const {
    respostasFaladasAtivas,
    definirRespostasFaladasAtivas,
  } = useAssistentePreferences();
  const {
    currentLocation,
    currentCity,
    getLocation,
  } = useLocation();
  const {rotas, setRotas} = useRotasContext();
  const {setPontoDestacado} = usePontosContext();
  const {pontos, getPontos} = usePontos({loadOnMount: false});
  const {contatos, recarregar: carregarContatos} = useContatos({
    loadOnMount: false,
  });
  const {chamados, reload: carregarChamados} = useChamados({
    loadOnMount: false,
  });
  const {
    postHistoricoRota,
    loading: salvandoHistorico,
  } = useHistoricoRotas({loadOnMount: false});
  const {
    adicionarHistoricoPendente,
    sincronizarHistoricosPendentes,
  } = useHistoricoOffline();
  const {falar, parar: pararFala} = useAssistenteFalante();

  const [visivel, setVisivel] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [transcricao, setTranscricao] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState(MENSAGEM_INICIAL);
  const [acaoPendente, setAcaoPendente] =
    useState<AcaoPendentePonto | null>(null);
  const [navegadorVisivel, setNavegadorVisivel] = useState(false);
  const [sugestaoVisivel, setSugestaoVisivel] = useState(false);
  const ultimoPontoRef = useRef<PontoProximo | null>(null);
  const aguardandoRefinoContatoRef = useRef(false);

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

  const solicitarNavegador = useCallback((): void => {
    setNavegadorVisivel(true);
    setVisivel(true);
  }, []);

  const atualizarRota = useCallback(
    (proximasRotas: readonly Filial[]): void => {
      setRotas([...proximasRotas]);
    },
    [setRotas],
  );

  const comandosRota = useRotaPorVoz({
    rotas,
    onAtualizarRota: atualizarRota,
    onTracarRota: solicitarNavegador,
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
    },
    [informarAcessoNegado, responder, temAcesso],
  );

  const obterLocalizacao = useCallback(async () => {
    if (currentLocation) return currentLocation;

    const localizacao = await getLocation(true);

    if (!localizacao) {
      responder(
        'Preciso da sua localização para encontrar os pontos mais próximos.',
      );
    }

    return localizacao;
  }, [currentLocation, getLocation, responder]);

  const consultarPontos = useCallback(
    async (
      comando: Extract<
        ComandoAssistente,
        {
          dominio: 'pontos';
          acao: 'mostrar_proximos' | 'tracar_mais_proximo';
        }
      >,
    ): Promise<void> => {
      if (!temAcesso('Pontos')) {
        informarAcessoNegado('pontos de interesse');
        return;
      }

      const localizacao = await obterLocalizacao();
      if (!localizacao) return;

      const pontosDisponiveis =
        pontos.length > 0 ? pontos : await getPontos();

      if (!pontosDisponiveis) {
        responder(
          'Não consegui carregar os pontos de interesse. Verifique sua conexão.',
        );
        return;
      }

      const proximos = encontrarPontosProximos(
        pontosDisponiveis,
        localizacao,
        comando.categoria,
        comando.quantidade,
      );

      if (proximos.length === 0) {
        responder(
          `Não encontrei ${obterRotuloCategoria(comando.categoria)} com localização válida.`,
        );
        return;
      }

      const maisProximo = proximos[0];
      ultimoPontoRef.current = maisProximo;

      if (comando.acao === 'tracar_mais_proximo') {
        setAcaoPendente({
          tipo: 'rota_ponto',
          pontoProximo: maisProximo,
        });
        responder(
          `O ${obterRotuloCategoria(comando.categoria)} mais próximo é ${maisProximo.ponto.descricao}, a aproximadamente ${formatarDistancia(maisProximo.distanciaKm)} em linha reta. Diga confirmar para abrir a rota ou cancelar.`,
        );
        return;
      }

      const lista = proximos
        .map(
          ({ponto, distanciaKm}) =>
            `${ponto.descricao}, ${formatarDistancia(distanciaKm)}`,
        )
        .join('; ');

      setPontoDestacado(maisProximo.ponto);
      navigateToMenu('Pontos');
      responder(
        proximos.length === 1
          ? `Encontrei ${maisProximo.ponto.descricao}, a aproximadamente ${formatarDistancia(maisProximo.distanciaKm)} em linha reta. Mostrei o local no mapa.`
          : `Os mais próximos são: ${lista}. Mostrei o primeiro no mapa.`,
      );
    },
    [
      getPontos,
      informarAcessoNegado,
      obterLocalizacao,
      pontos,
      responder,
      setPontoDestacado,
      temAcesso,
    ],
  );

  const prepararRotaUltimoPonto = useCallback((): void => {
    const ultimoPonto = ultimoPontoRef.current;

    if (!ultimoPonto) {
      responder(
        'Ainda não tenho um ponto recente. Peça primeiro um restaurante ou posto próximo.',
      );
      return;
    }

    setAcaoPendente({
      tipo: 'rota_ponto',
      pontoProximo: ultimoPonto,
    });
    responder(
      `Você quer abrir a rota para ${ultimoPonto.ponto.descricao}? Diga confirmar ou cancelar.`,
    );
  }, [responder]);

  const confirmarRotaPonto = useCallback(
    async (pendencia: AcaoPendentePonto): Promise<void> => {
      setAcaoPendente(null);
      responder(`Abrindo a rota para ${pendencia.pontoProximo.ponto.descricao}.`);

      try {
        const resultado = await iniciarRotaPonto(
          {
            ponto: pendencia.pontoProximo.ponto,
            cidadeOrigem: currentCity,
          },
          {
            abrirRota: MapService.openGoogleMapsRoute,
            enviarHistorico: postHistoricoRota,
            sincronizarHistoricos: sincronizarHistoricosPendentes,
            adicionarHistoricoPendente,
          },
        );

        if (resultado.status === 'rota_nao_aberta') {
          responder('Não foi possível abrir a navegação para esse ponto.');
        }
      } catch (error: unknown) {
        console.error('Erro ao iniciar rota pelo assistente:', error);
        responder('Não foi possível abrir essa rota. Tente novamente.');
      }
    },
    [
      adicionarHistoricoPendente,
      currentCity,
      postHistoricoRota,
      responder,
      sincronizarHistoricosPendentes,
    ],
  );

  const consultarContato = useCallback(
    async (
      comando: Extract<ComandoAssistente, {dominio: 'contatos'}>,
    ): Promise<void> => {
      if (!temAcesso('Contatos')) {
        informarAcessoNegado('contatos');
        return;
      }

      const contatosDisponiveis =
        contatos.length > 0 ? contatos : await carregarContatos();

      if (!contatosDisponiveis) {
        responder('Não consegui carregar os contatos. Verifique sua conexão.');
        return;
      }

      const resultados = buscarContatosAssistente(
        contatosDisponiveis,
        comando.termo,
      );

      if (resultados.length === 0) {
        aguardandoRefinoContatoRef.current = false;
        responder(`Não encontrei contato para ${comando.termo}.`);
        return;
      }

      if (resultados.length === 1 || resultados[0].pontuacao > resultados[1].pontuacao) {
        aguardandoRefinoContatoRef.current = false;
        const contato = resultados[0].contato;
        const detalhesVisuais = [
          contato.ramal ? `Ramal: ${contato.ramal}` : null,
          contato.ddr ? `DDR: ${contato.ddr}` : null,
          contato.email ? `E-mail: ${contato.email}` : null,
        ].filter(Boolean);
        const detalhesFalados = [
          contato.ramal ? `ramal ${contato.ramal}` : null,
          contato.ddr ? `DDR ${contato.ddr}` : null,
        ].filter(Boolean);

        responder(
          `${contato.colaboradores} — ${contato.departamento}. ${detalhesVisuais.join(' · ') || 'Sem telefone informado.'}`,
          `${contato.colaboradores}, do departamento ${contato.departamento}. ${detalhesFalados.join(', ') || 'Sem telefone informado.'}`,
        );
        return;
      }

      const nomes = resultados
        .slice(0, 3)
        .map(resultado => resultado.contato.colaboradores)
        .join(', ');

      aguardandoRefinoContatoRef.current = true;
      responder(
        `Encontrei mais de um contato: ${nomes}. Fale o nome completo ou o ramal para refinar.`,
      );
    },
    [
      carregarContatos,
      contatos,
      informarAcessoNegado,
      responder,
      temAcesso,
    ],
  );

  const consultarHistorico = useCallback(
    async (
      comando: Extract<ComandoAssistente, {dominio: 'historico'}>,
    ): Promise<void> => {
      if (!temAcesso('Historico')) {
        informarAcessoNegado('histórico');
        return;
      }

      if (!user?.username) {
        responder('Não consegui identificar o usuário atual.');
        return;
      }

      try {
        const resumo = await consultarHistoricoAssistente(client, {
          username: user.username,
          periodo: comando.periodo,
          tipo: comando.tipo,
        });
        const periodo = comando.periodo === 'hoje' ? 'hoje' : 'no histórico';
        const tipo =
          comando.tipo === TIPO_HISTORICO.RESTAURANTE
            ? ' de restaurantes'
            : comando.tipo === TIPO_HISTORICO.POSTO_COMBUSTIVEL
              ? ' de postos'
              : comando.tipo === TIPO_HISTORICO.LOJA
                ? ' de filiais'
                : '';

        responder(
          resumo.total === 0
            ? `Você não possui registros${tipo} ${periodo}.`
            : `Encontrei ${resumo.total} ${resumo.total === 1 ? 'registro' : 'registros'}${tipo} ${periodo}.`,
        );
      } catch (error: unknown) {
        console.error('Erro ao consultar histórico pelo assistente:', error);
        responder('Não consegui consultar o histórico agora.');
      }
    },
    [client, informarAcessoNegado, responder, temAcesso, user?.username],
  );

  const consultarChamados = useCallback(async (): Promise<void> => {
    if (!temAcesso('Chamados')) {
      informarAcessoNegado('chamados');
      return;
    }

    const chamadosDisponiveis =
      chamados.length > 0 ? chamados : await carregarChamados();

    if (!chamadosDisponiveis) {
      responder('Não consegui carregar os chamados. Verifique sua conexão.');
      return;
    }

    const atribuidos = chamadosDisponiveis.filter(
      chamado => chamado.situacao === 1 || chamado.situacao === 2,
    ).length;
    const naoAtribuidos = chamadosDisponiveis.filter(
      chamado => chamado.situacao === 0,
    ).length;

    responder(
      `Você possui ${atribuidos} ${atribuidos === 1 ? 'chamado atribuído' : 'chamados atribuídos'} e ${naoAtribuidos} ${naoAtribuidos === 1 ? 'não atribuído' : 'não atribuídos'} no seu setor.`,
    );
  }, [
    carregarChamados,
    chamados,
    informarAcessoNegado,
    responder,
    temAcesso,
  ]);

  const executarComandoGlobal = useCallback(
    async ({
      comando,
    }: ResultadoInterpretacaoAssistente): Promise<boolean> => {
      if (comando.dominio !== 'contatos') {
        aguardandoRefinoContatoRef.current = false;
      }

      if (acaoPendente && comando.acao !== 'confirmar' && comando.acao !== 'cancelar') {
        setAcaoPendente(null);
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
          await confirmarRotaPonto(acaoPendente);
          return true;
        }

        if (comando.acao === 'cancelar' && acaoPendente) {
          setAcaoPendente(null);
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

      if (comando.dominio === 'pontos') {
        if (comando.acao === 'tracar_ultimo') {
          prepararRotaUltimoPonto();
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
          if (comando.ativa === respostasFaladasAtivas) {
            responder(
              `As respostas faladas já estão ${comando.ativa ? 'ativadas' : 'desativadas'}.`,
            );
            return true;
          }

          const preferenciaSalva =
            await definirRespostasFaladasAtivas(comando.ativa);

          if (!preferenciaSalva) {
            responder(
              'Não consegui salvar essa preferência. Tente novamente.',
            );
            return true;
          }

          responder(
            `Respostas faladas ${comando.ativa ? 'ativadas' : 'desativadas'}. Você também pode alterar essa opção na barra lateral.`,
            comando.ativa ? undefined : '',
          );
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
      confirmarRotaPonto,
      consultarChamados,
      consultarContato,
      consultarHistorico,
      consultarPontos,
      isDarkMode,
      definirRespostasFaladasAtivas,
      menusPermitidos,
      prepararRotaUltimoPonto,
      responder,
      respostasFaladasAtivas,
      toggleTheme,
      user?.emailSec,
      user?.setor,
      user?.username,
    ],
  );

  const handleTranscricoes = useCallback(
    (transcricoes: readonly string[]): void => {
      const primeiraTranscricao = transcricoes[0]?.trim() ?? '';
      const interpretacaoGlobal =
        interpretarComandoAssistente(transcricoes, {
          possuiUltimoPonto: Boolean(ultimoPontoRef.current),
          aguardandoRefinoContato: aguardandoRefinoContatoRef.current,
        });

      setTranscricao(
        interpretacaoGlobal?.transcricao ?? primeiraTranscricao,
      );

      void (async () => {
        setProcessando(true);

        try {
          if (interpretacaoGlobal) {
            const processado =
              await executarComandoGlobal(interpretacaoGlobal);

            if (processado) return;
          }

          if (!temAcesso('Home')) {
            informarAcessoNegado('rotas');
            return;
          }

          comandosRota.processarTranscricoes(transcricoes);
        } finally {
          setProcessando(false);
        }
      })();
    },
    [
      comandosRota,
      executarComandoGlobal,
      informarAcessoNegado,
      temAcesso,
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
    },
    [responder],
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
    setNavegadorVisivel(false);
  }, [pararFala, reconhecimento.cancelarReconhecimento]);

  const limparConversaAoTrocarUsuario = useCallback((): void => {
    fechar();
    setTranscricao(null);
    setMensagem(MENSAGEM_INICIAL);
    setAcaoPendente(null);
    setSugestaoVisivel(false);
    ultimoPontoRef.current = null;
    aguardandoRefinoContatoRef.current = false;
  }, [fechar]);

  useResetOnUserChange(limparConversaAoTrocarUsuario);

  const abrirNavegador = useCallback(
    async (navegador: NavegadorAssistente): Promise<void> => {
      if (rotas.length === 0 || salvandoHistorico) return;

      setNavegadorVisivel(false);

      const resultadoHistorico = await registrarHistoricoRota(
        {
          rotas,
          cidadeOrigem: currentCity,
          tipoHistorico: TIPO_HISTORICO.LOJA,
        },
        {
          enviar: postHistoricoRota,
          sincronizar: sincronizarHistoricosPendentes,
          adicionarPendente: adicionarHistoricoPendente,
        },
      );

      if (resultadoHistorico.status === 'falha') {
        console.error(
          'Erro ao guardar histórico da rota do assistente:',
          resultadoHistorico.erro,
        );
      }

      if (navegador === 'google') {
        await MapService.openGoogleMapsRoute(rotas);
      } else {
        await MapService.openWazeRoute(rotas);
      }
    },
    [
      adicionarHistoricoPendente,
      currentCity,
      postHistoricoRota,
      rotas,
      salvandoHistorico,
      sincronizarHistoricosPendentes,
    ],
  );

  const executarSugestao = useCallback(
    (texto: string): void => {
      handleTranscricoes([texto]);
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
    navegadorVisivel,
    sugestaoVisivel,
    salvandoHistorico,
    respostasFaladasAtivas,
    abrir,
    fechar,
    ouvir,
    executarSugestao,
    abrirNavegador,
    fecharNavegador: () => setNavegadorVisivel(false),
    fecharSugestao: () => setSugestaoVisivel(false),
  };
}

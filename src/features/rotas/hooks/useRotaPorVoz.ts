import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Toast from 'react-native-toast-message';

import useFiliais from '../../filiais/hooks/useFiliais';
import type {Filial} from '../../filiais/models/Filial';
import type {ReferenciaFilialVoz} from '../useCases/interpretarComandoVozRota';
import {selecionarComandoVozRota} from '../useCases/selecionarComandoVozRota';

interface UseRotaPorVozOptions {
  rotas: readonly Filial[];
  onAtualizarRota: (rotas: readonly Filial[]) => void;
  onTracarRota: () => void;
  onResponder: (texto: string, textoFalado?: string) => void;
}

interface UseRotaPorVozReturn {
  processarTranscricoes: (transcricoes: readonly string[]) => void;
}

interface ContextoConversa {
  ultimaIntencao: 'adicionar' | 'remover' | null;
  ultimoCodigo: number | null;
}

const CONTEXTO_INICIAL: ContextoConversa = {
  ultimaIntencao: null,
  ultimoCodigo: null,
};
const LIMITE_HISTORICO = 10;

const formatarLista = (valores: readonly number[]): string => {
  if (valores.length === 0) return '';
  if (valores.length === 1) return String(valores[0]);

  return `${valores.slice(0, -1).join(', ')} e ${valores[valores.length - 1]}`;
};

/**
 * Gera uma assinatura sensível à ordem para distinguir alterações por voz das
 * edições manuais feitas na lista.
 */
const criarAssinaturaRota = (rotas: readonly Filial[]): string =>
  rotas.map(filial => filial.codigofilial).join('|');

/**
 * Orquestra a conversa local, incluindo memória curta, reordenação e desfazer.
 */
export default function useRotaPorVoz({
  rotas,
  onAtualizarRota,
  onTracarRota,
  onResponder,
}: UseRotaPorVozOptions): UseRotaPorVozReturn {
  const {
    filiais,
    loading: carregandoFiliais,
    error: erroFiliais,
  } = useFiliais();
  const [acaoPendente, setAcaoPendente] =
    useState<'limpar_rota' | null>(null);
  const historicoRef = useRef<Filial[][]>([]);
  const contextoRef = useRef<ContextoConversa>({...CONTEXTO_INICIAL});
  const assinaturaAnteriorRef = useRef(criarAssinaturaRota(rotas));
  const assinaturaEsperadaRef = useRef<string | null>(null);
  const assinaturaAtual = criarAssinaturaRota(rotas);

  const filiaisPorCodigo = useMemo(
    () =>
      new Map(
        filiais.map(filial => [
          filial.codigofilial,
          filial,
        ]),
      ),
    [filiais],
  );
  const codigosValidos = useMemo(
    () => new Set(filiais.map(filial => filial.codigofilial)),
    [filiais],
  );

  /**
   * Descarta memória e desfazer quando a rota foi alterada fora do assistente.
   */
  useEffect(() => {
    if (assinaturaAnteriorRef.current === assinaturaAtual) return;

    if (assinaturaEsperadaRef.current === assinaturaAtual) {
      assinaturaEsperadaRef.current = null;
      assinaturaAnteriorRef.current = assinaturaAtual;
      return;
    }

    historicoRef.current = [];
    contextoRef.current = {...CONTEXTO_INICIAL};
    assinaturaEsperadaRef.current = null;
    assinaturaAnteriorRef.current = assinaturaAtual;
  }, [assinaturaAtual]);

  const responder = onResponder;

  /**
   * Guarda a rota atual antes de toda alteração por voz e limita o histórico.
   */
  const aplicarRota = useCallback(
    (proximasRotas: readonly Filial[]): boolean => {
      const proximaAssinatura = criarAssinaturaRota(proximasRotas);

      if (proximaAssinatura === assinaturaAtual) return false;

      historicoRef.current = [
        ...historicoRef.current,
        [...rotas],
      ].slice(-LIMITE_HISTORICO);
      assinaturaEsperadaRef.current = proximaAssinatura;
      onAtualizarRota([...proximasRotas]);
      return true;
    },
    [assinaturaAtual, onAtualizarRota, rotas],
  );

  /**
   * Resolve pronomes e referências como "ela" e "a última".
   */
  const resolverReferencia = useCallback(
    (referencia: ReferenciaFilialVoz): number | null => {
      if (referencia.tipo === 'codigo') return referencia.codigo;

      if (referencia.tipo === 'ultima_rota') {
        return rotas.at(-1)?.codigofilial ?? null;
      }

      return contextoRef.current.ultimoCodigo;
    },
    [rotas],
  );

  const informarReferenciaAusente = useCallback((): void => {
    responder(
      'Não consegui identificar qual filial você quis dizer. Fale o número da filial.',
    );
  }, [responder]);

  /**
   * Resolve códigos pelo catálogo e preserva a ordem em que foram falados.
   */
  const adicionarFiliais = useCallback(
    (codigos: readonly number[], tracarDepois = false): void => {
      if (filiaisPorCodigo.size === 0) {
        const resposta = carregandoFiliais
          ? 'Ainda estou carregando as filiais. Tente novamente em alguns segundos.'
          : erroFiliais
            ? 'Não consegui carregar as filiais. Verifique sua conexão e tente novamente.'
            : 'As filiais ainda não estão disponíveis.';

        Toast.show({
          type: carregandoFiliais ? 'info' : 'error',
          text1: carregandoFiliais
            ? 'Carregando filiais'
            : 'Filiais indisponíveis',
          text2: resposta,
        });
        responder(resposta);
        return;
      }

      const filiaisEncontradas: Filial[] = [];
      const codigosNaoEncontrados: number[] = [];

      codigos.forEach(codigo => {
        const filial = filiaisPorCodigo.get(codigo);

        if (filial) {
          filiaisEncontradas.push(filial);
        } else {
          codigosNaoEncontrados.push(codigo);
        }
      });

      const codigosAtuais = new Set(rotas.map(route => route.codigofilial));
      const novasFiliais = filiaisEncontradas.filter(
        filial => !codigosAtuais.has(filial.codigofilial),
      );
      const totalDepois = rotas.length + novasFiliais.length;

      if (filiaisEncontradas.length === 0) {
        const texto = `Não encontrei a filial ${formatarLista(codigosNaoEncontrados)}.`;

        Toast.show({
          type: 'error',
          text1: 'Filial não encontrada',
          text2: texto,
        });
        responder(texto);
        return;
      }

      const ultimoCodigo = filiaisEncontradas.at(-1)?.codigofilial ?? null;
      contextoRef.current = {
        ultimaIntencao: 'adicionar',
        ultimoCodigo,
      };

      if (novasFiliais.length > 0) {
        aplicarRota([...rotas, ...novasFiliais]);
      }

      if (tracarDepois && totalDepois > 0) {
        onTracarRota();
      }

      if (novasFiliais.length === 0) {
        const texto = tracarDepois
          ? 'Essas filiais já estavam na rota. Escolha o navegador.'
          : 'As filiais informadas já fazem parte da sua rota.';

        Toast.show({
          type: 'info',
          text1: 'Filial já adicionada',
          text2: texto,
        });
        responder(texto);
        return;
      }

      const codigosAdicionados = novasFiliais.map(
        filial => filial.codigofilial,
      );
      const descricaoAdicao =
        novasFiliais.length === 1
          ? `Adicionei a filial ${codigosAdicionados[0]}.`
          : `Adicionei as filiais ${formatarLista(codigosAdicionados)}.`;
      const descricaoAusentes =
        codigosNaoEncontrados.length > 0
          ? ` Não encontrei ${formatarLista(codigosNaoEncontrados)}.`
          : '';
      const descricaoRota = tracarDepois
        ? ` Sua rota tem ${totalDepois} ${totalDepois === 1 ? 'parada' : 'paradas'}. Escolha o navegador.`
        : '';
      const resposta = `${descricaoAdicao}${descricaoAusentes}${descricaoRota}`;

      Toast.show({
        type: 'success',
        text1:
          novasFiliais.length === 1
            ? 'Filial adicionada por voz'
            : `${novasFiliais.length} filiais adicionadas por voz`,
        text2: resposta,
      });
      responder(resposta);
    },
    [
      aplicarRota,
      carregandoFiliais,
      erroFiliais,
      filiaisPorCodigo,
      onTracarRota,
      responder,
      rotas,
    ],
  );

  /**
   * Remove somente filiais presentes e mantém a intenção para frases como
   * "agora a 42".
   */
  const removerFiliais = useCallback(
    (codigos: readonly number[]): void => {
      const codigosAtuais = new Set(rotas.map(route => route.codigofilial));
      const codigosPresentes = codigos.filter(codigo =>
        codigosAtuais.has(codigo),
      );

      if (codigosPresentes.length === 0) {
        const resposta = `A filial ${formatarLista(codigos)} não está na sua rota.`;

        Toast.show({
          type: 'info',
          text1: 'Filial fora da rota',
          text2: resposta,
        });
        responder(resposta);
        return;
      }

      contextoRef.current = {
        ultimaIntencao: 'remover',
        ultimoCodigo: codigosPresentes.at(-1) ?? null,
      };
      const codigosParaRemover = new Set(codigosPresentes);
      aplicarRota(
        rotas.filter(
          filial => !codigosParaRemover.has(filial.codigofilial),
        ),
      );
      const resposta =
        codigosPresentes.length === 1
          ? `Removi a filial ${codigosPresentes[0]} da sua rota.`
          : `Removi as filiais ${formatarLista(codigosPresentes)} da sua rota.`;

      Toast.show({
        type: 'success',
        text1: 'Rota atualizada',
        text2: resposta,
      });
      responder(resposta);
    },
    [aplicarRota, responder, rotas],
  );

  /**
   * Move uma filial para o início, fim ou posição informada.
   */
  const moverFilial = useCallback(
    (
      referencia: ReferenciaFilialVoz,
      destino: 'inicio' | 'fim' | 'posicao',
      posicao?: number,
    ): void => {
      const codigo = resolverReferencia(referencia);

      if (codigo === null) {
        informarReferenciaAusente();
        return;
      }

      const indiceAtual = rotas.findIndex(
        filial => filial.codigofilial === codigo,
      );

      if (indiceAtual < 0) {
        responder(`A filial ${codigo} não está na sua rota.`);
        return;
      }

      if (
        destino === 'posicao' &&
        (posicao === undefined || posicao < 1 || posicao > rotas.length)
      ) {
        responder(`Escolha uma posição entre 1 e ${rotas.length}.`);
        return;
      }

      const proximasRotas = [...rotas];
      const [filial] = proximasRotas.splice(indiceAtual, 1);
      const novoIndice =
        destino === 'inicio'
          ? 0
          : destino === 'fim'
            ? proximasRotas.length
            : (posicao as number) - 1;

      proximasRotas.splice(novoIndice, 0, filial);
      contextoRef.current = {
        ultimaIntencao: null,
        ultimoCodigo: codigo,
      };

      if (!aplicarRota(proximasRotas)) {
        responder(`A filial ${codigo} já está nessa posição.`);
        return;
      }

      const descricaoDestino =
        destino === 'inicio'
          ? 'no início'
          : destino === 'fim'
            ? 'no fim'
            : `na posição ${posicao}`;
      responder(`Coloquei a filial ${codigo} ${descricaoDestino} da rota.`);
    },
    [
      aplicarRota,
      informarReferenciaAusente,
      resolverReferencia,
      responder,
      rotas,
    ],
  );

  /**
   * Posiciona uma filial imediatamente antes ou depois de outra.
   */
  const moverFilialRelativa = useCallback(
    (
      alvo: ReferenciaFilialVoz,
      referencia: ReferenciaFilialVoz,
      relacao: 'antes' | 'depois',
    ): void => {
      const codigoAlvo = resolverReferencia(alvo);
      const codigoReferencia = resolverReferencia(referencia);

      if (codigoAlvo === null || codigoReferencia === null) {
        informarReferenciaAusente();
        return;
      }

      if (codigoAlvo === codigoReferencia) {
        responder('Escolha duas filiais diferentes para alterar a ordem.');
        return;
      }

      const indiceAlvo = rotas.findIndex(
        filial => filial.codigofilial === codigoAlvo,
      );
      const referenciaExiste = rotas.some(
        filial => filial.codigofilial === codigoReferencia,
      );

      if (indiceAlvo < 0 || !referenciaExiste) {
        responder('Uma das filiais informadas não está na sua rota.');
        return;
      }

      const proximasRotas = [...rotas];
      const [filialMovida] = proximasRotas.splice(indiceAlvo, 1);
      const indiceReferencia = proximasRotas.findIndex(
        filial => filial.codigofilial === codigoReferencia,
      );
      const novoIndice =
        relacao === 'antes' ? indiceReferencia : indiceReferencia + 1;

      proximasRotas.splice(novoIndice, 0, filialMovida);
      contextoRef.current = {
        ultimaIntencao: null,
        ultimoCodigo: codigoAlvo,
      };

      if (!aplicarRota(proximasRotas)) {
        responder(
          `A filial ${codigoAlvo} já está ${relacao} da filial ${codigoReferencia}.`,
        );
        return;
      }

      responder(
        `Coloquei a filial ${codigoAlvo} ${relacao} da filial ${codigoReferencia}.`,
      );
    },
    [
      aplicarRota,
      informarReferenciaAusente,
      resolverReferencia,
      responder,
      rotas,
    ],
  );

  /**
   * Substitui uma parada sem alterar a posição ocupada por ela.
   */
  const substituirFilial = useCallback(
    (referencia: ReferenciaFilialVoz, novoCodigo: number): void => {
      const codigoAtual = resolverReferencia(referencia);

      if (codigoAtual === null) {
        informarReferenciaAusente();
        return;
      }

      const indiceAtual = rotas.findIndex(
        filial => filial.codigofilial === codigoAtual,
      );
      const novaFilial = filiaisPorCodigo.get(novoCodigo);

      if (indiceAtual < 0) {
        responder(`A filial ${codigoAtual} não está na sua rota.`);
        return;
      }

      if (!novaFilial) {
        responder(`Não encontrei a filial ${novoCodigo}.`);
        return;
      }

      if (
        codigoAtual !== novoCodigo &&
        rotas.some(filial => filial.codigofilial === novoCodigo)
      ) {
        responder(`A filial ${novoCodigo} já faz parte da sua rota.`);
        return;
      }

      const proximasRotas = [...rotas];
      proximasRotas[indiceAtual] = novaFilial;
      contextoRef.current = {
        ultimaIntencao: null,
        ultimoCodigo: novoCodigo,
      };

      if (!aplicarRota(proximasRotas)) {
        responder(`A filial ${novoCodigo} já ocupa essa parada.`);
        return;
      }

      responder(`Troquei a filial ${codigoAtual} pela filial ${novoCodigo}.`);
    },
    [
      aplicarRota,
      filiaisPorCodigo,
      informarReferenciaAusente,
      resolverReferencia,
      responder,
      rotas,
    ],
  );

  /**
   * Restaura a rota anterior sem criar uma nova entrada no histórico.
   */
  const desfazer = useCallback((): void => {
    const rotaAnterior = historicoRef.current.pop();

    if (!rotaAnterior) {
      responder('Não há nenhuma alteração por voz para desfazer.');
      return;
    }

    assinaturaEsperadaRef.current = criarAssinaturaRota(rotaAnterior);
    contextoRef.current = {...CONTEXTO_INICIAL};
    onAtualizarRota([...rotaAnterior]);
    responder('Desfiz a última alteração feita por voz.');
  }, [onAtualizarRota, responder]);

  /**
   * Resume as paradas atuais sem ler listas excessivamente longas.
   */
  const consultarRota = useCallback((): void => {
    if (rotas.length === 0) {
      responder('Sua rota está vazia. Diga o número de uma filial para começar.');
      return;
    }

    const codigos = rotas.map(route => route.codigofilial);
    const primeirosCodigos = codigos.slice(0, 8);
    const restantes = codigos.length - primeirosCodigos.length;
    const complemento = restantes > 0 ? ` e mais ${restantes}` : '';
    const resposta =
      `Sua rota tem ${rotas.length} ${rotas.length === 1 ? 'parada' : 'paradas'}: ` +
      `${formatarLista(primeirosCodigos)}${complemento}.`;

    responder(resposta);
  }, [responder, rotas]);

  /**
   * Escolhe a melhor transcrição, interpreta o pedido e mantém o contexto.
   */
  const processarTranscricoes = useCallback(
    (transcricoes: readonly string[]): void => {
      const {comando, transcricao} = selecionarComandoVozRota(
        transcricoes,
        codigosValidos,
      );

      if (
        acaoPendente &&
        comando.tipo !== 'confirmar' &&
        comando.tipo !== 'cancelar' &&
        comando.tipo !== 'limpar_rota'
      ) {
        setAcaoPendente(null);
      }

      switch (comando.tipo) {
        case 'adicionar_filiais':
          adicionarFiliais(comando.codigos);
          return;
        case 'adicionar_e_tracar':
          adicionarFiliais(comando.codigos, true);
          return;
        case 'continuar_contexto':
          if (contextoRef.current.ultimaIntencao === 'adicionar') {
            adicionarFiliais(comando.codigos);
            return;
          }

          if (contextoRef.current.ultimaIntencao === 'remover') {
            removerFiliais(comando.codigos);
            return;
          }

          responder(
            'Diga se deseja adicionar ou remover essas filiais.',
          );
          return;
        case 'remover_filiais':
          removerFiliais(comando.codigos);
          return;
        case 'remover_referencia': {
          const codigo = resolverReferencia(comando.alvo);

          if (codigo === null) {
            informarReferenciaAusente();
            return;
          }

          removerFiliais([codigo]);
          return;
        }
        case 'mover_filial':
          moverFilial(comando.alvo, comando.destino, comando.posicao);
          return;
        case 'mover_filial_relativa':
          moverFilialRelativa(
            comando.alvo,
            comando.referencia,
            comando.relacao,
          );
          return;
        case 'substituir_filial':
          substituirFilial(comando.alvo, comando.novoCodigo);
          return;
        case 'inverter_rota':
          if (rotas.length < 2) {
            responder('Adicione pelo menos duas filiais para inverter a rota.');
            return;
          }

          contextoRef.current = {...CONTEXTO_INICIAL};
          aplicarRota([...rotas].reverse());
          responder('Inverti a ordem das paradas.');
          return;
        case 'desfazer':
          desfazer();
          return;
        case 'tracar_rota':
          if (rotas.length === 0) {
            responder('Sua rota está vazia. Diga primeiro o número de uma filial.');
            return;
          }

          responder(
            `Sua rota está pronta com ${rotas.length} ${rotas.length === 1 ? 'parada' : 'paradas'}. Escolha o navegador.`,
          );
          onTracarRota();
          return;
        case 'consultar_rota':
          consultarRota();
          return;
        case 'limpar_rota':
          if (rotas.length === 0) {
            responder('Sua rota já está vazia.');
            return;
          }

          setAcaoPendente('limpar_rota');
          responder(
            `Sua rota tem ${rotas.length} ${rotas.length === 1 ? 'parada' : 'paradas'}. Diga confirmar para limpar ou cancelar.`,
          );
          return;
        case 'confirmar':
          if (acaoPendente !== 'limpar_rota') {
            responder('Não há nenhuma ação aguardando confirmação.');
            return;
          }

          setAcaoPendente(null);
          contextoRef.current = {...CONTEXTO_INICIAL};
          aplicarRota([]);
          responder('Rota limpa. Você pode começar uma nova rota.');
          return;
        case 'cancelar':
          if (!acaoPendente) {
            responder('Não há nenhuma ação para cancelar.');
            return;
          }

          setAcaoPendente(null);
          responder('Tudo bem. Mantive sua rota como estava.');
          return;
        case 'ajuda':
          responder(
            'Você pode adicionar ou remover lojas, mudar a ordem, trocar uma parada, inverter a rota e dizer desfazer. Por exemplo: coloque a 35 antes da 12.',
          );
          return;
        default:
          Toast.show({
            type: 'info',
            text1: 'Comando não reconhecido',
            text2: `Ouvi: “${transcricao}”.`,
          });
          responder(
            'Não entendi esse pedido. Diga ajuda para ouvir alguns exemplos.',
          );
      }
    },
    [
      acaoPendente,
      adicionarFiliais,
      aplicarRota,
      codigosValidos,
      consultarRota,
      desfazer,
      informarReferenciaAusente,
      moverFilial,
      moverFilialRelativa,
      onTracarRota,
      removerFiliais,
      resolverReferencia,
      responder,
      rotas,
      substituirFilial,
    ],
  );

  return {
    processarTranscricoes,
  };
}

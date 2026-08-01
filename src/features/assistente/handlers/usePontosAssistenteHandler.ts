import {useCallback, useRef, useState} from 'react';

import {navigateToMenu} from '../../../application/navigation/navigationService';
import useLocation from '../../../core/location/useLocation';
import usePontos from '../../pontos/hooks/usePontos';
import {usePontosContext} from '../../pontos/PontosContext';
import type {PontoInteresse} from '../../pontos/models/Ponto';
import type {ComandoAssistente} from '../models/ComandoAssistente';
import {buscarPontosAssistente} from '../useCases/buscarPontosAssistente';
import {
  encontrarPontosProximos,
  type PontoProximo,
} from '../useCases/encontrarPontosProximos';
import type {AssistenteHandlerDependencies} from './assistenteHandlerTypes';

interface UsePontosAssistenteHandlerParams
  extends AssistenteHandlerDependencies {
  ocultarAssistente: () => void;
}

interface AcaoPendentePonto {
  tipo: 'rota_ponto';
  pontoProximo: PontoProximo;
}

const formatarDistancia = (distanciaKm: number): string =>
  distanciaKm < 1
    ? `${Math.max(1, Math.round(distanciaKm * 1000))} metros`
    : `${distanciaKm.toFixed(1).replace('.', ',')} quilômetros`;

const obterRotuloCategoria = (
  categoria: PontoInteresse['categoria'],
): string => categoria === 'Restaurante' ? 'restaurante' : 'posto';

/**
 * Gerencia busca, contexto conversacional e confirmação de pontos sem tornar
 * o componente visual responsável por GPS ou navegação.
 */
export default function usePontosAssistenteHandler({
  responder,
  aguardarComFeedback,
  temAcesso,
  informarAcessoNegado,
  ocultarAssistente,
}: UsePontosAssistenteHandlerParams) {
  const {currentLocation, getLocation} = useLocation();
  const {pontos, getPontos} = usePontos({loadOnMount: false});
  const {solicitarNavegacao} = usePontosContext();
  const [acaoPendente, setAcaoPendente] =
    useState<AcaoPendentePonto | null>(null);
  const ultimoPontoRef = useRef<PontoProximo | null>(null);

  const obterPontos = useCallback(async () => {
    if (pontos.length > 0) return pontos;

    const carregamento = await aguardarComFeedback(
      getPontos(),
      'Consultando os pontos de interesse…',
    );
    if (carregamento.status === 'tempo_esgotado') return null;

    return carregamento.status === 'concluido'
      ? carregamento.valor ?? []
      : [];
  }, [aguardarComFeedback, getPontos, pontos]);

  const obterLocalizacao = useCallback(async () => {
    if (currentLocation) return currentLocation;

    const carregamento = await aguardarComFeedback(
      getLocation(true),
      'Obtendo sua localização para procurar os pontos próximos…',
    );

    if (carregamento.status === 'tempo_esgotado') {
      responder(
        'O GPS ainda está obtendo sua localização. Aguarde alguns instantes e tente novamente.',
      );
      return null;
    }

    const localizacao = carregamento.status === 'concluido'
      ? carregamento.valor
      : null;
    if (!localizacao) {
      responder(
        'Preciso da sua localização para encontrar os pontos mais próximos.',
      );
    }
    return localizacao;
  }, [aguardarComFeedback, currentLocation, getLocation, responder]);

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

      const pontosDisponiveis = await obterPontos();
      if (pontosDisponiveis === null) {
        responder(
          'Os pontos ainda estão sendo carregados. Tente novamente em alguns instantes.',
        );
        return;
      }
      if (pontosDisponiveis.length === 0) {
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
        setAcaoPendente({tipo: 'rota_ponto', pontoProximo: maisProximo});
        responder(
          `O ${obterRotuloCategoria(comando.categoria)} mais próximo é ${maisProximo.ponto.descricao}, a aproximadamente ${formatarDistancia(maisProximo.distanciaKm)} em linha reta. Diga confirmar para abrir a rota ou cancelar.`,
          `${maisProximo.ponto.descricao} é o mais próximo. Quer abrir a rota? Diga confirmar ou cancelar.`,
        );
        return;
      }

      const lista = proximos
        .map(({ponto, distanciaKm}) =>
          `${ponto.descricao}, ${formatarDistancia(distanciaKm)}`,
        )
        .join('; ');
      solicitarNavegacao(maisProximo.ponto, false);
      navigateToMenu('Pontos');
      responder(
        proximos.length === 1
          ? `Encontrei ${maisProximo.ponto.descricao}, a aproximadamente ${formatarDistancia(maisProximo.distanciaKm)} em linha reta. Mostrei o local no mapa.`
          : `Os mais próximos são: ${lista}. Mostrei o primeiro no mapa.`,
        proximos.length === 1
          ? `Encontrei ${maisProximo.ponto.descricao} e mostrei no mapa.`
          : `Encontrei ${proximos.length} opções. ${maisProximo.ponto.descricao} é a mais próxima e está no mapa.`,
      );
    },
    [
      informarAcessoNegado,
      obterLocalizacao,
      obterPontos,
      responder,
      solicitarNavegacao,
      temAcesso,
    ],
  );

  const buscarPontoPorNome = useCallback(
    async (
      comando: Extract<
        ComandoAssistente,
        {dominio: 'pontos'; acao: 'buscar'}
      >,
    ): Promise<void> => {
      if (!temAcesso('Pontos')) {
        informarAcessoNegado('pontos de interesse');
        return;
      }

      const pontosDisponiveis = await obterPontos();
      if (pontosDisponiveis === null) {
        responder(
          'Os pontos ainda estão sendo carregados. Tente novamente em alguns instantes.',
        );
        return;
      }
      if (pontosDisponiveis.length === 0) {
        responder('Não consegui carregar os pontos de interesse agora.');
        return;
      }

      const resultados = buscarPontosAssistente(
        pontosDisponiveis,
        comando.termo,
        comando.categoria,
      );
      if (resultados.length === 0) {
        responder(`Não encontrei ponto para ${comando.termo}.`);
        return;
      }

      const ponto = resultados[0].ponto;
      ultimoPontoRef.current = {ponto, distanciaKm: 0};

      if (comando.iniciarRota) {
        setAcaoPendente({
          tipo: 'rota_ponto',
          pontoProximo: {ponto, distanciaKm: 0},
        });
        responder(
          `Encontrei ${ponto.descricao}, em ${ponto.cidadePonto ?? 'cidade não informada'}. Diga confirmar para abrir a rota ou cancelar.`,
          `Encontrei ${ponto.descricao}. Quer abrir a rota? Diga confirmar ou cancelar.`,
        );
        return;
      }

      solicitarNavegacao(ponto, false);
      navigateToMenu('Pontos');
      responder(
        resultados.length === 1
          ? `Mostrando ${ponto.descricao} no mapa.`
          : `Encontrei ${resultados.length} pontos para “${comando.termo}”. Mostrei ${ponto.descricao} no mapa.`,
        `Mostrando ${ponto.descricao} no mapa.`,
      );
      ocultarAssistente();
    },
    [
      informarAcessoNegado,
      obterPontos,
      ocultarAssistente,
      responder,
      solicitarNavegacao,
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

    setAcaoPendente({tipo: 'rota_ponto', pontoProximo: ultimoPonto});
    responder(
      `Você quer abrir a rota para ${ultimoPonto.ponto.descricao}? Diga confirmar ou cancelar.`,
    );
  }, [responder]);

  const confirmarRotaPonto = useCallback(async (): Promise<void> => {
    if (!acaoPendente) return;

    setAcaoPendente(null);
    solicitarNavegacao(acaoPendente.pontoProximo.ponto, true);
    const aberto = navigateToMenu('Pontos');
    responder(
      aberto
        ? `Abri ${acaoPendente.pontoProximo.ponto.descricao}. Confira a prévia e confirme o início do percurso.`
        : 'A navegação ainda não está pronta. Tente novamente.',
    );
    if (aberto) ocultarAssistente();
  }, [acaoPendente, ocultarAssistente, responder, solicitarNavegacao]);

  return {
    acaoPendente,
    buscarPontoPorNome,
    cancelarAcaoPendente: () => setAcaoPendente(null),
    confirmarRotaPonto,
    consultarPontos,
    possuiUltimoPonto: () => Boolean(ultimoPontoRef.current),
    prepararRotaUltimoPonto,
  };
}


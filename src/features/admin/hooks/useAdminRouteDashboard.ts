import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {
  FiltrosPainelAdmin,
  PainelAdminRotas,
} from '../models/AdminRouteDashboard';
import {consultarPainelAdminRotas} from '../services/adminRouteDashboardApi';
import {
  criarDatasPeriodoAdmin,
  criarIntervaloDatasAdmin,
} from '../useCases/formatAdminRouteDashboard';

const TAMANHO_PAGINA = 15;

const obterMensagemErro = (erro: unknown): string => {
  const requestError = erro as StrapiRequestError;
  if (requestError.response?.status === 403) {
    return 'Seu usuário não possui acesso ao painel de monitoramento.';
  }

  return requestError.response?.data?.error?.message ??
    requestError.response?.data?.message ??
    'Não foi possível carregar o painel agora.';
};

/**
 * Coordena filtros, paginação e concorrência. Respostas antigas são ignoradas
 * quando o usuário troca um filtro antes da requisição terminar.
 */
export default function useAdminRouteDashboard() {
  const client = useStrapiClient();
  const [filtros, setFiltros] = useState<FiltrosPainelAdmin>(() => ({
    ...criarDatasPeriodoAdmin('hoje'),
    resultado: 'todas',
    busca: '',
  }));
  const [dados, setDados] = useState<PainelAdminRotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervaloRef = useRef(criarIntervaloDatasAdmin(
    filtros.dataInicial,
    filtros.dataFinal,
  ));
  const requestIdRef = useRef(0);

  const consultarPagina = useCallback(
    async (
      pagina: number,
      intervalo: {inicio: string; fim: string},
      modo: 'inicial' | 'atualizar' | 'mais',
    ): Promise<void> => {
      const requestId = ++requestIdRef.current;
      if (modo === 'inicial') setLoading(true);
      if (modo === 'atualizar') setRefreshing(true);
      if (modo === 'mais') setLoadingMore(true);
      setError(null);

      try {
        const resposta = await consultarPainelAdminRotas(client, {
          ...intervalo,
          ...(filtros.resultado !== 'todas'
            ? {resultado: filtros.resultado}
            : {}),
          ...(filtros.busca ? {busca: filtros.busca} : {}),
          pagina,
          tamanhoPagina: TAMANHO_PAGINA,
        });
        if (requestId !== requestIdRef.current) return;

        if (modo !== 'mais') {
          if (
            resposta.metricas === null
            || resposta.metricasLimitadas === null
          ) {
            throw new Error('O resumo do painel não foi retornado.');
          }

          setDados({
            ...resposta,
            metricas: resposta.metricas,
            metricasLimitadas: resposta.metricasLimitadas,
          });
          return;
        }

        setDados(atual => {
          if (!atual) return atual;

          const unicas = new Map(
            atual.execucoes.map(execucao => [execucao.codigoSessao, execucao]),
          );
          resposta.execucoes.forEach(execucao => {
            unicas.set(execucao.codigoSessao, execucao);
          });

          return {
            ...atual,
            periodo: resposta.periodo,
            escopo: resposta.escopo,
            execucoes: [...unicas.values()],
            paginacao: resposta.paginacao,
          };
        });
      } catch (erro: unknown) {
        if (requestId === requestIdRef.current) {
          setError(obterMensagemErro(erro));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [client, filtros.busca, filtros.resultado],
  );

  const carregarPrimeiraPagina = useCallback(async (): Promise<void> => {
    const intervalo = criarIntervaloDatasAdmin(
      filtros.dataInicial,
      filtros.dataFinal,
    );
    intervaloRef.current = intervalo;
    await consultarPagina(1, intervalo, 'inicial');
  }, [consultarPagina, filtros.dataFinal, filtros.dataInicial]);

  const atualizar = useCallback(async (): Promise<void> => {
    const intervalo = criarIntervaloDatasAdmin(
      filtros.dataInicial,
      filtros.dataFinal,
    );
    intervaloRef.current = intervalo;
    await consultarPagina(1, intervalo, 'atualizar');
  }, [consultarPagina, filtros.dataFinal, filtros.dataInicial]);

  const carregarMais = useCallback((): void => {
    if (!dados || loading || refreshing || loadingMore) return;
    if (dados.paginacao.pagina >= dados.paginacao.totalPaginas) return;

    void consultarPagina(
      dados.paginacao.pagina + 1,
      intervaloRef.current,
      'mais',
    );
  }, [consultarPagina, dados, loading, loadingMore, refreshing]);

  useEffect(() => {
    void carregarPrimeiraPagina();
  }, [carregarPrimeiraPagina]);

  return {
    filtros,
    dados,
    loading,
    refreshing,
    loadingMore,
    error,
    aplicarFiltros: setFiltros,
    atualizar,
    carregarMais,
    tentarNovamente: carregarPrimeiraPagina,
  };
}

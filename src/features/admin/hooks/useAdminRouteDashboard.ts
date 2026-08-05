import {useCallback, useEffect, useRef, useState} from 'react';

import useStrapiClient from '../../../core/api/strapiClient';
import type {StrapiRequestError} from '../../../core/api/strapiTypes';
import type {
  FiltroSituacaoAdmin,
  PainelAdminRotas,
  PeriodoPainelAdmin,
} from '../models/AdminRouteDashboard';
import {consultarPainelAdminRotas} from '../services/adminRouteDashboardApi';
import {criarIntervaloPeriodoAdmin} from '../useCases/formatAdminRouteDashboard';

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
  const [periodo, setPeriodo] = useState<PeriodoPainelAdmin>('hoje');
  const [situacao, setSituacao] = useState<FiltroSituacaoAdmin>('todas');
  const [busca, setBusca] = useState('');
  const [dados, setDados] = useState<PainelAdminRotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervaloRef = useRef(criarIntervaloPeriodoAdmin('hoje'));
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
          ...(situacao !== 'todas' ? {situacao} : {}),
          ...(busca ? {busca} : {}),
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
    [busca, client, situacao],
  );

  const carregarPrimeiraPagina = useCallback(async (): Promise<void> => {
    const intervalo = criarIntervaloPeriodoAdmin(periodo);
    intervaloRef.current = intervalo;
    await consultarPagina(1, intervalo, 'inicial');
  }, [consultarPagina, periodo]);

  const atualizar = useCallback(async (): Promise<void> => {
    const intervalo = criarIntervaloPeriodoAdmin(periodo);
    intervaloRef.current = intervalo;
    await consultarPagina(1, intervalo, 'atualizar');
  }, [consultarPagina, periodo]);

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
    periodo,
    situacao,
    busca,
    dados,
    loading,
    refreshing,
    loadingMore,
    error,
    setPeriodo,
    setSituacao,
    setBusca,
    atualizar,
    carregarMais,
    tentarNovamente: carregarPrimeiraPagina,
  };
}

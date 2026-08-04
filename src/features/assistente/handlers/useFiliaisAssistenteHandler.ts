import {useCallback, useRef} from 'react';

import {navigateToMenu} from '../../../application/navigation/navigationService';
import useFiliais from '../../filiais/hooks/useFiliais';
import {useFiliaisContext} from '../../filiais/FiliaisContext';
import type {Filial} from '../../filiais/models/Filial';
import type {ComandoAssistente} from '../models/ComandoAssistente';
import {
  analisarFiliaisAssistente,
  encontrarCidadesAssistente,
  selecionarRankingFiliais,
} from '../useCases/analisarFiliaisAssistente';
import {buscarFiliaisAssistente} from '../useCases/buscarFiliaisAssistente';
import {formatarListaAssistente} from '../useCases/formatarListaAssistente';
import {formatarDetalhesFilialAssistente} from '../useCases/formatarDetalhesFilialAssistente';
import type {AssistenteHandlerDependencies} from './assistenteHandlerTypes';

interface UseFiliaisAssistenteHandlerParams
  extends AssistenteHandlerDependencies {
  ocultarAssistente: () => void;
}

/** Isola consultas e navegação de filiais da orquestração global. */
export default function useFiliaisAssistenteHandler({
  responder,
  aguardarComFeedback,
  temAcesso,
  informarAcessoNegado,
  ocultarAssistente,
}: UseFiliaisAssistenteHandlerParams) {
  const {filiais, getFiliais} = useFiliais();
  const {solicitarPesquisaMapa} = useFiliaisContext();
  const ultimaFilialRef = useRef<Filial | null>(null);

  const responderDetalhesFilial = useCallback(
    (
      filial: Filial,
      campo: Extract<
        ComandoAssistente,
        {dominio: 'filiais'; acao: 'consultar' | 'consultar_ultima'}
      >['campo'],
    ): void => {
      ultimaFilialRef.current = filial;
      const resposta = formatarDetalhesFilialAssistente(filial, campo);
      responder(resposta.visual, resposta.falada);
    },
    [responder],
  );

  const obterFiliais = useCallback(
    async (mensagem: string) => {
      if (filiais.length > 0) return filiais;

      const carregamento = await aguardarComFeedback(
        getFiliais(false),
        mensagem,
      );

      if (carregamento.status === 'tempo_esgotado') return null;
      return carregamento.status === 'concluido'
        ? carregamento.valor ?? []
        : [];
    },
    [aguardarComFeedback, filiais, getFiliais],
  );

  const pesquisarFiliaisNoMapa = useCallback(
    async (
      comando: Extract<ComandoAssistente, {dominio: 'mapa'}>,
    ): Promise<void> => {
      if (!temAcesso('MapaLojas')) {
        informarAcessoNegado('mapa de filiais');
        return;
      }

      const filiaisDisponiveis = await obterFiliais(
        'Consultando as filiais para abrir o mapa…',
      );

      if (filiaisDisponiveis === null) {
        responder(
          'As filiais ainda estão sendo carregadas. Tente novamente em alguns instantes.',
        );
        return;
      }

      if (filiaisDisponiveis.length === 0) {
        responder('Não consegui carregar as filiais agora.');
        return;
      }

      const resultados = buscarFiliaisAssistente(
        filiaisDisponiveis,
        comando.termo,
      );

      if (resultados.length === 0) {
        responder(`Não encontrei filial para ${comando.termo}.`);
        return;
      }

      solicitarPesquisaMapa(comando.termo);
      const aberto = navigateToMenu('MapaLojas');
      if (!aberto) {
        responder('A navegação ainda não está pronta. Tente novamente.');
        return;
      }

      const primeira = resultados[0].filial;
      if (resultados.length === 1) ultimaFilialRef.current = primeira;
      responder(
        resultados.length === 1
          ? `Mostrando a filial ${primeira.codigofilial}, ${primeira.nomefilial}, em ${primeira.nomecidade}.`
          : `Encontrei ${resultados.length} filiais para “${comando.termo}”. Mostrei a primeira no mapa.`,
        resultados.length === 1
          ? `Mostrando a filial ${primeira.codigofilial} no mapa.`
          : `Encontrei ${resultados.length} filiais. Mostrei a primeira no mapa.`,
      );
      ocultarAssistente();
    },
    [
      informarAcessoNegado,
      obterFiliais,
      ocultarAssistente,
      responder,
      solicitarPesquisaMapa,
      temAcesso,
    ],
  );

  const consultarFiliais = useCallback(
    async (
      comando: Extract<ComandoAssistente, {dominio: 'filiais'}>,
    ): Promise<void> => {
      if (!temAcesso('MapaLojas') && !temAcesso('Home')) {
        informarAcessoNegado('filiais');
        return;
      }

      if (comando.acao === 'consultar_ultima') {
        const filial = ultimaFilialRef.current;
        if (!filial) {
          responder('Consulte primeiro uma filial pelo código, nome ou cidade.');
          return;
        }

        responderDetalhesFilial(filial, comando.campo);
        return;
      }

      const filiaisDisponiveis = await obterFiliais(
        'Consultando os dados das filiais…',
      );

      if (filiaisDisponiveis === null) {
        responder(
          'Os dados das filiais ainda estão sendo carregados. Tente novamente em alguns instantes.',
        );
        return;
      }

      if (filiaisDisponiveis.length === 0) {
        responder('Não consegui carregar as filiais agora. Verifique sua conexão.');
        return;
      }

      if (comando.acao === 'consultar') {
        const resultados = buscarFiliaisAssistente(
          filiaisDisponiveis,
          comando.termo,
        );

        if (resultados.length === 0) {
          responder(`Não encontrei filial para ${comando.termo}.`);
          return;
        }

        if (
          resultados.length === 1 ||
          resultados[0].pontuacao > resultados[1].pontuacao
        ) {
          responderDetalhesFilial(resultados[0].filial, comando.campo);
          return;
        }

        const alternativas = resultados.slice(0, 4).map(({filial}) =>
          `filial ${filial.codigofilial}, ${filial.nomefilial}, em ${filial.nomecidade}`,
        );
        responder(
          `Encontrei mais de uma filial: ${formatarListaAssistente(alternativas, 4)}. Informe o código da loja para consultar com segurança.`,
        );
        return;
      }

      const analise = analisarFiliaisAssistente(filiaisDisponiveis);

      if (comando.acao === 'contar_total') {
        responder(
          `Existem ${analise.total} ${analise.total === 1 ? 'filial cadastrada' : 'filiais cadastradas'} em ${analise.cidades.length} ${analise.cidades.length === 1 ? 'cidade' : 'cidades'}.`,
        );
        return;
      }

      if (comando.acao === 'contar_cidade') {
        const cidades = encontrarCidadesAssistente(
          analise.cidades,
          comando.termo,
        );

        if (cidades.length === 0) {
          responder(`Não encontrei uma cidade correspondente a ${comando.termo}.`);
          return;
        }

        if (cidades.length > 1) {
          responder(
            `Encontrei mais de uma cidade: ${formatarListaAssistente(cidades.map(cidade => cidade.nome), 5)}. Fale o nome completo para consultar.`,
          );
          return;
        }

        const cidade = cidades[0];
        responder(
          `${cidade.nome} possui ${cidade.quantidade} ${cidade.quantidade === 1 ? 'filial cadastrada' : 'filiais cadastradas'}.`,
        );
        return;
      }

      if (comando.acao === 'listar_cidades') {
        const nomes = [...analise.cidades]
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
          .map(cidade => cidade.nome);
        responder(
          `Há filiais em ${nomes.length} ${nomes.length === 1 ? 'cidade' : 'cidades'}: ${formatarListaAssistente(nomes, 12)}.`,
          `Há filiais em ${nomes.length} cidades. Entre elas: ${formatarListaAssistente(nomes, 5)}.`,
        );
        return;
      }

      const possuiRegioes = analise.regioes.length > 0;
      const grupos = comando.agrupamento === 'regiao' && possuiRegioes
        ? analise.regioes
        : analise.cidades;
      const ranking = selecionarRankingFiliais(
        grupos,
        comando.ordem,
        comando.quantidade,
      );

      if (ranking.length === 0) {
        responder('Não há dados suficientes para montar esse ranking.');
        return;
      }

      const rotuloGrupo = comando.agrupamento === 'regiao' && possuiRegioes
        ? 'região'
        : 'cidade';
      const itens = ranking.map(
        grupo => `${grupo.nome}, com ${grupo.quantidade} ${grupo.quantidade === 1 ? 'filial' : 'filiais'}`,
      );
      const avisoRegional = comando.agrupamento === 'regiao' && !possuiRegioes
        ? 'O cadastro não informa regiões; usei a distribuição por cidade. '
        : '';
      const introducao = comando.ordem === 'mais'
        ? `${ranking.length === 1 ? `A ${rotuloGrupo}` : `As ${rotuloGrupo === 'região' ? 'regiões' : 'cidades'}`} com mais filiais`
        : `${ranking.length === 1 ? `A ${rotuloGrupo}` : `As ${rotuloGrupo === 'região' ? 'regiões' : 'cidades'}`} com menos filiais`;

      responder(
        `${avisoRegional}${introducao}: ${itens.join('; ')}.`,
        `${avisoRegional}${itens.join('; ')}.`,
      );
    },
    [
      informarAcessoNegado,
      obterFiliais,
      responder,
      responderDetalhesFilial,
      temAcesso,
    ],
  );

  const limparContextoFilial = useCallback((): void => {
    ultimaFilialRef.current = null;
  }, []);

  const obterContextoFilial = useCallback(() => ({
    possuiUltimaFilial: Boolean(ultimaFilialRef.current),
  }), []);

  return {
    pesquisarFiliaisNoMapa,
    consultarFiliais,
    limparContextoFilial,
    obterContextoFilial,
  };
}

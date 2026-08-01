import {useCallback, useRef} from 'react';

import useContatos from '../../contatos/hooks/useContatos';
import type {Contato} from '../../contatos/models/Contato';
import type {ComandoAssistente} from '../models/ComandoAssistente';
import {
  agruparContatosPorDepartamento,
  encontrarDepartamentosAssistente,
} from '../useCases/analisarContatosAssistente';
import {buscarContatosAssistente} from '../useCases/buscarContatosAssistente';
import {formatarListaAssistente} from '../useCases/formatarListaAssistente';
import type {AssistenteHandlerDependencies} from './assistenteHandlerTypes';

type Params = Pick<
  AssistenteHandlerDependencies,
  'responder' | 'temAcesso' | 'informarAcessoNegado'
>;

/**
 * Encapsula a memória curta da conversa sobre contatos. A tela de contatos não
 * conhece a assistente e a assistente recebe somente operações do domínio.
 */
export default function useContatosAssistenteHandler({
  responder,
  temAcesso,
  informarAcessoNegado,
}: Params) {
  const {contatos, recarregar: carregarContatos} = useContatos({
    loadOnMount: false,
  });
  const ultimoContatoRef = useRef<Contato | null>(null);
  const ultimoDepartamentoRef = useRef<string | null>(null);
  const aguardandoRefinoContatoRef = useRef(false);

  const consultarContato = useCallback(
    async (
      comando: Extract<ComandoAssistente, {dominio: 'contatos'}>,
    ): Promise<void> => {
      if (!temAcesso('Contatos')) {
        informarAcessoNegado('contatos');
        return;
      }

      if (comando.acao === 'consultar_ultimo') {
        const contato = ultimoContatoRef.current;
        if (!contato) {
          responder('Consulte primeiro um contato pelo nome ou departamento.');
          return;
        }

        if (comando.campo === 'email') {
          responder(
            contato.email
              ? `O e-mail de ${contato.colaboradores} é ${contato.email}.`
              : `${contato.colaboradores} não possui e-mail informado.`,
          );
          return;
        }

        if (comando.campo === 'telefone') {
          const telefones = [
            contato.ramal ? `ramal ${contato.ramal}` : null,
            contato.ddr ? `DDR ${contato.ddr}` : null,
          ].filter(Boolean);
          responder(
            telefones.length > 0
              ? `${contato.colaboradores}: ${telefones.join(', ')}.`
              : `${contato.colaboradores} não possui telefone informado.`,
          );
          return;
        }

        ultimoDepartamentoRef.current = contato.departamento;
        responder(`${contato.colaboradores}, do departamento ${contato.departamento}.`);
        return;
      }

      const contatosDisponiveis = contatos.length > 0
        ? contatos
        : await carregarContatos();
      if (!contatosDisponiveis) {
        responder('Não consegui carregar os contatos. Verifique sua conexão.');
        return;
      }

      if (
        comando.acao === 'listar_departamentos' ||
        comando.acao === 'ranking_departamentos' ||
        comando.acao === 'listar_pessoas' ||
        comando.acao === 'contar_pessoas'
      ) {
        const departamentos = agruparContatosPorDepartamento(
          contatosDisponiveis,
        );
        if (departamentos.length === 0) {
          ultimoDepartamentoRef.current = null;
          responder('Não existem contatos com departamento informado.');
          return;
        }

        if (comando.acao === 'listar_departamentos') {
          const nomes = departamentos.map(departamento => departamento.nome);
          responder(
            `Existem ${nomes.length} departamentos nos contatos: ${formatarListaAssistente(nomes, 12)}.`,
            `Existem ${nomes.length} departamentos. Entre eles: ${formatarListaAssistente(nomes, 5)}.`,
          );
          return;
        }

        if (comando.acao === 'ranking_departamentos') {
          const ranking = [...departamentos]
            .sort((primeiro, segundo) =>
              (comando.ordem === 'mais'
                ? segundo.pessoas.length - primeiro.pessoas.length
                : primeiro.pessoas.length - segundo.pessoas.length) ||
              primeiro.nome.localeCompare(segundo.nome, 'pt-BR'),
            )
            .slice(0, Math.max(1, Math.min(5, comando.quantidade)));
          const itens = ranking.map(departamento =>
            `${departamento.nome}, com ${departamento.pessoas.length} ${departamento.pessoas.length === 1 ? 'pessoa' : 'pessoas'}`,
          );
          responder(
            `${ranking.length === 1 ? 'O departamento' : 'Os departamentos'} com ${comando.ordem === 'mais' ? 'mais' : 'menos'} pessoas: ${itens.join('; ')}.`,
            `${itens.join('; ')}.`,
          );
          return;
        }

        if (!comando.departamento) {
          const pessoas = departamentos.flatMap(
            departamento => departamento.pessoas,
          );
          if (comando.acao === 'contar_pessoas') {
            responder(
              `Existem ${pessoas.length} ${pessoas.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'} nos contatos.`,
            );
            return;
          }

          responder(
            `Há ${pessoas.length} pessoas cadastradas: ${formatarListaAssistente(pessoas.map(pessoa => pessoa.colaboradores), 10)}. Você pode pedir um departamento para refinar.`,
            `Há ${pessoas.length} pessoas cadastradas. Peça um departamento para refinar a lista.`,
          );
          return;
        }

        const encontrados = encontrarDepartamentosAssistente(
          departamentos,
          comando.departamento,
        );
        if (encontrados.length === 0) {
          ultimoDepartamentoRef.current = null;
          responder(`Não encontrei o departamento ${comando.departamento}.`);
          return;
        }
        if (encontrados.length > 1) {
          ultimoDepartamentoRef.current = null;
          responder(
            `Encontrei departamentos parecidos: ${formatarListaAssistente(encontrados.map(departamento => departamento.nome), 5)}. Fale o nome completo.`,
          );
          return;
        }

        const departamento = encontrados[0];
        ultimoDepartamentoRef.current = departamento.nome;
        if (comando.acao === 'contar_pessoas') {
          responder(
            `${departamento.nome} possui ${departamento.pessoas.length} ${departamento.pessoas.length === 1 ? 'pessoa cadastrada' : 'pessoas cadastradas'}.`,
          );
          return;
        }

        const nomes = departamento.pessoas.map(pessoa => pessoa.colaboradores);
        responder(
          `${departamento.nome} possui ${nomes.length} ${nomes.length === 1 ? 'pessoa' : 'pessoas'}: ${formatarListaAssistente(nomes, 10)}.`,
          `${departamento.nome} possui ${nomes.length} pessoas. ${formatarListaAssistente(nomes, 5)}.`,
        );
        return;
      }

      if (comando.acao !== 'consultar') return;

      const resultados = buscarContatosAssistente(
        contatosDisponiveis,
        comando.termo,
      );
      if (resultados.length === 0) {
        ultimoContatoRef.current = null;
        ultimoDepartamentoRef.current = null;
        aguardandoRefinoContatoRef.current = false;
        responder(`Não encontrei contato para ${comando.termo}.`);
        return;
      }

      if (
        resultados.length === 1 ||
        resultados[0].pontuacao > resultados[1].pontuacao
      ) {
        aguardandoRefinoContatoRef.current = false;
        const contato = resultados[0].contato;
        ultimoContatoRef.current = contato;
        ultimoDepartamentoRef.current = contato.departamento;
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
      ultimoContatoRef.current = null;
      ultimoDepartamentoRef.current = null;
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

  return {
    consultarContato,
    limparRefinoContato: () => {
      aguardandoRefinoContatoRef.current = false;
    },
    obterContextoContato: () => ({
      possuiUltimoContato: Boolean(ultimoContatoRef.current),
      aguardandoRefinoContato: aguardandoRefinoContatoRef.current,
      ultimoDepartamento: ultimoDepartamentoRef.current ?? undefined,
    }),
  };
}


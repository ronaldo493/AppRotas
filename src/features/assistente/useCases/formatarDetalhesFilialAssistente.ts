import type {Filial} from '../../filiais/models/Filial';
import type {CampoDetalheFilialAssistente} from '../models/ComandoAssistente';

export interface RespostaDetalheFilialAssistente {
  visual: string;
  falada: string;
}

const limpar = (valor: unknown): string =>
  String(valor ?? '').replace(/\s+/g, ' ').trim();

const identificarFilial = (filial: Filial): string => {
  const nome = limpar(filial.nomefilial);
  return nome
    ? `Filial ${filial.codigofilial} — ${nome}`
    : `Filial ${filial.codigofilial}`;
};

const montarEndereco = (filial: Filial): string => {
  const logradouro = [limpar(filial.endereco), limpar(filial.numero)]
    .filter(Boolean)
    .join(', ');
  const localidade = [limpar(filial.bairro), limpar(filial.nomecidade)]
    .filter(Boolean)
    .join(' — ');
  const estado = limpar(filial.uf);
  const cep = limpar(filial.cep);

  return [logradouro, localidade, estado, cep ? `CEP ${cep}` : '']
    .filter(Boolean)
    .join(' · ');
};

const responderCampo = (
  filial: Filial,
  campo: Exclude<CampoDetalheFilialAssistente, 'resumo'>,
): RespostaDetalheFilialAssistente => {
  const identificacao = identificarFilial(filial);
  const valores: Record<
    Exclude<CampoDetalheFilialAssistente, 'resumo'>,
    {rotulo: string; valor: string}
  > = {
    endereco: {rotulo: 'endereço', valor: montarEndereco(filial)},
    telefone: {rotulo: 'telefone', valor: limpar(filial.telefone)},
    horario: {
      rotulo: 'horário de funcionamento',
      valor: limpar(filial.horariofuncionamento),
    },
    gerente: {rotulo: 'gerente', valor: limpar(filial.gerente)},
    supervisor: {rotulo: 'supervisor', valor: limpar(filial.supervisor)},
    cnpj: {rotulo: 'CNPJ', valor: limpar(filial.cnpj)},
    cep: {rotulo: 'CEP', valor: limpar(filial.cep)},
    bairro: {rotulo: 'bairro', valor: limpar(filial.bairro)},
    cidade: {rotulo: 'cidade', valor: limpar(filial.nomecidade)},
    uf: {rotulo: 'estado', valor: limpar(filial.uf)},
  };
  const detalhe = valores[campo];

  if (!detalhe.valor) {
    const mensagem = `${identificacao} não possui ${detalhe.rotulo} informado.`;
    return {visual: mensagem, falada: mensagem};
  }

  return {
    visual: `${identificacao} · ${detalhe.rotulo}: ${detalhe.valor}.`,
    falada: `${identificacao}. ${detalhe.rotulo}: ${detalhe.valor}.`,
  };
};

/**
 * Formata exclusivamente fatos presentes no cadastro da filial. A IA não
 * participa desta etapa e, portanto, não consegue completar dados ausentes.
 */
export const formatarDetalhesFilialAssistente = (
  filial: Filial,
  campo: CampoDetalheFilialAssistente,
): RespostaDetalheFilialAssistente => {
  if (campo !== 'resumo') return responderCampo(filial, campo);

  const identificacao = identificarFilial(filial);
  const endereco = montarEndereco(filial);
  const detalhes = [
    endereco ? `Endereço: ${endereco}` : null,
    limpar(filial.telefone) ? `Telefone: ${limpar(filial.telefone)}` : null,
    limpar(filial.horariofuncionamento)
      ? `Horário: ${limpar(filial.horariofuncionamento)}`
      : null,
    limpar(filial.gerente) ? `Gerente: ${limpar(filial.gerente)}` : null,
    limpar(filial.supervisor)
      ? `Supervisor: ${limpar(filial.supervisor)}`
      : null,
    limpar(filial.cnpj) ? `CNPJ: ${limpar(filial.cnpj)}` : null,
  ].filter((valor): valor is string => Boolean(valor));

  if (detalhes.length === 0) {
    const mensagem = `${identificacao} não possui informações complementares cadastradas.`;
    return {visual: mensagem, falada: mensagem};
  }

  return {
    visual: `${identificacao}\n${detalhes.join('\n')}`,
    falada: `${identificacao}. ${detalhes.slice(0, 4).join('. ')}.`,
  };
};

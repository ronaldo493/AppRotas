import type {ComandoAssistente} from '../models/ComandoAssistente';

const limpar = (value: unknown, limite: number): string =>
  typeof value === 'string'
    ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limite)
    : '';

const lerEnum = <T extends string>(
  value: unknown,
  values: readonly T[],
): T | null => typeof value === 'string' && values.includes(value as T)
  ? value as T
  : null;

const lerQuantidade = (value: unknown): number | null => {
  const quantidade = Number(value);
  return Number.isInteger(quantidade) && quantidade >= 1 && quantidade <= 5
    ? quantidade
    : null;
};

/**
 * Reconstrói somente comandos existentes no contrato local. Campos extras do
 * provedor e combinações inválidas são descartados antes do executor.
 */
export const validarComandoAssistenteIa = (
  input: unknown,
): ComandoAssistente | null => {
  if (!input || typeof input !== 'object') return null;
  const data = input as Record<string, unknown>;
  const dominio = limpar(data.dominio, 40);
  const acao = limpar(data.acao, 50);

  if (dominio === 'sistema') {
    if (acao === 'ajuda' || acao === 'confirmar' || acao === 'cancelar') {
      return {dominio, acao};
    }
    if (acao === 'orientar') {
      const topico = lerEnum(data.topico, [
        'rotas', 'pontos', 'contatos', 'historico', 'chamados',
        'preventiva', 'perfil',
      ] as const);
      return topico ? {dominio, acao, topico} : null;
    }
  }

  if (dominio === 'navegacao') {
    if (acao === 'voltar') return {dominio, acao};
    if (acao === 'abrir') {
      const destino = lerEnum(data.destino, [
        'inicio', 'mapa_filiais', 'historico', 'pontos', 'preventiva',
        'chamados', 'contatos', 'admin', 'perfil', 'sobre',
      ] as const);
      return destino ? {dominio, acao, destino} : null;
    }
  }

  if (dominio === 'mapa' && acao === 'pesquisar_filiais') {
    const termo = limpar(data.termo, 100);
    return termo ? {dominio, acao, termo} : null;
  }

  if (dominio === 'filiais') {
    if (acao === 'consultar' || acao === 'consultar_ultima') {
      const campo = lerEnum(data.campo, [
        'resumo', 'endereco', 'telefone', 'horario', 'gerente',
        'supervisor', 'cnpj', 'cep', 'bairro', 'cidade', 'uf',
      ] as const);
      if (!campo) return null;
      if (acao === 'consultar_ultima') return {dominio, acao, campo};

      const termo = limpar(data.termo, 100);
      return termo ? {dominio, acao, termo, campo} : null;
    }
    if (acao === 'contar_total' || acao === 'listar_cidades') {
      return {dominio, acao};
    }
    if (acao === 'contar_cidade') {
      const termo = limpar(data.termo, 100);
      return termo ? {dominio, acao, termo} : null;
    }
    if (acao === 'ranking') {
      const agrupamento = lerEnum(data.agrupamento, ['cidade', 'regiao'] as const);
      const ordem = lerEnum(data.ordem, ['mais', 'menos'] as const);
      const quantidade = lerQuantidade(data.quantidade);
      return agrupamento && ordem && quantidade
        ? {dominio, acao, agrupamento, ordem, quantidade}
        : null;
    }
  }

  if (dominio === 'pontos') {
    const categoria = lerEnum(data.categoria, [
      'Restaurante', 'Posto de Combustível',
    ] as const);
    if (acao === 'tracar_ultimo') return {dominio, acao};
    if (acao === 'mostrar_proximos' || acao === 'tracar_mais_proximo') {
      const quantidade = lerQuantidade(data.quantidade);
      return categoria && quantidade
        ? {dominio, acao, categoria, quantidade}
        : null;
    }
    if (acao === 'buscar') {
      const termo = limpar(data.termo, 100);
      if (!termo || typeof data.iniciarRota !== 'boolean') return null;
      return {
        dominio,
        acao,
        termo,
        ...(categoria ? {categoria} : {}),
        iniciarRota: data.iniciarRota,
      };
    }
  }

  if (dominio === 'contatos') {
    if (acao === 'consultar') {
      const termo = limpar(data.termo, 100);
      return termo ? {dominio, acao, termo} : null;
    }
    if (acao === 'consultar_ultimo') {
      const campo = lerEnum(data.campo, ['resumo', 'telefone', 'email'] as const);
      return campo ? {dominio, acao, campo} : null;
    }
    if (acao === 'listar_departamentos') return {dominio, acao};
    if (acao === 'ranking_departamentos') {
      const ordem = lerEnum(data.ordem, ['mais', 'menos'] as const);
      const quantidade = lerQuantidade(data.quantidade);
      return ordem && quantidade
        ? {dominio, acao, ordem, quantidade}
        : null;
    }
    if (acao === 'listar_pessoas' || acao === 'contar_pessoas') {
      const departamento = limpar(data.departamento, 90);
      return {dominio, acao, ...(departamento ? {departamento} : {})};
    }
  }

  if (dominio === 'historico') {
    const tipo = lerEnum(
      data.tipo,
      ['loja', 'restaurante', 'posto_combustivel'] as const,
    );
    if (acao === 'consultar_ultimo') {
      return {dominio, acao, ...(tipo ? {tipo} : {})};
    }
    if (acao === 'resumir') {
      const periodo = lerEnum(data.periodo, [
        'hoje', 'ontem', 'ultimos_7_dias', 'mes_atual', 'geral',
      ] as const);
      return periodo
        ? {dominio, acao, periodo, ...(tipo ? {tipo} : {})}
        : null;
    }
  }

  if (dominio === 'chamados' && acao === 'resumir') return {dominio, acao};

  if (dominio === 'preferencias') {
    if (acao === 'consultar_voz') return {dominio, acao};
    if (acao === 'definir_tema') {
      const modo = lerEnum(data.modo, ['claro', 'escuro'] as const);
      return modo ? {dominio, acao, modo} : null;
    }
    if (acao === 'definir_voz' && typeof data.ativa === 'boolean') {
      return {dominio, acao, ativa: data.ativa};
    }
  }

  if (dominio === 'perfil' && acao === 'consultar') {
    const campo = lerEnum(data.campo, ['resumo', 'email', 'setor'] as const);
    return campo ? {dominio, acao, campo} : null;
  }
  if (dominio === 'aplicativo' && acao === 'consultar_versao') {
    return {dominio, acao};
  }
  if (dominio === 'sugestoes' && acao === 'abrir') return {dominio, acao};

  return null;
};

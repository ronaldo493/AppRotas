import type {Filial} from '../../filiais/models/Filial';

export interface GrupoFiliaisAssistente {
  nome: string;
  quantidade: number;
}

export interface AnaliseFiliaisAssistente {
  total: number;
  cidades: GrupoFiliaisAssistente[];
  regioes: GrupoFiliaisAssistente[];
}

const CHAVES_REGIAO = new Set([
  'regiao',
  'regional',
  'nomeregiao',
  'nomeregional',
  'regiaocomercial',
]);

const normalizar = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const obterRegiao = (filial: Filial): string | null => {
  const campo = Object.entries(filial).find(([chave, valor]) =>
    CHAVES_REGIAO.has(normalizar(chave).replace(/\s/g, '')) &&
    typeof valor === 'string' &&
    Boolean(valor.trim()),
  );

  return typeof campo?.[1] === 'string' ? campo[1].trim() : null;
};

const removerDuplicadas = (filiais: readonly Filial[]): Filial[] => {
  const unicas = new Map<string, Filial>();

  filiais.forEach((filial, indice) => {
    const codigo = Number(filial.codigofilial);
    const chave = Number.isFinite(codigo) && codigo > 0
      ? `codigo:${codigo}`
      : `registro:${normalizar(filial.nomefilial)}:${normalizar(filial.nomecidade)}:${indice}`;

    if (!unicas.has(chave)) unicas.set(chave, filial);
  });

  return [...unicas.values()];
};

const agrupar = (
  filiais: readonly Filial[],
  obterNome: (filial: Filial) => string | null | undefined,
): GrupoFiliaisAssistente[] => {
  const grupos = new Map<string, GrupoFiliaisAssistente>();

  filiais.forEach(filial => {
    const nome = obterNome(filial)?.trim();
    if (!nome) return;

    const chave = normalizar(nome);
    const atual = grupos.get(chave);

    if (atual) atual.quantidade += 1;
    else grupos.set(chave, {nome, quantidade: 1});
  });

  return [...grupos.values()].sort(
    (primeiro, segundo) =>
      segundo.quantidade - primeiro.quantidade ||
      primeiro.nome.localeCompare(segundo.nome, 'pt-BR'),
  );
};

/**
 * Resume a distribuição das filiais sem depender de um formato regional
 * obrigatório. Regiões só são retornadas quando o cadastro realmente as traz.
 */
export const analisarFiliaisAssistente = (
  filiais: readonly Filial[],
): AnaliseFiliaisAssistente => {
  const filiaisUnicas = removerDuplicadas(filiais);

  return {
    total: filiaisUnicas.length,
    cidades: agrupar(filiaisUnicas, filial => filial.nomecidade),
    regioes: agrupar(filiaisUnicas, obterRegiao),
  };
};

/** Localiza uma cidade tolerando artigos e pequenas partes omitidas. */
export const encontrarCidadesAssistente = (
  cidades: readonly GrupoFiliaisAssistente[],
  termo: string,
): GrupoFiliaisAssistente[] => {
  const procurado = normalizar(termo);
  if (!procurado) return [];

  const exatas = cidades.filter(cidade => normalizar(cidade.nome) === procurado);
  if (exatas.length > 0) return exatas;

  return cidades.filter(cidade => {
    const nome = normalizar(cidade.nome);
    return nome.includes(procurado) || procurado.includes(nome);
  });
};

/** Aplica o sentido do ranking sem alterar a análise base. */
export const selecionarRankingFiliais = (
  grupos: readonly GrupoFiliaisAssistente[],
  ordem: 'mais' | 'menos',
  quantidade: number,
): GrupoFiliaisAssistente[] => {
  const ordenados = [...grupos].sort(
    (primeiro, segundo) =>
      (ordem === 'mais'
        ? segundo.quantidade - primeiro.quantidade
        : primeiro.quantidade - segundo.quantidade) ||
      primeiro.nome.localeCompare(segundo.nome, 'pt-BR'),
  );

  return ordenados.slice(0, Math.max(1, Math.min(5, quantidade)));
};

import type {Filial} from '../models/Filial';

export type AgrupamentoDistribuicaoFiliais = 'cidade' | 'estado';

export interface ItemDistribuicaoFiliais {
  chave: string;
  rotulo: string;
  quantidade: number;
  percentual: number;
}

export interface ResumoDistribuicaoFiliais {
  totalFiliais: number;
  totalCidades: number;
  totalEstados: number;
  cidades: ItemDistribuicaoFiliais[];
  estados: ItemDistribuicaoFiliais[];
  cidadeDestaque: ItemDistribuicaoFiliais | null;
  estadoDestaque: ItemDistribuicaoFiliais | null;
}

export interface FiltroDistribuicaoFiliais {
  tipo: AgrupamentoDistribuicaoFiliais;
  chave: string;
  rotulo: string;
  quantidade: number;
}

const normalizar = (valor: unknown): string =>
  String(valor ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

const limparRotulo = (valor: unknown): string =>
  String(valor ?? '').replace(/\s+/g, ' ').trim();

const obterIdentidadeFilial = (filial: Filial): string => {
  const codigo = Number(filial.codigofilial);

  return Number.isInteger(codigo) && codigo > 0
    ? `codigo:${codigo}`
    : `dados:${normalizar(filial.nomefilial)}|${normalizar(filial.nomecidade)}`;
};

const agruparFiliais = (
  filiais: readonly Filial[],
  obterValor: (filial: Filial) => unknown,
  formatarRotulo: (valor: string) => string = valor => valor,
): ItemDistribuicaoFiliais[] => {
  const grupos = new Map<string, {rotulo: string; quantidade: number}>();

  filiais.forEach(filial => {
    const valor = limparRotulo(obterValor(filial));
    const chave = normalizar(valor);
    if (!chave) return;

    const atual = grupos.get(chave);
    grupos.set(chave, {
      rotulo: atual?.rotulo ?? formatarRotulo(valor),
      quantidade: (atual?.quantidade ?? 0) + 1,
    });
  });

  return [...grupos.entries()]
    .map(([chave, grupo]) => ({
      chave,
      rotulo: grupo.rotulo,
      quantidade: grupo.quantidade,
      percentual:
        filiais.length > 0
          ? Number(((grupo.quantidade / filiais.length) * 100).toFixed(1))
          : 0,
    }))
    .sort(
      (primeiro, segundo) =>
        segundo.quantidade - primeiro.quantidade
        || primeiro.rotulo.localeCompare(segundo.rotulo, 'pt-BR'),
    );
};

/**
 * Resume a distribuição das filiais válidas do mapa. Códigos repetidos são
 * contados uma única vez para não distorcer ranking e percentuais.
 */
export const analisarDistribuicaoFiliais = (
  filiais: readonly Filial[],
): ResumoDistribuicaoFiliais => {
  const identidades = new Set<string>();
  const filiaisUnicas = filiais.filter(filial => {
    const identidade = obterIdentidadeFilial(filial);
    if (identidades.has(identidade)) return false;

    identidades.add(identidade);
    return true;
  });
  const cidades = agruparFiliais(
    filiaisUnicas,
    filial => filial.nomecidade,
  );
  const estados = agruparFiliais(
    filiaisUnicas,
    filial => filial.uf,
    valor => valor.toLocaleUpperCase('pt-BR'),
  );

  return {
    totalFiliais: filiaisUnicas.length,
    totalCidades: cidades.length,
    totalEstados: estados.length,
    cidades,
    estados,
    cidadeDestaque: cidades[0] ?? null,
    estadoDestaque: estados[0] ?? null,
  };
};

/** Verifica se uma filial pertence ao agrupamento escolhido no painel. */
export const filialPertenceAoGrupo = (
  filial: Filial,
  tipo: AgrupamentoDistribuicaoFiliais,
  chave: string,
): boolean =>
  normalizar(tipo === 'cidade' ? filial.nomecidade : filial.uf) === chave;

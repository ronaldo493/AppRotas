import type {Contato} from '../../contatos/models/Contato';

export interface DepartamentoContatosAssistente {
  nome: string;
  pessoas: Contato[];
}

const normalizar = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const removerDuplicados = (contatos: readonly Contato[]): Contato[] => {
  const unicos = new Map<string, Contato>();

  contatos.forEach(contato => {
    const chave = contato.documentId ?? String(
      contato.id ?? [
        normalizar(contato.departamento),
        normalizar(contato.colaboradores),
        contato.ramal ?? '',
      ].join('|'),
    );

    if (!unicos.has(chave)) unicos.set(chave, contato);
  });

  return [...unicos.values()];
};

/** Agrupa pessoas por departamento e preserva os nomes cadastrados. */
export const agruparContatosPorDepartamento = (
  contatos: readonly Contato[],
): DepartamentoContatosAssistente[] => {
  const departamentos = new Map<string, DepartamentoContatosAssistente>();

  removerDuplicados(contatos).forEach(contato => {
    const nome = contato.departamento.trim();
    if (!nome) return;

    const chave = normalizar(nome);
    const grupo = departamentos.get(chave);

    if (grupo) grupo.pessoas.push(contato);
    else departamentos.set(chave, {nome, pessoas: [contato]});
  });

  return [...departamentos.values()]
    .map(grupo => ({
      ...grupo,
      pessoas: [...grupo.pessoas].sort((primeiro, segundo) =>
        primeiro.colaboradores.localeCompare(segundo.colaboradores, 'pt-BR'),
      ),
    }))
    .sort((primeiro, segundo) => primeiro.nome.localeCompare(segundo.nome, 'pt-BR'));
};

/** Procura o departamento exato antes de aceitar correspondências parciais. */
export const encontrarDepartamentosAssistente = (
  departamentos: readonly DepartamentoContatosAssistente[],
  termo: string,
): DepartamentoContatosAssistente[] => {
  const procurado = normalizar(termo);
  if (!procurado) return [];

  const exatos = departamentos.filter(
    departamento => normalizar(departamento.nome) === procurado,
  );
  if (exatos.length > 0) return exatos;

  return departamentos.filter(departamento => {
    const nome = normalizar(departamento.nome);
    return nome.includes(procurado) || procurado.includes(nome);
  });
};

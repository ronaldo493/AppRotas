import type {Filial} from '../../filiais/models/Filial';

export interface FilialEncontradaAssistente {
  filial: Filial;
  pontuacao: number;
}

const normalizar = (valor: unknown): string =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Classifica filiais por código, nome, cidade, bairro e endereço. */
export function buscarFiliaisAssistente(
  filiais: readonly Filial[],
  termo: string,
  limite = 20,
): FilialEncontradaAssistente[] {
  const busca = normalizar(termo);
  if (!busca) return [];

  const tokens = busca.split(' ').filter(Boolean);

  return filiais
    .map(filial => {
      const codigo = String(filial.codigofilial);
      const nome = normalizar(filial.nomefilial);
      const cidade = normalizar(filial.nomecidade);
      const textoCompleto = normalizar([
        codigo,
        nome,
        cidade,
        filial.bairro,
        filial.endereco,
      ].join(' '));
      let pontuacao = 0;

      if (codigo === busca) pontuacao = 120;
      else if (nome === busca) pontuacao = 110;
      else if (cidade === busca) pontuacao = 100;
      else if (nome.startsWith(busca)) pontuacao = 90;
      else if (cidade.startsWith(busca)) pontuacao = 85;
      else if (textoCompleto.includes(busca)) pontuacao = 75;
      else if (tokens.every(token => textoCompleto.includes(token))) {
        pontuacao = 65;
      }

      return {filial, pontuacao};
    })
    .filter(resultado => resultado.pontuacao > 0)
    .sort(
      (primeiro, segundo) =>
        segundo.pontuacao - primeiro.pontuacao ||
        primeiro.filial.codigofilial - segundo.filial.codigofilial,
    )
    .slice(0, limite);
}

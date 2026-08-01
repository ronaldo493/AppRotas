import type {
  CategoriaPonto,
  PontoInteresse,
} from '../../pontos/models/Ponto';

export interface PontoEncontradoAssistente {
  ponto: PontoInteresse;
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

/** Busca pontos por descrição ou cidade, tolerando palavras fora de ordem. */
export function buscarPontosAssistente(
  pontos: readonly PontoInteresse[],
  termo: string,
  categoria?: CategoriaPonto,
  limite = 10,
): PontoEncontradoAssistente[] {
  const busca = normalizar(termo);
  if (!busca) return [];

  const tokens = busca.split(' ').filter(Boolean);

  return pontos
    .filter(ponto => !categoria || ponto.categoria === categoria)
    .map(ponto => {
      const descricao = normalizar(ponto.descricao);
      const cidade = normalizar(ponto.cidadePonto);
      const textoCompleto = `${descricao} ${cidade}`.trim();
      let pontuacao = 0;

      if (descricao === busca) pontuacao = 110;
      else if (cidade === busca) pontuacao = 100;
      else if (descricao.startsWith(busca)) pontuacao = 90;
      else if (textoCompleto.includes(busca)) pontuacao = 80;
      else if (tokens.every(token => textoCompleto.includes(token))) {
        pontuacao = 65;
      }

      return {ponto, pontuacao};
    })
    .filter(resultado => resultado.pontuacao > 0)
    .sort(
      (primeiro, segundo) =>
        segundo.pontuacao - primeiro.pontuacao ||
        primeiro.ponto.descricao.localeCompare(
          segundo.ponto.descricao,
          'pt-BR',
        ),
    )
    .slice(0, limite);
}

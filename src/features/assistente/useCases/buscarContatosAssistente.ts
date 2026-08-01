import type {Contato} from '../../contatos/models/Contato';

export interface ContatoEncontrado {
  contato: Contato;
  pontuacao: number;
}

const normalizarTexto = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9@\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Mede pequenas diferenças comuns na transcrição, como "Lusia" em vez de
 * "Lúcia", sem transformar a busca em uma correspondência excessivamente
 * permissiva.
 */
const calcularSimilaridade = (primeiro: string, segundo: string): number => {
  if (!primeiro || !segundo) return 0;
  if (primeiro === segundo) return 1;

  const anterior = Array.from(
    {length: segundo.length + 1},
    (_, indice) => indice,
  );

  for (
    let indicePrimeiro = 1;
    indicePrimeiro <= primeiro.length;
    indicePrimeiro += 1
  ) {
    const atual = [indicePrimeiro];

    for (
      let indiceSegundo = 1;
      indiceSegundo <= segundo.length;
      indiceSegundo += 1
    ) {
      const custo =
        primeiro[indicePrimeiro - 1] === segundo[indiceSegundo - 1] ? 0 : 1;

      atual[indiceSegundo] = Math.min(
        atual[indiceSegundo - 1] + 1,
        anterior[indiceSegundo] + 1,
        anterior[indiceSegundo - 1] + custo,
      );
    }

    anterior.splice(0, anterior.length, ...atual);
  }

  return (
    1 -
    anterior[segundo.length] /
      Math.max(primeiro.length, segundo.length)
  );
};

/**
 * Classifica contatos por correspondência exata, início e conteúdo. A busca
 * considera nome, departamento, ramal, DDR e e-mail e tolera pequenos erros
 * produzidos pelo reconhecimento de voz.
 */
export const buscarContatosAssistente = (
  contatos: readonly Contato[],
  termo: string,
  limite = 5,
): ContatoEncontrado[] => {
  const termoNormalizado = normalizarTexto(termo);
  const termoNumerico = termoNormalizado.replace(/\D/g, '');

  if (!termoNormalizado) return [];

  return contatos
    .map(contato => {
      const campos = [
        contato.colaboradores,
        contato.departamento,
        contato.ramal ?? '',
        contato.ddr ?? '',
        contato.email ?? '',
      ].map(normalizarTexto);
      const nome = campos[0];
      const departamento = campos[1];
      let pontuacao = 0;

      if (nome === termoNormalizado) pontuacao = 100;
      else if (nome.startsWith(termoNormalizado)) pontuacao = 85;
      else if (nome.includes(termoNormalizado)) pontuacao = 75;
      else if (departamento === termoNormalizado) pontuacao = 70;
      else if (departamento.includes(termoNormalizado)) pontuacao = 60;
      else if (
        termoNumerico.length >= 3 &&
        campos.some(campo =>
          campo.replace(/\D/g, '').includes(termoNumerico),
        )
      ) {
        pontuacao = 65;
      }
      else if (campos.some(campo => campo.includes(termoNormalizado))) {
        pontuacao = 50;
      } else {
        const similaridadeNome = calcularSimilaridade(
          nome,
          termoNormalizado,
        );
        const similaridadeDepartamento = calcularSimilaridade(
          departamento,
          termoNormalizado,
        );

        if (similaridadeNome >= 0.72) {
          pontuacao = Math.round(35 + similaridadeNome * 20);
        } else if (similaridadeDepartamento >= 0.78) {
          pontuacao = Math.round(30 + similaridadeDepartamento * 15);
        }
      }

      return {contato, pontuacao};
    })
    .filter(resultado => resultado.pontuacao > 0)
    .sort(
      (primeiro, segundo) =>
        segundo.pontuacao - primeiro.pontuacao ||
        primeiro.contato.colaboradores.localeCompare(
          segundo.contato.colaboradores,
          'pt-BR',
        ),
    )
    .slice(0, limite);
};

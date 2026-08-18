import type {
  AdminCollaboratorLocation,
  AdminCollaboratorMapData,
} from '../models/AdminCollaboratorMap';

type AdminCollaboratorLocationWire = Omit<
  AdminCollaboratorLocation,
  'latitude' | 'longitude' | 'precisaoMetros' | 'idadeSegundos'
> & {
  latitude: number | string;
  longitude: number | string;
  precisaoMetros: number | string;
  idadeSegundos: number | string;
};

type AdminCollaboratorMapWire = Omit<
  AdminCollaboratorMapData,
  'colaboradores'
> & {
  colaboradores: AdminCollaboratorLocationWire[];
};

const converterNumero = (valor: number | string): number => {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isFinite(numero) ? numero : Number.NaN;
};

/** Converte decimais do Strapi em números nativos antes do índice do mapa. */
export function mapearRespostaMapaColaboradores(
  dados: AdminCollaboratorMapWire,
): AdminCollaboratorMapData {
  return {
    ...dados,
    colaboradores: dados.colaboradores.map(colaborador => ({
      ...colaborador,
      latitude: converterNumero(colaborador.latitude),
      longitude: converterNumero(colaborador.longitude),
      precisaoMetros: converterNumero(colaborador.precisaoMetros),
      idadeSegundos: converterNumero(colaborador.idadeSegundos),
    })),
  };
}

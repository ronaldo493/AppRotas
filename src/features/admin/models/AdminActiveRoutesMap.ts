export type EstadoAtualizacaoRotaAtiva =
  | 'atual'
  | 'atrasada'
  | 'sem_atualizacao'
  | 'aguardando_primeiro_lote';

export interface AdminActiveRouteLocation {
  codigoSessao: string;
  usuarioId: number | string | null;
  username: string;
  setor: string;
  iniciadaEm: string;
  latitude: number | null;
  longitude: number | null;
  precisaoMetros: number | null;
  capturadaEm: string | null;
  recebidaEm: string | null;
  idadeSegundos: number | null;
  estado: EstadoAtualizacaoRotaAtiva;
  quantidadePontos: number;
  quantidadeDestinosPlanejados: number;
  quantidadeDestinosVisitados: number;
}

export interface TotaisAdminActiveRoutesMap {
  rotasEmAndamento: number;
  comLocalizacao: number;
  aguardandoPrimeiroLote: number;
  atual: number;
  atrasada: number;
  semAtualizacao: number;
}

export interface AdminActiveRoutesMapData {
  geradoEm: string;
  escopo: {
    abrangencia: 'todos_setores' | 'proprio_setor';
    setor: string | null;
  };
  totais: TotaisAdminActiveRoutesMap;
  rotas: AdminActiveRouteLocation[];
}

/** Impede que uma origem planejada seja apresentada como posição rastreada. */
export function rotaAtivaPossuiLocalizacao(
  rota: AdminActiveRouteLocation,
): rota is AdminActiveRouteLocation & {latitude: number; longitude: number} {
  return rota.estado !== 'aguardando_primeiro_lote'
    && typeof rota.latitude === 'number'
    && Number.isFinite(rota.latitude)
    && typeof rota.longitude === 'number'
    && Number.isFinite(rota.longitude);
}

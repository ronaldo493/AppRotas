export type EstadoLocalizacaoColaborador =
  | 'atual'
  | 'recente'
  | 'desatualizada';

export interface AdminCollaboratorLocation {
  usuarioId: number | string;
  username: string;
  setor: string;
  cargo: string | null;
  latitude: number;
  longitude: number;
  precisaoMetros: number;
  capturadaEm: string;
  recebidaEm: string | null;
  idadeSegundos: number;
  estado: EstadoLocalizacaoColaborador;
  sessaoAtiva: boolean;
  origem: 'aplicativo' | 'rota_monitorada';
}

export interface AdminCollaboratorMapData {
  geradoEm: string;
  validadeMaximaMinutos: number;
  escopo: {
    abrangencia: 'todos_setores' | 'proprio_setor';
    setor: string | null;
  };
  totais: Record<EstadoLocalizacaoColaborador, number>;
  colaboradores: AdminCollaboratorLocation[];
}

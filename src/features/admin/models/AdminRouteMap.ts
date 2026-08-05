import type {SituacaoExecucaoAdmin} from './AdminRouteDashboard';

export interface CoordenadaAdminRouteMap {
  latitude: number;
  longitude: number;
}

export interface OrigemAdminRouteMap extends CoordenadaAdminRouteMap {
  cidade: string | null;
}

export interface DestinoAdminRouteMap {
  codigo: number | null;
  nome: string;
  cidade: string;
  ordem: number | null;
  tipo: string;
  latitude: number | null;
  longitude: number | null;
  visitado: boolean;
}

export interface AdminRouteMapData {
  codigoSessao: string;
  username: string;
  setor: string;
  situacaoExecucao: SituacaoExecucaoAdmin;
  iniciadaEm: string;
  finalizadaEm: string | null;
  origem: OrigemAdminRouteMap | null;
  destinos: DestinoAdminRouteMap[];
  trajetoPlanejado: string | null;
  trajetoReal: string | null;
  rotaConfirmadaPorGps: boolean;
  teveInterrupcaoLocalizacao: boolean;
}

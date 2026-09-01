import type {NavegadorRota} from '../../execucaoRota/models/ExecucaoRota';

export interface DecisaoNavegadorRota {
  navegador: NavegadorRota | null;
  wazeSubstituidoPorGoogle: boolean;
}

/**
 * Resolve a escolha sem esconder limitações: rotas com várias paradas usam
 * Google Maps, pois o fluxo externo do Waze recebe somente o destino final.
 */
export const resolverNavegadorRota = ({
  quantidadeDestinos,
  navegadorSolicitado,
  navegadorPreferido,
}: {
  quantidadeDestinos: number;
  navegadorSolicitado?: NavegadorRota;
  navegadorPreferido?: NavegadorRota | null;
}): DecisaoNavegadorRota => {
  if (quantidadeDestinos > 1) {
    return {
      navegador: 'google',
      wazeSubstituidoPorGoogle: navegadorSolicitado === 'waze',
    };
  }

  return {
    navegador: navegadorSolicitado ?? navegadorPreferido ?? null,
    wazeSubstituidoPorGoogle: false,
  };
};

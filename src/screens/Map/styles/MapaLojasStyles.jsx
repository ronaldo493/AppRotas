import { StyleSheet } from 'react-native';

const MapaLojasStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  search: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,

    borderWidth: 1,
    borderRadius: 14,

    elevation: 2,

    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },

  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  /*
   * Contador de filiais exibidas.
   */
  storeCountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderWidth: 1,
    borderRadius: 20,

    elevation: 4,

    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },

  storeCountText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * Banner exibido sobre o mapa.
   */
  bannerOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,

    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',

    elevation: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  bannerContent: {
    paddingVertical: 4,
  },

  bannerText: {
    fontSize: 14,
    lineHeight: 20,
  },

  /*
   * Carregamento centralizado sobre o mapa.
   */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(0, 0, 0, 0.12)',
  },

  loadingCard: {
    alignItems: 'center',

    minWidth: 180,

    paddingHorizontal: 24,
    paddingVertical: 20,

    borderWidth: 1,
    borderRadius: 16,

    elevation: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MapaLojasStyles;
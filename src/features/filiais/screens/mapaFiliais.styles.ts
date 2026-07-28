import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  searchContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
    zIndex: 20,
    elevation: 6,
  },

  search: {
    height: 52,
    borderRadius: 16,
  },

  searchInput: {
    minHeight: 52,
    fontSize: 14,
  },

  storeCountBadge: {
    position: 'absolute',
    top: 84,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 18,
    zIndex: 15,
    elevation: 4,
  },

  storeCountText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },

  bannerOverlay: {
    position: 'absolute',
    top: 120,
    left: 14,
    right: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 14,
    zIndex: 18,
    elevation: 5,
  },

  bannerContent: {
    paddingVertical: 4,
  },

  bannerText: {
    fontSize: 13,
    lineHeight: 18,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    zIndex: 30,
    elevation: 30,
  },

  loadingCard: {
    alignItems: 'center',
    minWidth: 175,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderWidth: 1,
    borderRadius: 16,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default styles;

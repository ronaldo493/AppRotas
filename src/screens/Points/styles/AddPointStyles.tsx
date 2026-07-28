import { StyleSheet } from 'react-native';

const AddPointStyles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  legend: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    zIndex: 10,
    elevation: 3,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
  },

  legendDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 10,
  },

  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    zIndex: 40,
    elevation: 40,
  },

  loadingCard: {
    alignItems: 'center',
    minWidth: 170,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 16,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  addButton: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    borderRadius: 16,
    zIndex: 20,
    elevation: 6,
  },

  routeButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    borderRadius: 16,
    zIndex: 20,
    elevation: 6,
  },

  /*
   * A propriedade bottom é definida pelo Animated.Value.
   * Quando o teclado abre, o painel é posicionado acima dele.
   */
  keyboardContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
  },

  bottomPanel: {
    marginHorizontal: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 18,
  },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  panelTitleContainer: {
    flex: 1,
    paddingRight: 6,
  },

  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  panelStatus: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  input: {
    marginBottom: 12,
  },

  actions: {
    flexDirection: 'row',
  },

  secondaryButton: {
    flex: 1,
    marginRight: 5,
    borderRadius: 10,
  },

  primaryButton: {
    flex: 1,
    marginLeft: 5,
    borderRadius: 10,
  },

  buttonContent: {
    minHeight: 44,
  },

  dialog: {
    borderRadius: 18,
  },

  dialogTitle: {
    textAlign: 'center',
  },

  dialogText: {
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 14,
  },

  categoryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
  },

  categoryButtonContent: {
    minHeight: 46,
  },
});

export default AddPointStyles;

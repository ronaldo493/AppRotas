import { StyleSheet } from 'react-native';

const HistoricoStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  /*
   * FILTRO POR PERÍODO
   */

  filterContainer: {
    marginBottom: 15,
  },

  filterHeader: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },


  filterClearText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  dateField: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 10,
  },

  dateFieldContent: {
    flex: 1,
    marginLeft: 7,
  },

  dateFieldLabel: {
    fontSize: 10,
    lineHeight: 12,
  },

  dateFieldValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 1,
  },

  filterSearchButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },

  /*
   * LISTA
   */

  listContent: {
    paddingBottom: 24,
    gap: 12,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  /*
   * CARD DO HISTÓRICO
   */

  historyCard: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardHeaderContent: {
    flex: 1,
    paddingRight: 10,
  },

  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },

  cardDate: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  /*
   * ROTAS DO CARD
   */

  routesContainer: {
    gap: 8,
  },

  routeRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 11,
  },

  orderContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    marginRight: 10,
  },

  orderText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },

  routeContent: {
    flex: 1,
  },

  routeName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  routeDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },

  emptyRoutesText: {
    fontSize: 13,
    lineHeight: 19,
  },

  /*
   * LISTA VAZIA E CARREGAMENTO
   */

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 70,
  },

  emptyTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
  },

  loadingText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },

  footerLoading: {
    marginVertical: 16,
  },

  endText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingVertical: 14,
  },
});

export default HistoricoStyles;
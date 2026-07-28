import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 18,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 10,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    paddingRight: 8,
  },
  storeName: {
    fontWeight: '700',
  },
  openingDate: {
    fontStyle: 'italic',
  },
  routeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7,
  },
  routeButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  textContent: {
    paddingBottom: 7,
    fontSize: 14,
    lineHeight: 20,
  },
  detailContainer: {
    padding: 12,
    marginBottom: 18,
    borderRadius: 10,
  },
  statusText: {
    paddingBottom: 7,
    fontSize: 14,
    fontWeight: '700',
  },
  total: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
  },
});

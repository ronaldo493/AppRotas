import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  search: {
    flex: 1,
    height: 48,
    borderRadius: 14,
  },
  searchInput: {
    minHeight: 0,
    fontSize: 13,
  },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14,
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  resultHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  resultCount: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  activeFilterText: {
    maxWidth: 140,
    fontSize: 11,
  },
  listContent: {
    paddingBottom: 24,
  },
  itemSeparator: {
    height: 10,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 80,
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
    marginTop: 8,
  },
});

export default styles;

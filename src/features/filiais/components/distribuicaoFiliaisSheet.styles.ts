import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 9,
    paddingHorizontal: 18,
  },
  handle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginBottom: 14,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    paddingVertical: 8,
    paddingLeft: 14,
  },
  closeText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clearFilter: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
  },
  clearFilterText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  position: {
    width: 24,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemLabel: {
    flex: 1,
    paddingRight: 10,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  itemValue: {
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 3,
    marginTop: 7,
    overflow: 'hidden',
    borderRadius: 2,
  },
  bar: {
    height: 3,
    borderRadius: 2,
    opacity: 0.72,
  },
  emptyList: {
    minHeight: 130,
    justifyContent: 'center',
  },
  emptyText: {
    paddingHorizontal: 20,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  hint: {
    paddingTop: 10,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});

export default styles;

import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  description: {
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: 9,
  },
  item: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  itemCategory: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
});

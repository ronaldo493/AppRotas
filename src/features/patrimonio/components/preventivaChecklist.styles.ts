import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 12,
  },
  item: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  number: {
    width: 22,
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});

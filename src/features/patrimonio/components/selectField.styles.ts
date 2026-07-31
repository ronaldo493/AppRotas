import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  label: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  value: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    fontSize: 12,
    fontWeight: '600',
  },
});

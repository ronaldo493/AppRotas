import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  modelField: {
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scanButton: {
    borderRadius: 10,
  },
  scanButtonContent: {
    minHeight: 47,
    paddingHorizontal: 3,
  },
  scanButtonLabel: {
    marginHorizontal: 8,
    fontSize: 11,
  },
});

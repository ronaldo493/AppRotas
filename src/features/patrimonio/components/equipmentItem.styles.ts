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
    gap: 10,
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: 'transparent',
  },
  scanButton: {
    width: 72,
    height: 42,
    borderRadius: 10,
  },
  scanButtonContent: {
    height: 40,
    paddingHorizontal: 0,
  },
  scanButtonLabel: {
    marginHorizontal: 0,
    fontSize: 12,
  },
});

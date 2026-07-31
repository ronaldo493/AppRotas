import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    paddingTop: 10,
    paddingHorizontal: 18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    marginTop: 18,
    backgroundColor: 'transparent',
  },
  error: {
    marginTop: 5,
    marginLeft: 12,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 18,
  },
  primaryButton: {
    minWidth: 104,
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 44,
  },
});

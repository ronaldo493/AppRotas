import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 18,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: 'center',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  fields: {
    gap: 10,
    marginTop: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 18,
  },
  primaryButton: {
    borderRadius: 12,
  },
  buttonContent: {
    minHeight: 44,
  },
});

export default styles;

import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  title: {
    marginTop: 20,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    marginTop: 24,
    gap: 10,
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    minHeight: 46,
  },
});

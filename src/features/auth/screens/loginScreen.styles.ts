import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 30,
  },

  headerLogin: {
    alignItems: 'center',
    marginBottom: 30,
  },

  logoContainer: {
    width: 128,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 22,
  },

  logo: {
    width: 105,
    height: 58,
  },

  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
  },

  description: {
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 7,
  },

  form: {
    gap: 14,
  },

  inputContainer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 17,
    borderRadius: 28,
    borderWidth: 1,
  },

  input: {
    flex: 1,
    height: 56,
    paddingVertical: 0,
    fontSize: 15,
  },

  button: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    marginTop: 4,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  footerLogin: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 14,
  },

  forgotText: {
    flexShrink: 1,
    maxWidth: 290,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },

  title: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 0.4,
  },

  text: {
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'justify',
  },

  informationContainer: {
    borderTopWidth: 1,
    paddingTop: 18,
    marginTop: 24,
    gap: 8,
  },

  versionText: {
    fontSize: 13,
    lineHeight: 19,
  },

  developerText: {
    fontSize: 13,
    lineHeight: 19,
  },

  buttonBack: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 25,
    marginTop: 'auto',
  },

  buttonBackText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
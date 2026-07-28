import { StyleSheet } from 'react-native';

const AboutStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 28,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },

  contentCard: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 16,
  },

  text: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
  },
  spacedText: {
    marginTop: 16,
  },
  permissionText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  informationContainer: {
    marginTop: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 14,
  },

  informationRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  informationLabel: {
    fontSize: 13,
  },

  informationValue: {
    marginLeft: 16,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },

  divider: {
    height: StyleSheet.hairlineWidth,
  },

  buttonBack: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 12,
  },

  buttonBackText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AboutStyles;

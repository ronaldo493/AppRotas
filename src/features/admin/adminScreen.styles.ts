import { StyleSheet } from 'react-native';

const AdminStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 30,
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 23,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },

  optionsContainer: {
    gap: 10,
  },

  option: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 14,
  },

  iconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 12,
  },

  optionContent: {
    flex: 1,
    paddingRight: 8,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  optionDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },

  developmentText: {
    marginTop: 22,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default AdminStyles;

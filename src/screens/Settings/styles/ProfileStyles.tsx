import { StyleSheet } from 'react-native';

const ProfileStyles =  StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 24,
  },

  content: {
    gap: 12,
  },

  infoBox: {
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderRadius: 14,
  },

  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },

  value: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
});

export default ProfileStyles;
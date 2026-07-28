import {StyleSheet} from 'react-native';

const ProfileStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
    marginBottom: 20,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  infoRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 8,
  },
  addEmailButton: {
    borderRadius: 8,
    marginRight: -8,
  },
  addEmailButtonContent: {
    minHeight: 32,
    paddingHorizontal: 2,
  },
  addEmailButtonLabel: {
    fontSize: 12,
    lineHeight: 16,
    marginHorizontal: 8,
    marginVertical: 0,
  },
  emailForm: {
    gap: 10,
    marginTop: -10,
    marginBottom: 4,
  },
  emailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  emailFormButton: {
    minWidth: 92,
    borderRadius: 10,
  },
  button: {
    borderRadius: 12,
    marginTop: 12,
  },
  buttonContent: {
    minHeight: 46,
  },
  passwordSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 26,
    paddingTop: 22,
  },
  passwordDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -3,
  },
});

export default ProfileStyles;

import {StyleSheet} from 'react-native';

export default StyleSheet.create({
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
    fontWeight: '700',
    lineHeight: 28,
  },
  description: {
    marginTop: 5,
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 21,
  },
  form: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  storeInput: {
    backgroundColor: 'transparent',
  },
  serviceField: {
    marginTop: 14,
  },
  fieldError: {
    marginTop: 5,
    marginLeft: 12,
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    marginTop: 18,
    borderRadius: 12,
  },
  primaryButtonContent: {
    minHeight: 47,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 22,
  },
  checklistToggle: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 10,
  },
  checklistToggleText: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  checklistDescription: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
  checklistAction: {
    fontSize: 12,
    fontWeight: '600',
  },
});

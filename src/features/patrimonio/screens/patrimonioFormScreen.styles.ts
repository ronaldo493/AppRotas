import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 42,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderRadius: 12,
  },
  summaryItem: {
    flex: 1,
    paddingVertical: 13,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    marginHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  summaryValue: {
    marginTop: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 23,
  },
  description: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
  },
  typeList: {
    marginHorizontal: -18,
    marginTop: 12,
    marginBottom: 16,
  },
  typeListContent: {
    gap: 8,
    paddingHorizontal: 18,
  },
  typeButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 10,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  addSectionButton: {
    marginTop: 2,
    borderRadius: 12,
  },
  addSectionButtonContent: {
    minHeight: 46,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },
  sendButton: {
    borderRadius: 12,
  },
  sendButtonContent: {
    minHeight: 49,
  },
  sendHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  dialogText: {
    fontSize: 14,
    lineHeight: 21,
  },
});

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },

  routeContainer: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 55,
  },

  emptyIconContainer: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 22,
  },

  emptyTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    maxWidth: 310,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 9,
  },

  messageContainer: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  traceButton: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
  },

  traceButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  inputContainer: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 17,
    borderRadius: 29,
    borderWidth: 1,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    height: 58,
    paddingVertical: 0,
    fontSize: 16,
  },

  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  feedbackText: {
    fontSize: 13,
  },

  errorContainer: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },

  resultCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cardHeaderContent: {
    flex: 1,
    marginLeft: 12,
  },

  cardTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    marginVertical: 15,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  detailContent: {
    flex: 1,
    marginLeft: 11,
  },

  detailValue: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  detailComplement: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  addButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 24,
    marginTop: 2,
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
  },

  estimateDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 6,
    marginBottom: 12,
  },

  estimateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },

  estimateIconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },

  estimateContent: {
    flex: 1,
  },

  estimateTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  estimateDescription: {
    flex: 1,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },

  estimateText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  estimateError: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  
  notFoundContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  notFoundContent: {
    flex: 1,
  },

  notFoundTitle: {
    fontSize: 14,
    fontWeight: '700',
  },

  notFoundText: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
  },
});
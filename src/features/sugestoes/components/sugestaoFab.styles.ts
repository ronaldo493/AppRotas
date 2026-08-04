import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 10,
    top: '60%',
    width: 50,
    height: 50,
    marginTop: -25,
    zIndex: 20,
    elevation: 10,
  },

  fab: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },

  modalContent: {
    width: '100%',
    maxHeight: '82%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },

  scrollView: {
    flexShrink: 1,
  },

  modalScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  headerContent: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },

  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },

  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionsContainer: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 12,
  },

  optionButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: 10,
  },

  optionText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
    textAlign: 'center',
  },

  input: {
    minHeight: 110,
    maxHeight: 180,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 11,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },

  characterCount: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'right',
    marginTop: 4,
  },

  sendButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
    borderRadius: 12,
  },

  sendButtonText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
});

export default styles;

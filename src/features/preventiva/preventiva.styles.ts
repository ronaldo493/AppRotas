import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    marginVertical: 12,
    fontSize: 14,
  },
  inputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  primaryButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    fontWeight: '700',
  },
  checklistToggle: {
    alignSelf: 'flex-start',
    paddingVertical: 16,
  },
  checklistToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  checklistContainer: {
    width: '100%',
    flex: 1,
    borderRadius: 8,
  },
  checklistContent: {
    paddingBottom: 24,
  },
  checklistItem: {
    marginVertical: 4,
    padding: 9,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    marginBottom: 14,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalOption: {
    padding: 11,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    padding: 11,
    marginTop: 18,
    borderRadius: 8,
  },
  reportContent: {
    padding: 18,
    paddingBottom: 100,
  },
  storeText: {
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTypeButton: {
    alignItems: 'center',
    padding: 13,
    marginVertical: 4,
    borderRadius: 7,
  },
  sectionTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionCard: {
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  equipmentLabel: {
    flex: 1,
    fontSize: 14,
  },
  patrimonioInput: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  scanButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 7,
  },
  scanButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  picker: {
    marginBottom: 14,
  },
  actionSpacing: {
    marginTop: 10,
  },
  camera: {
    flex: 1,
  },
  cameraActions: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    padding: 30,
  },
  sendButton: {
    marginTop: 20,
  },
});

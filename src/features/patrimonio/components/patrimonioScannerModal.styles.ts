import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  camera: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guide: {
    width: 238,
    height: 150,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 14,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  error: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 12,
  },
  action: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});

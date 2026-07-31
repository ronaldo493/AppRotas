import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  sheet: {
    maxHeight: '78%',
    paddingTop: 10,
    paddingHorizontal: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  description: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
  },
  closeButton: {
    paddingVertical: 3,
  },
  closeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingVertical: 8,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  selectedText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

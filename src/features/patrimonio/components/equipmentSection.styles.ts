import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 3,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  caption: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  deleteButton: {
    paddingVertical: 3,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: 7,
    marginBottom: 7,
    marginLeft: -8,
  },
  addButtonLabel: {
    fontSize: 12,
  },
});

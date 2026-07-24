import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  list: {
    width: '100%',
  },

  routeItem: {
    width: '100%',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },

  routeContent: {
    flex: 1,
    marginHorizontal: 10,
  },

  text: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },

  code: {
    fontSize: 12,
    marginTop: 2,
  },
});
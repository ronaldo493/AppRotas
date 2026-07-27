import { StyleSheet } from 'react-native';

const Location = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 4,
  },

  message: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  action: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default Location;
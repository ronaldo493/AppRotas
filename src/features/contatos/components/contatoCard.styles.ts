import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    borderRadius: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    marginRight: 12,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  department: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 1,
  },
  details: {
    gap: 2,
    marginTop: 8,
  },
  detail: {
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    gap: 8,
    marginLeft: 10,
  },
  action: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
});

export default styles;

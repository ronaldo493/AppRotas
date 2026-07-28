import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  card: {
    height: 116,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
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

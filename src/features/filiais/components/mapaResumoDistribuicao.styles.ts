import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 14,
    right: 14,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    zIndex: 15,
    elevation: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingLeft: 14,
    paddingVertical: 10,
  },
  primaryText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  secondaryText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  action: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  actionText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});

export default styles;

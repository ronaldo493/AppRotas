import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabBar: {
    height: 85,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0,
  },
  tabBarLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default styles;

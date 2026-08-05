import {StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 22,
  },
  header: {
    marginBottom: 22,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
  },
  options: {
    gap: 10,
  },
  option: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
  },
  optionDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
  optionAction: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
});

export default styles;

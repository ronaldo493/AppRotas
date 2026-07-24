import { StyleSheet } from 'react-native';

const AddPointStyles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 15,
    },
    map: {
      flex: 1,
    },
    contentTitle: {
      display:'flex', 
      flexDirection: 'row', 
    },
    description: {
      display: 'flex',
      justifyContent: 'space-between',
      padding:10,
      borderRadius: 6,
      marginBottom: 15,
      backgroundColor: '#d1d1d1'
    },
    subtitle: {
      fontWeight: 'bold',
      padding: 4,
    },
    containerBtn: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    btnAdd: {
      marginTop: 15,
    },
    buttonContainer: {
      flex: 1,
    },
    btnFinal: {
      paddingVertical: 9,
      textAlign: 'center',
      margin: 10,
    },
    inputDesc: {
      margin: 15,
    },
  });


export default AddPointStyles;


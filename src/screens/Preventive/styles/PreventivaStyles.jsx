import { StyleSheet } from "react-native";

const PreventivaStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 15,
    },
    title: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginVertical: 14,
        textAlign: 'left',
    },
    input: {
        flex: 1,
        marginRight: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        padding: 12,
        borderRadius: 8,
        fontWeight: 'bold',
        elevation: 4
    },
    //Estilo para o Checklist Renderizado
    checklistItem: {
        fontSize: 14,
        fontStyle: 'italic',
        marginVertical: 5,
        padding: 7,
        borderRadius: 8,
        borderColor: '#ddd',
        elevation: 0.6, 
    },
    buttonCheckContainer: {
        width: '100%',
        margin: 15,
        flex: 1,
        alignItems: 'flex-start',
    },
    buttonChecklist: {
        fontSize: 14,
        padding: 14,
        borderRadius: 4,
        fontWeight: 'bold',
    },
    FlatlistContainer:{
        margin: 15,
    },
    checklistContainer:{
        flex: 1,
        borderRadius: 8,
    },
    //Modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        borderRadius: 10,
        
    },
    modalTitle: {
        fontSize: 16,
        marginBottom: 15,
        textAlign: 'center',
        borderRadius: 6,
    },
    modalButton: {
        padding: 4,
        marginVertical: 5,
        borderRadius: 4,
    },
    optionButton: {
        padding: 10,
        borderBottomWidth: 1,
    },
    optionText: {
        textAlign: 'center',
    },
    closeButton: {
        padding: 10,
        borderRadius: 6,
        marginTop: 25,
    }
})

export default PreventivaStyles;
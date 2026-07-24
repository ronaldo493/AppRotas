import { StyleSheet } from "react-native";

const PatrimonioAssinaturaStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    filialText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    optionContainer: {
        marginTop: 10,
    },
    optionButton: {
        padding: 14,
        marginVertical: 4,
        alignItems: 'center',
        borderRadius: 5,
    },
    optionText: {
        fontSize: 14,
    },
    buttonSend: {
	    marginTop: '5%',
    },

    //Estilo Máquina Section
    contentSection: {
        marginBottom: 20,
        padding: 5,
        borderRadius: 8,
    },
    titleSection: {
        paddingHorizontal: 5,
        fontSize: 16,             
        fontWeight: 'bold',       
        marginVertical: 18,        
    },
    sectionItem: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 6, 
    },
   
    //Itens do Maquina Item
    itemRowContainer: {
        flexDirection: "row",
        paddingHorizontal: 5,
        marginBottom: 10,
        justifyContent: "space-between",
        alignItems: "center", 
    },
    itemLabel: {
        fontSize: 14,
        flex: 1,
    },
    PatrimonioInput: {
        flex: 1,
        marginRight: 8,
    },
    scanButton: {
        padding: 8,
        borderRadius: 8,
        flex: 1,
    },
    textButton: {
        fontSize: 12,
        textAlign: 'center',
        alignItems:'center',
        fontWeight: 'bold'
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
    input: {
        marginBottom: 25,
    }, 
    buttonAddMachine:{
        marginBottom: 10,
    },
    modalScan:{
        flex: 1,
    },
    viewButton:{
        position: 'absolute', 
        bottom: 0,
        left: 0,
        right: 0,
        padding: 30,
    }
});

export default PatrimonioAssinaturaStyles;

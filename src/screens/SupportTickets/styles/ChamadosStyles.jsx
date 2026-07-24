import { StyleSheet } from 'react-native';

const ChamadosStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 15,
        flex: 1,
    },
    btnContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        padding: 10,
        borderRadius: 8,
        flex: 1,
    },
    textTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    content: {
        marginTop: 18,
        width: '100%',
    },
    item: {
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        flex: 1,
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
    },
    btnRota: {
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignSelf: 'flex-end',               
    },
    textContent: {
        fontSize: 14,
        paddingBottom: 7,
        lineHeight: 22,
        
    },
    detailContainer: {
        marginTop: 0,
        marginBottom: 18,
        padding: 10,
        borderRadius: 8,
    },
    textCount: {
        width: '100%',
        padding: 10,
        fontWeight: '600',
        textAlign: 'center',
        borderRadius: 8,
        marginTop: 10,
    }
    
});

export default ChamadosStyles;
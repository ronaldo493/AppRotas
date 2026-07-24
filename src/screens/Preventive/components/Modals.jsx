import React from 'react';
import { Button, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from "../../../components/Sidebar/styles/ThemeStyles";
import PatrimonioAssinaturaStyles from "../styles/PatrimonioAssinaturaStyles";

export default function Modals({ visible, onClose, modalType, allItems, onSelectItem, onAddMachine, newMachineLetter, setNewMachineLetter }) {
    const themeStyles = useAppTheme();
    const isDarkMode = themeStyles.custom.isDarkMode;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={PatrimonioAssinaturaStyles.modalContainer}>
                <View style={[PatrimonioAssinaturaStyles.modalContent, themeStyles.contentModal]}>
                    <Text style={[PatrimonioAssinaturaStyles.modalTitle, themeStyles.titleModal]}>
                        {modalType === 'item' ? 'Escolha um item' : 'Adicionar nova máquina'}
                    </Text>

                    {modalType === 'item' ? (
                        allItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[PatrimonioAssinaturaStyles.modalButton, themeStyles.buttonModal]}
                                onPress={() => {
                                    onSelectItem(item);
                                    onClose();
                                }}
                            >
                                <Text style={[PatrimonioAssinaturaStyles.modalButton, themeStyles.textModal]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View>
                            <TextInput
                                style={[PatrimonioAssinaturaStyles.input, themeStyles.input]}
                                placeholder="Digite a letra da máquina"
                                value={newMachineLetter} //Usa o valor da letra da nova máquina passado como prop
                                onChangeText={setNewMachineLetter} //Atualiza a letra da máquina no componente pai
                                maxLength={1}
                            />
                            <View style={PatrimonioAssinaturaStyles.buttonAddMachine}>
                                <Button 
                                    title="Adicionar Máquina" 
                                    onPress={() => onAddMachine(newMachineLetter)} //Passa a letra da máquina para a função do pai
                                    color={isDarkMode ? '#BB5059' : '#BB5059'}
                                />
                            </View>
                        </View>
                    )}

                    <Button 
                        title="Cancelar" 
                        onPress={onClose}
                        color={isDarkMode ? '#BB5059' : '#BB5059'}
                    />
                </View>
            </View>
        </Modal>
    );
}

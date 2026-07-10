import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../components/styles/ThemeStyles';
import { useThemeContext } from '../../src/context/ThemeContext';
import PreventivaStyles from '../styles/PreventivaStyles';
import Checklist from './Checklist';

export default function Preventiva (){
    //Modo escuro 
    const themeStyles = useAppTheme();
    const isDarkMode = themeStyles.custom.isDarkMode;

    //Filial Escolhida
    const [filialInput, setFilialInput] = useState('');
    const [selectedOption, setSelectedOption] = useState(null); //Estado para a opção selecionada
    const [showModal, setShowModal] = useState(false); //Estado para controlar a exibição das opções
    const [showChecklist, setShowChecklist] = useState(false); //Para mostrar ou esconder o checklist

    //Navegação
    const navigation = useNavigation();
    
    

    const toggleChecklist = () => {
      setShowChecklist((prev) => !prev); //alterna a visualização do checklist
    };

    //Função para selecionar a opção desejada e validar se o input esta preenchido e executar a navegação
    const handleOptionSelect = (option) => {
        //Validação do campo filial
        if (!filialInput.trim()) {
          Alert.alert('Atenção!', 'Por favor, insira a Filial antes de selecionar uma opção.');
          return;
      }
      setSelectedOption(option); //Atualiza a opção selecionada
      setShowModal(false); //Esconde as opções após selecionar
      
      //Navegação com a filial e a opção diretamente da variável "option"
      navigation.navigate('PatrimonioAssinatura', { filial: filialInput.trim(),  option });
    };

  return (
    <View style={[PreventivaStyles.container,themeStyles.screenBackground]}>
      <Text style={[PreventivaStyles.title, themeStyles.text]}>REGISTRO DE PATRIMÔNIO</Text>
      <Text style={[PreventivaStyles.label, themeStyles.text]}>INICIE AS ANOTAÇÕES:</Text>
      <View style={PreventivaStyles.inputContainer}>
        <TextInput
          value={filialInput}
          onChangeText={setFilialInput}
          placeholder='DIGITE A FILIAL'
          placeholderTextColor={isDarkMode ? '#ccc' : '#333'}
          keyboardType="numeric"
          style={[PreventivaStyles.input, themeStyles.input]}
        />
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Text style={[PreventivaStyles.button, themeStyles.textBackground]}>
            COMEÇAR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botão Visualizar Checklist */}
      <View style={PreventivaStyles.buttonCheckContainer}>
        <TouchableOpacity onPress={toggleChecklist}>
          <Text style={[PreventivaStyles.buttonChecklist, themeStyles.text]}>
            {showChecklist ? 'Esconder Checklist \u25BC' : 'Visualizar Checklist \u25BC'}
          </Text>
        
        </TouchableOpacity>

        {/* Renderiza o checklist se showChecklist for true */}
        {showChecklist && <Checklist />}
      </View>

      {/* Modal para seleção da opção */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
        style
      >
        <View style={PreventivaStyles.modalContainer}>
          <View style={[PreventivaStyles.modalContent, themeStyles.contentModal]}>
              <Text style={[PreventivaStyles.modalTitle, themeStyles.titleModal]}>Escolha uma opção:</Text>
              {['PREVENTIVA', 'MONTAGEM', 'INCLUSÃO', 'REFORMA', 'TROCA'].map((option, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleOptionSelect(option)} 
                  style={[PreventivaStyles.optionButton, themeStyles.borderBottomColor]}
                >
                  <Text style={[PreventivaStyles.optionText, themeStyles.textModal]}>
                      {option}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                 style={[PreventivaStyles.closeButton, themeStyles.buttonModal]}
                onPress={() => setShowModal(false)}
              >
                <Text style={themeStyles.text}>Fechar</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>   
    </View>
  );
};

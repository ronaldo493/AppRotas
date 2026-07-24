import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PreventivaStyles from './styles/PreventivaStyles';

import { useAppTheme } from '../../components/ThemeStyles';
import Checklist from './components/Checklist';

export default function Preventiva (){
    //Modo escuro 
    const theme = useAppTheme();
    const isDarkMode = theme.custom.isDarkMode;

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
    <View style={[PreventivaStyles.container,{backgroundColor: theme.colors.background}]}>
      <Text style={[PreventivaStyles.title, {color: theme.colors.onBackground}]}>REGISTRO DE PATRIMÔNIO</Text>
      <Text style={[PreventivaStyles.label, {color: theme.colors.onBackground}]}>INICIE AS ANOTAÇÕES:</Text>
      <View style={PreventivaStyles.inputContainer}>
        <TextInput
          value={filialInput}
          onChangeText={setFilialInput}
          placeholder='DIGITE A FILIAL'
          placeholderTextColor={isDarkMode ? '#ccc' : '#333'}
          keyboardType="numeric"
          style={[
            PreventivaStyles.input, {
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.onSurfaceVariant,
            borderColor: theme.colors.outline,
          }]}
        />
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Text style={[
            PreventivaStyles.button, {
            backgroundColor: theme.colors.primary,
            color: theme.colors.onPrimary,
          },]}>
            COMEÇAR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Botão Visualizar Checklist */}
      <View style={PreventivaStyles.buttonCheckContainer}>
        <TouchableOpacity onPress={toggleChecklist}>
          <Text style={[PreventivaStyles.buttonChecklist,  {
                  color: theme.colors.onBackground,
                }]}>
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
          <View style={[PreventivaStyles.modalContent, {backgroundColor: theme.colors.surface}]}>
              <Text style={[PreventivaStyles.modalTitle, {color: theme.colors.onSurface}]}>Escolha uma opção:</Text>
              {['PREVENTIVA', 'MONTAGEM', 'INCLUSÃO', 'REFORMA', 'TROCA'].map((option, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleOptionSelect(option)} 
                  style={[PreventivaStyles.optionButton, { borderBottomColor: theme.colors.outline }]}
                >
                  <Text style={[PreventivaStyles.optionText,  {color: theme.colors.onSurface}]}>
                      {option}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                 style={[PreventivaStyles.closeButton, {backgroundColor: theme.colors.buttonBackground}]}
                onPress={() => setShowModal(false)}
              >
                <Text style={{color: theme.colors.buttonForeground}}>Fechar</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>   
    </View>
  );
};

import React, { useState } from 'react';
import { Switch, Text, View, Modal, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAppTheme } from '../../components/styles/ThemeStyles';
import { useThemeContext } from '../../src/context/ThemeContext';
import SettingStyles from '../styles/SettingStyles';
import useSugestao from '../../hooks/useSugestao';

export default function Settings({navigation}) {
  //Modo escuro
  const { toggleTheme } = useThemeContext(); 
  const themeStyles = useAppTheme();
  const isDarkMode = themeStyles.custom.isDarkMode;

  const { postSugestao, loading, error, setError } = useSugestao();

  const [ modalVisible, setModalVisible ] = useState(false);
  const [ email, setEmail ] = useState("");
  const [ sugestao, setSugestao] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  const handleEnviar = async () => {
    if(!email || !sugestao) {
          Alert.alert('Atenção!', 'Preencha todos os campos!')
          return;
    } 

    try {
      await postSugestao(email, sugestao);
      setEmail('');
      setSugestao('');
      setModalVisible(false);
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
      }, 1000);  
    } catch (err) {
      console.error("Erro ao enviar sugestão", err);
    }
    
  }

  const handleExit = () => {
      setEmail('');
      setSugestao('');
      setModalVisible(false);  
  }

  const handleOpenModal = () => {
    setError(null);
    setModalVisible(true);
  }


  return (
    <View style={[SettingStyles.container, themeStyles.screenBackground]}>
      <Text style={[SettingStyles.title, themeStyles.text]}>CONFIGURAÇÕES</Text>
      <View style={[SettingStyles.content, themeStyles.radiusBackground]}>
        <View style={[SettingStyles.optionContainer, themeStyles.borderBottomColor]}>
          <Text style={[SettingStyles.label, themeStyles.text]}>Modo Escuro</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
          />
        </View>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('Suporte')} style={[SettingStyles.optionContainer, themeStyles.borderBottomColor]}>
            <Text style={[SettingStyles.label, themeStyles.text]}>Suporte</Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('About')} style={[SettingStyles.optionContainer, themeStyles.borderBottomColor]}>
            <Text style={[SettingStyles.label, themeStyles.text]}>Sobre</Text>
          </TouchableOpacity>
        </View>
        <View>
          <TouchableOpacity onPress={handleOpenModal}  style={[SettingStyles.optionContainer, themeStyles.borderBottomColor]}>
            <Text style={[SettingStyles.label, themeStyles.text]}>Feedback & Sugestão</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={SettingStyles.errorText}>{error}</Text> : null}
      </View>
      {successMessage && (
        <Text style={[SettingStyles.successText, themeStyles.text]}>
          SUGESTÃO ENVIADA COM SUCESSO!
        </Text>
      )}

      {/* Modal de Sugestao */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} >
        <View style={[SettingStyles.modalContainer, themeStyles.sidebar]}>
          <Text style={[SettingStyles.modalTitle, themeStyles.text]}>SUGESTÃO DE MELHORIA</Text>
          {error ? <Text style={SettingStyles.errorText}>{error}</Text> : null}
          <View style={SettingStyles.modalInput}>
            <TextInput
              style={[SettingStyles.modalInputText, themeStyles.input]}
              placeholder='Digite seu E-mail'
              placeholderTextColor={isDarkMode ? '#ccc' : '#333'}
              onChangeText={setEmail}
              keyboardType='email-address'
            />
            <TextInput
              style={[SettingStyles.modalInputText, themeStyles.input, {height: 200}]}
              placeholder='Descreva sua Sugestão...'
              placeholderTextColor={isDarkMode ? '#ccc' : '#333'}
              onChangeText={setSugestao}
              multiline
            />
          </View>
          <View style={SettingStyles.btnContainer}>
            <View style={SettingStyles.btnView}>
              <TouchableOpacity onPress={handleEnviar} style={[SettingStyles.modalButton, themeStyles.buttonModalScreen]}>
                <Text style={[SettingStyles.textButton, themeStyles.text]}>{loading ? "Enviando..." : "ENVIAR"}</Text>
              </TouchableOpacity>
            </View>
            <View style={SettingStyles.btnView}> 
              <TouchableOpacity onPress={handleExit}  style={[SettingStyles.modalButton, themeStyles.buttonModalScreen]}>
                <Text style={[SettingStyles.textButton, themeStyles.text]}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import useAuth from '../../hooks/useAuth';
import LoginStyles from '../styles/LoginStyles';
import { useAppTheme } from '../../components/styles/ThemeStyles';

export default function EditProfile() {
  //Usuário
  const { user } = useAuth();

 //Modo escuro
  const themeStyles = useAppTheme();
  
  useEffect(() => {
    console.log(user)
  },[])
  
  return (
    <View style={[LoginStyles.containerEdit, themeStyles.screenBackground]}>
      <Text style={[LoginStyles.title, themeStyles.text]}>PERFIL DO USUÁRIO</Text>

      <View style={[LoginStyles.infoBox, themeStyles.sidebar]}>
        <Text style={[LoginStyles.label, themeStyles.text]}>Email:</Text>
        <Text style={[LoginStyles.value, themeStyles.text]}>{user?.email || 'Não disponível'}</Text>
      </View>

      <View style={[LoginStyles.infoBox, themeStyles.sidebar]}>
        <Text style={[LoginStyles.label, themeStyles.text]}>Usuário:</Text>
        <Text style={[LoginStyles.value, themeStyles.text]}>{user?.username || 'Não disponível'}</Text>
      </View>

      <View style={[LoginStyles.infoBox, themeStyles.sidebar]}>
        <Text style={[LoginStyles.label, themeStyles.text]}>Setor:</Text>
        <Text style={[LoginStyles.value, themeStyles.text]}>{user?.setor || 'Não disponível'}</Text>
      </View>

      {/* <View style={[LoginStyles.infoBox, themeStyles.sidebar]}>
        <Text style={[LoginStyles.label, themeStyles.text]}>Email de Recuperação:</Text>
        <Text style={[LoginStyles.value, themeStyles.text]}>{user?.emailSec || 'Não disponível'}</Text>
      </View> */}
    </View>
  )
}

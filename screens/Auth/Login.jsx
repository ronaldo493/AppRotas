import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert,ActivityIndicator } from 'react-native';
import LoginStyles from '../styles/LoginStyles';
import useAuth from '../../hooks/useAuth';

export default function Login ()  {
  const { conexaoLogin, loading, error } = useAuth()
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');


  //Deixando padrão o email
  const email = `${username}@drogal.com.br`
  console.log("🚀 ~ Login ~ email:", email)

  const handleLogin = async () => {
    if(!username || !password) {
      Alert.alert('Atenção!', 'Preencha todos os campos!')
      return;
    }
    
      await conexaoLogin(email, password);
      console.log("🚀 ~ handleLogin ~ password:", password)
   
  };

  return (
    <View style={LoginStyles.container}>
      <View style={LoginStyles.headerLogin}>
        <Image
          source={require('../../assets/img/drogal.png')}
          style={LoginStyles.logo}
          resizeMode="contain"
        />

        {error ? <Text style={LoginStyles.errorText}>{error}</Text> : null}
      </View>
      

      <TextInput
            style={LoginStyles.input}
            placeholder="Código Usuário"
            placeholderTextColor="#A9A9A9"
            keyboardType="numeric"
            value={username}
            onChangeText={setUsername}
        />
        <TextInput
            style={LoginStyles.input}
            placeholder="Senha"
            placeholderTextColor="#A9A9A9"
            keyboardType="default"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
        />
        <TouchableOpacity
            style={LoginStyles.button}
            onPress={handleLogin}
            disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={LoginStyles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <View style={LoginStyles.footerLogin}>
          <TouchableOpacity style={LoginStyles.btn}> 
            <Text style={LoginStyles.forgotText}>Se precisar trocar a senha entre em contato com o Administrador </Text>
          </TouchableOpacity>
        </View>
        
    </View>
);

}

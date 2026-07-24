import { useState, useEffect } from 'react'
import { Alert, Linking } from 'react-native';
import Constants from "expo-constants";
import useStrapiClient from '../services/StrapiClient';

const useCheckVersion = () => {
    const conexao = useStrapiClient();

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    //Versão Atual
    const currentVersion = Constants.expoConfig.version;

    const checkVersion = async () => {
        setLoading(true),
        setError(null)

        try {
            const response = await conexao.get('/update-app?populate=appApk');

            console.log(response.data)

            const { versao, appUrl, required, appApk } = response.data.data;
      
            if (versao && versao > currentVersion) {

              //Notificar o usuário sobre a atualização
              Alert.alert(
                "Nova Atualização Disponível",
                `A versão ${versao} está disponível. ${required ? "Esta atualização é obrigatória." : "Deseja atualizar agora?"}`, 
                required === true
                ?  [
                      { 
                          text: "Atualizar", 
                          onPress: () => {
                            Alert.alert(
                                "Escolha o método de atualização",
                                "Como deseja baixar a atualização?",
                                [
                                    { 
                                        text: "Baixar APK", 
                                        onPress: () => {
                                            if (appApk && appApk.url) {
                                                const baseUrl = conexao.defaults.baseURL.replace("/api", "");
                                                const apkUrl = `${baseUrl}${appApk.url}`;
                                                Linking.openURL(apkUrl);
                                            } else {
                                                Alert.alert("Erro", "Não foi possível encontrar o link do APK.");
                                            }
                                        }
                                    },
                                    { 
                                        text: "Baixar com Link", 
                                        onPress: () => {
                                            if (appUrl) {
                                                Linking.openURL(appUrl);
                                            } else {
                                                Alert.alert("Erro", "Não foi possível encontrar o link externo.");
                                            }
                                        }
                                    }
                                ]
                            );
                        }
                      }
                  ]
                  : [ //Se não for obrigatória, mostra as duas opções
                    { text: "Agora Não", style: "cancel" },
                    { 
                        text: "Atualizar", 
                        onPress: () => {
                            Alert.alert(
                                "Escolha o método de atualização",
                                "Como deseja baixar a atualização?",
                                [
                                    { 
                                        text: "Baixar APK", 
                                        onPress: () => {
                                            if (appApk && appApk.url) {
                                                const baseUrl = conexao.defaults.baseURL.replace("/api", "");
                                                const apkUrl = `${baseUrl}${appApk.url}`;
                                                Linking.openURL(apkUrl);
                                            } else {
                                                Alert.alert("Erro", "Não foi possível encontrar o link do APK.");
                                            }
                                        }
                                    },
                                    { 
                                        text: "Abrir Link", 
                                        onPress: () => {
                                            if (appUrl) {
                                                Linking.openURL(appUrl);
                                            } else {
                                                Alert.alert("Erro", "Não foi possível encontrar o link externo.");
                                            }
                                        }
                                    }
                                ]
                            );
                        }
                    }
                ]
              );
            }
          } catch (err) {
            console.log("Erro ao fazer a requisição:", err);
            const errorMessage = err.response?.data?.message || "Erro ao verificar a versão";
            setError(errorMessage);
          } finally {
            setLoading(false);
          }
    }
    
    useEffect(() => {
        checkVersion();      
      }, []);

    return {
        currentVersion,
        error,
        loading
    }
}

export default useCheckVersion
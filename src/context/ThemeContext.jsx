import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

//Cria um contexto para o tema (modo claro/escuro)
const ThemeContext = createContext();

//Provedor - Envolvendo os componentes e fornecendo os dados
export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        //Função assíncrona para carregar o tema armazenado
        const loadTheme = async () => {
            //Tenta obter o tema armazenado no AsyncStorage
            const storedTheme = await AsyncStorage.getItem('theme');
            //Se um tema estiver armazenado, atualiza o estado isDarkMode
            if (storedTheme) {
                setIsDarkMode(storedTheme === 'dark');
            }
        };
        loadTheme(); 
    }, []); //O array vazio significa que isso roda apenas uma vez quando o componente é montado

    //Função para alternar entre os temas claro e escuro
    const toggleTheme = async () => {
        const newTheme = !isDarkMode; //Inverte o estado atual do tema
        setIsDarkMode(newTheme); // tualiza o estado com o novo tema
        //Armazena o novo tema no AsyncStorage
        await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    //Retorna o contexto do tema com o estado atual e a função para alternar
    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

//Hook para usar o contexto de tema em outros componentes
export const useTheme = () => {
    return useContext(ThemeContext); //Retorna o valor do contexto
};

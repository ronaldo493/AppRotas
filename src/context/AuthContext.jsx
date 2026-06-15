import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStrapiContext } from './StrapiContext';

//Criando o contexto
const AuthContext = createContext();

export const publicKey = 'f239af91055557d1c51ca53b69981f2c7ca4ab2364d47b951966aca5d65a812ab8401849599bbedcfa773a1a8ad893608fa115dd015f17c99243629059513e4ca0ea6993490be6d955d5ccaa55d861b6b360dd56805b098244a986009288e2f7554ddb7882467f53ec8afb53e18ecf2352eb37447eb12656ab924789e6ac3cee';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState("");
    const [token, setToken] = useState(publicKey);
    const [loading, setLoading] = useState(true);
    const { setChamados } = useStrapiContext(); 

    //Crregamento do token
    const tokenStorage = async () => {
        try {
          setLoading(true);
          const storedToken = await AsyncStorage.getItem('userToken');
          if (storedToken) {
            setToken(storedToken);
          }
        } catch (err) {
          console.error('Erro ao carregar token:', err);
        } finally {
          setLoading(false);
        }
    };

    //Carregar o user no AsyncStorage
    const userStorage = async () => {
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem('userData');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (err) {
            console.error('Erro ao carregar dados do usuário:', err);
        } finally {
            setLoading(false);
        }  
    };

    //Salvar o token no AsyncStorage
    const saveToken = async (newToken) => {
        try {
            await AsyncStorage.setItem('userToken', newToken);
            setToken(newToken);
        } catch (err) {
            console.error('Erro ao salvar token no AsyncStorage:', err);
        }
    };

    //Salvar o usuário no AsyncStorage
    const saveUser = async (newUser) => {
        try {
            const userString = JSON.stringify(newUser);
            await AsyncStorage.setItem('userData', userString);
            setUser(newUser);
        } catch (err) {
            console.error('Erro ao salvar dados do usuário no AsyncStorage:', err);
        }
    };

    //Limpar o token do AsyncStorage
    const clearToken = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            setToken(publicKey);
            setUser(null);
            setChamados([]);
        } catch (err) {
            console.error('Erro ao remover token do AsyncStorage:', err);
        }
    };

    useEffect(() => {
       tokenStorage(); 
       userStorage();
       
    }, []);

    const isLoggedIn = () => {
        return token && token != publicKey
    }

    const contextValue = {
        user,
        setUser: saveUser,
        token,
        setToken: saveToken,
        clearToken,
        loading,
        setLoading,
        isLoggedIn
    }

    return (
        <AuthContext.Provider value={contextValue}> 
            {loading ? null : children}
        </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
    return useContext(AuthContext);
}
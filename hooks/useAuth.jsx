import { useEffect, useState } from "react";
import { useAuthContext } from "../src/context/AuthContext";
import strapiClient from "../services/StrapiClient";
import jwtDecode from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuthMenus from "./useAuthMenus";

const useAuth = () => {
  const conexao = strapiClient();
  const authStrapi = useAuthContext();

  //Logoff
  const { clearToken } = useAuthContext();

  //Menus
  const { loadUserWithMenus } = useAuthMenus();

  //Mensagem
  const [message, setMessage] = useState(null);

  const { user, setUser } = authStrapi;
  const { token, setToken } = authStrapi;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //Função de LOGIN
  const conexaoLogin = async (codigoUsuario, senha) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await conexao.post("/auth/local", {
        identifier: codigoUsuario,
        password: senha,
      });

      const { jwt, user } = response.data;

      console.log(jwt)

      await setToken(jwt);

      const userWithMenus = await loadUserWithMenus(jwt, user); //BUSCA OS MENUS
      console.log("🚀 ~ conexaoLogin ~ userWithMenus:", userWithMenus)

      await setUser(userWithMenus);

      checkToken(jwt)
      
      await monitorarSessao();
      
    } catch (err) {
        setError("Usuário ou Senha incorretos");
    } finally {
        setLoading(false);
    }
  };

  //Função checagem de EXPIRAÇÃO DE TOKEN
  const checkToken = (tokenReceived) => {
    if (tokenReceived && typeof tokenReceived === 'string' && tokenReceived.includes('.')) {
      try {
        const desctJwt = jwtDecode(tokenReceived); //Destrututurando JWT
        const iat = desctJwt.iat; //Date Criação de JWT
        console.log(desctJwt)
        
        const expirationTime = 259200; //3 dias
        const exp = iat + expirationTime; //Tempo de expiração
        const currentTime = Math.floor(Date.now() / 1000); //Tempo atual em segundos

        //Verifica o token e redireciona se inválido
        if (currentTime >= exp) {
          setMessage("Sua sessão expirou. Você será redirecionado para o login.")
          
          setTimeout(() => {
            clearToken();
          }, 3000);
        } else {
          console.log("Token Válido")
        }
      } catch (err) {
        console.error("Erro ao decodificar o token:", err);
      }
    }
  }

  
  //Função pra Monitorar o ACESSO ao APP
  const monitorarSessao = async () => {
    const storedUser = await AsyncStorage.getItem("userData"); //Buscando o usuário do AsyncStorage
    if (!storedUser) {
      console.warn("Usuário não encontrado. Monitoramento não será feito.");
      return;
    }

    const userData = JSON.parse(storedUser); 


    try {
      //DADOS a ser enviados
      const sendMonitor = {
        user: userData.username,
        setor: userData.setor,
      }

      //Envio no Strapi
      const response = await conexao.post("/sessoes", {
        data: sendMonitor,
      });

      console.log('Sessão monitorada com sucesso:', response.data);
    } catch (err) {
      console.error('Erro ao monitorar sessão:', err.response ? err.response.data : err.message);
    } 
  };

  // useEffect(() => {
  //   monitorarSessao();
  // }, [])
    
  return {
    checkToken,
    message,
    conexaoLogin,
    user,
    token,
    loading,
    error,
  };
};

export default useAuth;

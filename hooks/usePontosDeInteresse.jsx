import { useEffect, useState } from "react";
import { useStrapiContext } from "../src/context/StrapiContext";
import strapiClient from "../services/StrapiClient";
import usePagination from "./usePagination";
import Toast from 'react-native-toast-message';

const usePontos = () => {
    
    const conexao = strapiClient();
    const suporteStrapi = useStrapiContext();

    const { pontos, setPontos } = suporteStrapi;

    const [ error, setError ] = useState(null);
    const [ loading, setLoading ] = useState(false);

    const pageSize = 100;
    const { nextPage, currentPage, setDataMeta, hasMore } = usePagination(1, "paginationPontos");

    //BUSCA DE DADOS
    const getPontos = async () => {
        setLoading(true);
        setError(null);
    
        try {
          const response = await conexao.get('/pontos-interesses', {
            params: {
              pagination: {
                page: currentPage,
                pageSize,
              },
            },
          });

          const { data: responseData, meta } = response.data;

          setDataMeta(meta)
      
          nextPage();

          setPontos((prevPontos) => [...prevPontos, ...responseData])

        } catch (err) {
            //Verifica se o erro é 403 e exibe uma mensagem de permissão
          if (err.response?.status === 403) {
            Toast.show({
              type: 'error',
              text1: 'Acesso Negado',
              text2: 'Você não tem permissão contate o ADM',
              text1Style: { 
                fontSize: 17,
              },
              text2Style: { 
                fontSize: 15,
              },
            });
        } else {
            Toast.show({
              type: 'error',
              text1: 'Erro',
              text2: errorMessage,
              text1Style: { 
                fontSize: 17,
              },
              text2Style: { 
                fontSize: 15,
              },
            });
        }  
        } finally {
          setLoading(false);
        }
      };


    //SALVAR DADOS
    const postPontos = async (novoPonto) => {
        setLoading(true);
        setError(null);

        try {
            const response = await conexao.post("/pontos-interesses", {
                data: novoPonto,
            });

            const savedPonto = response.data.data;
            setPontos((prevPontos) => [...prevPontos, savedPonto])

        } catch(err) {
          const errorMessage = err.response?.data?.message;
          setError(errorMessage);
          
          //Verifica se o erro é 403 e exibe uma mensagem de permissão
          if (err.response?.status === 403) {
              Toast.show({
                type: 'error',
                text1: 'Acesso Negado',
                text2: 'Você não tem permissão contate o ADM',
                text1Style: { 
                  fontSize: 17,
                },
                text2Style: { 
                  fontSize: 15,
                },
              });
          } else {
              Toast.show({
                type: 'error',
                text1: 'Erro',
                text2: errorMessage,
                text1Style: { 
                  fontSize: 17,
                },
                text2Style: { 
                  fontSize: 15,
                },
              });
          }  
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      if(hasMore) {
        getPontos();
      }
    }, [currentPage, hasMore])

    return { 
        pontos,
        error,
        loading,
        postPontos,
    }
}

export default usePontos;
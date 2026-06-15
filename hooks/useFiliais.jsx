import { useEffect, useState } from "react";
import { useStrapiContext } from "../src/context/StrapiContext";
import strapiClient from "../services/StrapiClient";
import Toast from 'react-native-toast-message';

const useFiliais = () => {
  const conexao = strapiClient();
  const suporteStrapi = useStrapiContext();

  const { filiais, setFiliais } = suporteStrapi;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 100;

  //Função para buscar as filiais com paginação
  const getFiliais = async () => {
    setLoading(true);
    setError(null);
    let allFiliais = [];
    let totalPages = 1;
    let currentPage = 1;

    try {
      while (currentPage <= totalPages) {
        const response = await conexao.get('/informacoeslojas', {
          params: {
            pagination: {
              page: currentPage,
              pageSize,
            },
          },
        });

        const { data: responseData, meta } = response.data;

        allFiliais = [...allFiliais, ...responseData];
        totalPages = meta.pagination.pageCount;
        currentPage++;

      };

      setFiliais(allFiliais);
  
    } catch (err) {
       const errorMessage = err.response?.data?.message;
       setError(errorMessage);
      
       //Verifica se o erro é 403 e exibe uma mensagem de permissão
       if (err.response?.status === 403) {
           Toast.show({
            type: 'error',
            text1: 'Acesso Negado',
            text2: 'Informações Filiais - contate o ADM',
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
      getFiliais(); 
      // console.log(filiais.map((filial) => filial.codigofilial))
  }, []);


  return {
    filiais,
    error,
    loading,
  };
};

export default useFiliais;

import { useEffect, useState } from "react";
import { useChamadosContext } from "../context/StrapiContext";
import usePagination from "./usePagination";
import { useAuthContext } from "../context/AuthContext";
import useStrapiClient from "../services/StrapiClient";

const useChamados = () => {
  const conexao = useStrapiClient();
  const suporteStrapi = useChamadosContext();
  const authStrapi = useAuthContext();

  const { chamados, setChamados } = suporteStrapi;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const pageSize = 100;
  const { currentPage, nextPage, setDataMeta, hasMore } = usePagination(1, "paginationChamados")

  //Função para buscar as filiais com paginação
  const getChamados = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const response = await conexao.get('/chamados', {
        params: {
          pagination: {
            page: currentPage,
            pageSize,
          },
          filters: {
            $or: [
              { nomeresponsavel: { $eq: authStrapi.user.username } }, //Igual ao username
              {
                $and: [
                  { descricaosetorresponsavel: { $eq: authStrapi.user.setor } }, //Setor igual
                  {
                    $or: [
                      { nomeresponsavel: { $eq: '' } }, //Campo vazio
                      { nomeresponsavel: { $null: true } }, //Campo nullo
                    ]
                  }
                ]
              }
            ],
          },
        },
      });
  
      const { data: responseData, meta } = response.data;

      console.log(responseData.map((chamado) => chamado.sequencia))
      const filteredResponseData = responseData.filter((item, index, self) =>
        index === self.findIndex((i) => i.sequencia === item.sequencia)
      );
      console.log(filteredResponseData.map((chamado) => chamado.sequencia))

      setDataMeta(meta)
 
      nextPage();

      setChamados((prevChamados) =>  [...prevChamados, ...filteredResponseData]);
  
    } catch (err) {
      setError(err.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {   
    if(hasMore) {
      getChamados();
    }
  }, [currentPage, hasMore]);


  return {
    chamados,
    error,
    loading,
  };
};

export default useChamados;

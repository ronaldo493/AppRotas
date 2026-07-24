import useStrapiClient from "../src/services/StrapiClient";

//Função genérica para buscar dados paginados
export default usePagination = async (endpoint, pageSize = 100) => {
    let allData = [];
    let page = 1;
    let hasMore = true;
  
    const connection = useStrapiClient();  //Usando o cliente Strapi
  
    try {
      //Enquanto houver mais dados para buscar
      while (hasMore) {
        const response = await connection.get(endpoint, {
          params: {
            pagination: {
              page,
              pageSize,
            },
          },
        });
  
        const { data, meta } = response.data;
        allData = [...allData, ...data];
  
        //Verifica se há mais páginas
        hasMore = meta.pagination.page < meta.pagination.pageCount;
        page += 1;
      }
    } catch (error) {
      console.error(`Erro ao buscar dados do endpoint ${endpoint}:`, error);
      throw error;
    }
  
    return allData;
  };



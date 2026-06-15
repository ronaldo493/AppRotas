import React, { createContext, useState, useContext } from 'react';

//Criando o contexto
const StrapiContext = createContext();

//Provedor
export const StrapiProvider = ({ children }) => {
  const [filiais, setFiliais] = useState([]);
  const [pontos, setPontos] = useState([]);
  const [chamados, setChamados] = useState([]);

  const contextValue = {
    filiais,
    setFiliais,
    pontos,
    setPontos,
    chamados,
    setChamados
  }

  return (
    <StrapiContext.Provider value={ contextValue }>
      {children} 
    </StrapiContext.Provider>
  );
};

//Encapsulando 
export const useStrapiContext = () => {
    return useContext(StrapiContext);
}
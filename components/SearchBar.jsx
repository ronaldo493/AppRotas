import debounce from 'lodash.debounce';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Button, Keyboard, Text, TextInput, View } from 'react-native';
import { useTheme } from '../src/context/ThemeContext';
import useFiliais from '../hooks/useFiliais';
import SearchBarStyles from './styles/SearchBarStyles';
import { getThemeStyles } from './styles/ThemeStyles';

export default function SearchBar({ onAddRoute }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilial, setSelectedFilial] = useState(null);

  //Modo escuro
  const { isDarkMode } = useTheme();
  const themeStyles = getThemeStyles(isDarkMode);
  
  //Lista Filiais
  const { filiais, error, loading } = useFiliais();

  //Função para buscar filial na lista local usando o código de filial
  const searchFilial = (text) => {
    setSearchTerm(text);

    if (text.trim() === '') {
      setSelectedFilial(null);
      return;
    }

    const codigoFilial = parseInt(text, 10);
    const filialEncontrada = filiais.find((filial) => filial.codigofilial === codigoFilial);

    if (filialEncontrada) {
      setSelectedFilial(filialEncontrada); //Define a filial encontrada
    } else {
      setSelectedFilial(null);
    }
  };

  //Função debounce para evitar buscas excessivas
  const debouncedSearch = useCallback(
    debounce((text) => {
      searchFilial(text); //Chama a função de busca
    }, 400), //300ms de espera após o último caractere digitado
    [filiais] //Recria a função debounce apenas se a lista de filiais mudar
  );

  //Função para atualizar o texto de busca
  const handleSearch = (text) => {
    setSearchTerm(text);
    debouncedSearch(text);  //Chama a função de debounce
  };

  //Função que lida com a Seleção da Filial
  const handleSelectFilial = () => {
    if (selectedFilial) {
      onAddRoute(selectedFilial);
      setSearchTerm('');
      setSelectedFilial(null);
      Keyboard.dismiss(); //Fecha o teclado
    }
  };

  return (
    <View>
      <View style={SearchBarStyles.searchContainer}>
        <TextInput
          style={[SearchBarStyles.input, themeStyles.input]}
          placeholder="DIGITE O NÚMERO DA FILIAL"
          placeholderTextColor={isDarkMode ? '#ccc' : '#333'}
          value={searchTerm}
          keyboardType="numeric"
          onChangeText={handleSearch}
        />
      </View>

      {/* Exibe o carregamento enquanto os dados estão sendo buscados */}
      {loading && (
        <View >
          <ActivityIndicator size="large" />
        </View>
      )}

      {/* Exibe erro, caso haja */}
      {error && (
        <View >
          <Text style={themeStyles.errorText}>{error}</Text>
        </View>
      )}

      {selectedFilial && (
        <View style={SearchBarStyles.suggestionContainer}>
          <View style={[SearchBarStyles.suggestionItem, themeStyles.listSearch]}>
            <Text style={[themeStyles.text, SearchBarStyles.text]}>Código: {selectedFilial.codigofilial}</Text>
            <Text style={[themeStyles.text, SearchBarStyles.text]}>Nome: {selectedFilial.nomefilial}</Text>
            <Text style={[themeStyles.text, SearchBarStyles.text]}>Endereço: {selectedFilial.endereco}, {selectedFilial.numero}</Text>
            <Text style={[themeStyles.text, SearchBarStyles.text]}>Bairro: {selectedFilial.bairro}</Text>
            <Text style={[themeStyles.text, SearchBarStyles.text]}>Telefone: {selectedFilial.telefone}</Text>
            <Text style={[themeStyles.text, SearchBarStyles.text]}>CNPJ: {selectedFilial.cnpj}</Text>
          </View>
          <View style={SearchBarStyles.buttonContainer}>
            <Button title="Adicionar" onPress={handleSelectFilial}  />
          </View>
        </View>
      )}
    </View>
  );
}

import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import { Alert, Button, Modal, Text, TextInput, View, TouchableOpacity, Platform } from "react-native";
import { useAppTheme } from "../../components/styles/ThemeStyles";
import RNPickerSelect from 'react-native-picker-select';
import PatrimonioAssinaturaStyles from "./styles/PatrimonioAssinaturaStyles";

export default MaquinaItem = ({ item, onUpdate }) => {
  //Modo Escuro
  const themeStyles = useAppTheme();
  const isDarkMode = themeStyles.custom.isDarkMode;

  const { label, options = [], requiresSelection } = item;

    //Estado para permissão, abrir o scanner, armazenar o patrimonio
  const [permission, requestPermission] = useCameraPermissions();  
  const [selectedValue, setSelectedValue] = useState(options[0]?.value); //Estado para o valor selecionado no Picker
  const [isScannerVisible, setScannerVisible] = useState(false); //Estado para abrir o scanner
  const [patrimonio, setPatrimonio] = useState("");   //Estado para armazenar o número do patrimônio escaneado
  const [isCameraActive, setIsCameraActive] = useState(true); //Estado para bloquear a câmera em caso de erro //Câmera ativa por padrão

  //Evitar múltiplas leituras
  const codigoLock = useRef(false)

  //Função para scanear o patrimonio
  const handleScan = async () => {
    if (!permission?.granted) {
    if (permission?.canAskAgain) {
      const result = await requestPermission();
      if (result.granted) {
      } else {
        Alert.alert("Permissão necessária", "Você precisa conceder permissão para usar a câmera.");
      }
    } else {
      Alert.alert(
        "Permissão necessária",
        "A permissão foi desativada permanentemente. Ative-a manualmente nas configurações."
      );
    }
  }
    codigoLock.current = false;
    setScannerVisible(true);
  };

  
  //Função para lidar com alterações na entrada de texto
  const handleInputChange = (text) => {
    const sanitizedText = text.replace(/\D/g, '').slice(0, 6); //Limita a 6 dígitos
    setPatrimonio(sanitizedText); //Atualiza o estado local com o texto limpo
    onUpdate(label, sanitizedText, selectedValue); //Notifica o componente pai com o valor atualizado
  };

  //Função Patrimônio Lido
  const handleScanRead = ({ data }) => {
    if (codigoLock.current) return; //Ignorar se já foi lido

    //Se o código for maior que 6 dígitos, não realiza a leitura
    if (data.length > 6) {
      Alert.alert("Código inválido", "O código de barras deve ter no máximo 6 dígitos.", [
        {
          text: "OK",
          onPress: () => {
            setIsCameraActive(true); //Reativar a câmera após o alerta
            setScannerVisible(true); //Continuar escaneando
          },
        },
      ]);
      setIsCameraActive(false); //Bloquear a câmera até o usuário clicar em "OK"
      return;
    };

    //Se o código já foi lido, exibe um alerta
    if (patrimonio && patrimonio === data) {
      Alert.alert("Código já lido", "Este código de barras já foi escaneado.", [
        {
          text: "OK",
          onPress: () => {
            setIsCameraActive(true); //Reativar a câmera após o alerta
            setScannerVisible(true); //Continuar escaneando
          },
        },
      ]);
      setIsCameraActive(false); //Bloquear a câmera até o usuário clicar em "OK"
      return;
    }

    codigoLock.current = true; //Bloquear para leituras futuras
    setPatrimonio(data); //Atualizar o valor de patrimônio
    setScannerVisible(false); //Desativa a visualização da câmera após o código válido ser lido
    onUpdate(label, data, selectedValue);//Notifica o componente pai com o novo valor do patrimônio
  };

  return (
    <View>
      <View style={PatrimonioAssinaturaStyles.itemRowContainer}>
        <Text style={[PatrimonioAssinaturaStyles.itemLabel, themeStyles.text]}>{label}</Text>
        
        <TextInput
          style={[PatrimonioAssinaturaStyles.PatrimonioInput, themeStyles.inputPatrimonio]}
          value={patrimonio}
          onChangeText={handleInputChange}
          placeholder="PATRIMÔNIO"
          placeholderTextColor={isDarkMode ? '#ccc' : '#666'}
          keyboardType="numeric" 
        />

        <TouchableOpacity
          onPress={handleScan}
          style={[PatrimonioAssinaturaStyles.scanButton, themeStyles.buttonModal]}
        >
          <Text style={[PatrimonioAssinaturaStyles.textButton, themeStyles.text]}>SCAN</Text>
        </TouchableOpacity>
      </View>

      {requiresSelection ? (  
        <View style={{ marginBottom: 20 }}>
          <RNPickerSelect
            onValueChange={(itemValue) => {
              setSelectedValue(itemValue); //Atualiza o estado com o valor selecionado
              onUpdate(label, patrimonio, itemValue); //Chama a função para notificar o componente pai sobre a atualização
            }}
            value={selectedValue} //Define o valor atual selecionado no picker
            items={options.map((option) => ({
              label: option.label, //Define o texto exibido para cada opção
              value: option.value, //Define o valor associado a cada opção
            }))}
            placeholder={{
              label: "Selecione uma opção...",
              value: null,
              color: "#999",
            }}
            style={{
              inputIOS: {
                color: isDarkMode ? "#ccc" : "#000",
                paddingVertical: 12,
                paddingHorizontal: 10,
                borderWidth: 0.2,
                borderColor: isDarkMode ? "#ccc" : "#bbb",
                borderRadius: 5,
                height: 40,
              },
              iconContainer: {
                padding: 8,
                flex: 1,
                alignItems: "center",
                justifyContent: 'center'
              },
            }}
            Icon={() => (
              Platform.OS === "ios" ? (
                <MaterialIcons name="keyboard-arrow-down" size={32} color="gray" />
              ) : null
            )}
          />
        </View>

      ) : null}

      <Modal visible={isScannerVisible}>
        {isCameraActive && (
          <CameraView 
            facing="back" 
            style={PatrimonioAssinaturaStyles.modalScan}
            onBarcodeScanned={handleScanRead}
          >
            <View style={PatrimonioAssinaturaStyles.viewButton}>
              <Button 
                title="Cancelar"
                style={PatrimonioAssinaturaStyles.modalButton} 
                color={isDarkMode ? '#777' : '#BB5059'} 
                onPress={() => setScannerVisible(false)} />
            </View>
          </CameraView>
        )}
      </Modal>
    </View>
  );
};
import { useRoute } from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import React, { useState } from "react";
import { Alert, Button, ScrollView, Text, TouchableOpacity, View, Platform } from "react-native";
import { useAppTheme } from "../../components/styles/ThemeStyles";
import PatrimonioAssinaturaStyles from "./styles/PatrimonioAssinaturaStyles";
import MaquinaSection from "./MaquinaSection";
import Modals from "./Modals";

export default function PatrimonioAssinatura() {
    //Modo Escuro
    const themeStyles = useAppTheme();
    const isDarkMode = themeStyles.custom.isDarkMode;

    const route = useRoute();
    //Pega a filial passada como parâmetro
    const { filial, option } = route.params;

    //Caminho do arquivo JSON
    const filePath = `${FileSystem.documentDirectory}patrimonio.json`;

    //Função para salvar os dados no arquivo JSON
    const saveDataToFile = async (data) => {
        try {
            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error("Erro ao salvar dados:", error);
        }
    };

    //Função para formatar dados para envio via WhatsApp
    const formatData = (data) => {
        let formattedData = `*${data.categoria}*\n\n`;
        formattedData += `*FILIAL*: ${data.filial}\n\n`;
        
        //Iterar pelas seções e formatar os dados
        for (const section in data.secoes) {
            formattedData += `  *${section}:*\n`; //Formatação para o nome da seção
            for (const item in data.secoes[section]) {
                //Formatação para os itens dentro de cada seção
                formattedData += `    ${item} ${data.secoes[section][item]}\n`;
            }
            formattedData += `\n`; //Adiciona um espaço entre as seções
        }
        return formattedData;
    };
      

    //Função para enviar os dados para o WhatsApp
    const sendJsonWhatsApp = async () => {
        try {
            // Verifica se o arquivo JSON existe
            const fileExists = await FileSystem.getInfoAsync(filePath);
            if (!fileExists.exists) {
                // Se o arquivo não existir, exibe uma mensagem de alerta
                Alert.alert("Atenção", "O arquivo JSON não foi encontrado.");
                return;
            }
            // Ler o conteúdo do arquivo JSON
            const jsonString = await FileSystem.readAsStringAsync(filePath);
            const data = JSON.parse(jsonString);
    
            // Formatar os dados conforme a estrutura desejada
            const formattedData = formatData(data);
    
            // Definir a URL de envio
            let url = '';
            if (Platform.OS === 'ios') {
                // Para iOS, o esquema pode precisar de um número de telefone
                url = `whatsapp://send?text=${encodeURIComponent(formattedData)}`;
            } else {
                // Para Android, usa o esquema normal
                url = `whatsapp://send?text=${encodeURIComponent(formattedData)}`;
            }
    
            // Verifica se o WhatsApp pode ser aberto com o esquema
            const supported = await Linking.canOpenURL(url);
    
            if (supported) {
                await Linking.openURL(url);
    
                // Excluir o arquivo JSON após o envio
                await FileSystem.deleteAsync(filePath);
            } else {
                // Mensagem de erro específica para iOS ou Android
                Alert.alert(
                    "Erro",
                    Platform.OS === 'ios'
                        ? "O WhatsApp não está instalado ou o esquema 'whatsapp://' não está sendo reconhecido."
                        : "O WhatsApp não está instalado ou não é suportado neste dispositivo."
                );
            }
        } catch (error) {
            console.error("Erro ao enviar o JSON:", error);
            Alert.alert("Erro", "Ocorreu um erro ao tentar enviar o JSON para o WhatsApp.");
        }
    };

    const [selectedOption, setSelectedOption] = useState(null); //Estado para gerenciar a opção selecionada
    const [selectedItems, setSelectedItems] = useState([]);  //Estado para gerenciar os itens selecionados
    const [modalVisible, setModalVisible] = useState(false); //Estado para controlar a visibilidade do modal
    const [selectedSection, setSelectedSection] = useState(null); //Estado para controlar a seção selecionada
    const [newMachineLetter, setNewMachineLetter] = useState(""); //Estado para a letra da nova máquina

    const [inputData, setInputData] = useState({
        categoria: option || "",
        filial: "",
        secoes: {}
    }); //estado para armazenar os dados preenchidos

    //Função para atualizar os dados e salvar no JSON
    const handleUpdateItem = (itemName, value, sectionTitle, itemOption = null) => {
        const updatedData = { ...inputData, 
            categoria: option,
            filial, //Incluindo a filial
            secoes: {
                ...inputData.secoes, 
                [sectionTitle]: {
                    ...inputData.secoes[sectionTitle], 
                    [itemName]: itemOption ? `${value} (${itemOption})` : value
                }
            } }; //Atualiza os dados com o novo item preenchido
        setInputData(updatedData); //Atualiza o estado global
        saveDataToFile(updatedData); //Salva os dados no arquivo JSON
    };
    
    //Itens 
    const allItems = [
        { label: 'Nobreak:', requiresSelection: false },
        { label: 'Roteador:', requiresSelection: false },
        { label: 'Mikrotik:', requiresSelection: false },
        { label: 'SAT:', requiresSelection: false },
        {
            label: 'Leitor:',
            options: [
                { label: 'QD', value: 'qd' },
                { label: 'VSI', value: 'vsi' }
            ],
            requiresSelection: true,
        },
        {
            label: 'Impressora:',
            options: [
                { label: 'Epson', value: 'epson' },
                { label: 'Daruma', value: 'daruma' }
            ],
            requiresSelection: true,
        },
        {
            label: 'Zebra:',
            options: [
                { label: 'ZD230', value: 'zd230' },
                { label: 'GT800', value: 'gt800' }
            ],
            requiresSelection: true,
        },
        {
            label: 'Scanner:',
            options: [
                { label: 'Lide 300', value: 'lide300' },
                { label: 'Scanjet 200', value: 'scanjet200' }
            ],
            requiresSelection: true,
        },
        {
            label: 'ATA:',
            options: [
                { label: 'Intelbras', value: 'intelbras' },
                { label: 'Leucotron', value: 'leucotron' }
            ],
            requiresSelection: true,
        },
    ];

    //Itens específicos para CAIXA
    const caixaItems = [
        { label: 'Máquina:', requiresSelection: false },
        { label: 'SAT:', requiresSelection: false },
        {
            label: 'Leitor:',
            options: [
                { label: 'QD', value: 'qd' },
                { label: 'VSI', value: 'vsi' }
            ],
            requiresSelection: true,
        },
        {
            label: 'Impressora:',
            options: [
                { label: 'Epson', value: 'epson' },
                { label: 'Daruma', value: 'daruma' }
            ],
            requiresSelection: true,
        },
        { label: 'Monitor:', requiresSelection: false },
    ];

    //Itens específicos para BALCAO
    const balcaoItems = [
        { label: 'Máquina:', requiresSelection: false },
        {
            label: 'Leitor:',
            options: [
                { label: 'QD', value: 'qd' },
                { label: 'VSI', value: 'vsi' }
            ],
            requiresSelection: true,
        },
        { label: 'Monitor:', requiresSelection: false },
    ];

    //Itens específicos para SERVIDOR
    const servidorItems = [
        { label: 'Máquina:', requiresSelection: false },
        { label: 'Nobreak:', requiresSelection: false },
        {
            label: 'ATA:',
            options: [
                { label: 'Intelbras', value: 'intelbras' },
                { label: 'Leucotron', value: 'leucotron' }
            ],
            requiresSelection: true,
        },
        {
            label: 'Leitor:',
            options: [
                { label: 'QD', value: 'qd' },
                { label: 'VSI', value: 'vsi' }
            ],
            requiresSelection: true,
        },
        {
            label: 'Scanner:',
            options: [
                { label: 'Lide 300', value: 'lide300' },
                { label: 'Scanjet 200', value: 'scanjet200' }
            ],
            requiresSelection: true,
        },
        { label: 'Monitor:', requiresSelection: false },
    ];

    const clinicaItems = [
        { label: 'Máquina:', requiresSelection: false },
        {
            label: 'Leitor:',
            options: [
                { label: 'QD', value: 'qd' },
                { label: 'VSI', value: 'vsi' }
            ],
            requiresSelection: true,
        },
        { label: 'Monitor:', requiresSelection: false },
    ];
    const gerenteItems = [
        { label: 'Máquina:', requiresSelection: false },
        { label: 'Monitor:', requiresSelection: false },
    ];
    const rackItems = [
        { label: 'Mikrotik:', requiresSelection: false },
        { label: 'Nobreak:', requiresSelection: false },
    ];

    
    const [sections, setSections] = useState([
        { title: 'Caixa G', items: [...caixaItems] },
        { title: 'Caixa H', items: [...caixaItems] },
        { title: 'Caixa I', items: [...caixaItems] },
        { title: 'Balcao J', items: [...balcaoItems] },
        { title: 'Balcao K', items: [...balcaoItems] },
        { title: 'Balcao L', items: [...balcaoItems] },
        { title: 'Servidor', items: [...servidorItems] },
        { title: 'Clinica', items: [...clinicaItems] },
        { title: 'Gerente', items: [...gerenteItems] },
        { title: 'Rack', items: [...rackItems] },
    ]);


    const renderMaquinaSections = () => {
        return sections
            .filter(section => {
                if (selectedOption === 'BALCAO' && section.title.includes('Balcao')) {
                    return true;
                }
                if (selectedOption === 'CAIXA' && section.title.includes('Caixa')) {
                    return true;
                }
                if (selectedOption === 'SERVIDOR' && section.title.includes('Servidor')) {
                    return true;
                }
                if (selectedOption === 'CLINICA' && section.title.includes('Clinica')) {
                    return true;
                }
                if (selectedOption === 'GERENTE' && section.title.includes('Gerente')) {
                    return true;
                }
                if (selectedOption === 'RACK' && section.title.includes('Rack')) {
                    return true;
                }
                //Renderiza as seções normalmente para outras opções
                return selectedOption !== 'BALCAO' && selectedOption !== 'CAIXA' && selectedOption !== 'SERVIDOR' && 
                selectedOption !== 'CLINICA' && selectedOption !== 'GERENTE' && selectedOption !== 'RACK';
            })
            .map((section, index) => {
                //Determina os itens corretos para a seção
                let sectionItems = [];
                if (section.title.includes('Balcao')) {
                    sectionItems = balcaoItems;
                } else if (section.title.includes('Caixa')) {
                    sectionItems = caixaItems;
                } else if (section.title.includes('Servidor')) {
                    sectionItems = servidorItems;
                } else if (section.title.includes('Clinica')) {
                    sectionItems = clinicaItems;
                } else if (section.title.includes('Gerente')) {
                    sectionItems = gerenteItems;
                } else if (section.title.includes('Rack')) {
                    sectionItems = rackItems;
                }
        
                return (
                    <View key={index}>
                        <MaquinaSection
                            title={section.title}
                            items={sectionItems} //Passa os itens corretos para cada seção
                            selectedItems={selectedItems.filter(item => item.section === section.title)}
                            onAddItem={() => {
                                setSelectedSection(section.title);
                                setModalVisible(true);
                            }}
                            onDelete={() => confirmDeleteSection(section.title)}
                            onUpdateItem={(itemName, value, option) => handleUpdateItem(itemName, value, section.title, option)} //Passa a função para atualizar os dados
                        />
                    </View>
                );
            });
    };
    
    

    //Função para confirmar a exclusão de uma seção
    const confirmDeleteSection = (sectionTitle) => {
        Alert.alert(
            "Confirmar Exclusão",
            `Você tem certeza que deseja excluir a seção ${sectionTitle}?`,
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Excluir",
                    onPress: () => deleteSection(sectionTitle),
                }
            ]
        );
    };
    
    //Função para excluir uma seção
    const deleteSection = (sectionTitle) => {
        setSections(prevSections => prevSections.filter(section => section.title !== sectionTitle));
        setSelectedItems(prevItems => prevItems.filter(item => item.section !== sectionTitle));
    };

    //Função para alternar a opção selecionada
    const toggleOption = (option) => {
        setSelectedOption(prevOption => (prevOption === option ? null : option)); // Alterna a opção selecionada
    };

    //Função para adicionar um item à seção selecionada
    const addItemToSection = (item) => {
        //Encontre a seção atual onde o item será adicionado
        const section = sections.find(sec => sec.title === selectedSection);

        //Verifica se o item já está em `selectedItems` ou em `items` da seção `sections`
        const itemExistsInSelected = selectedItems.some(
            selectedItem => selectedItem.label === item.label && selectedItem.section === selectedSection
        );
        const itemExistsInSectionItems = section.items.some(
            sectionItem => sectionItem.label === item.label
        );

        if (itemExistsInSelected || itemExistsInSectionItems) {
            Alert.alert("Atenção", "Este item já está na seção.");
        } else {
            setSelectedItems(prevItems => [...prevItems, { ...item, section: selectedSection }]);
        }
    };

    //Função para adicionar nova máquina
    const addNewMachine = () => {
        const cleanedLetter = newMachineLetter.trim(); //Limpa espaços em branco
    
        //Verifica se a letra da máquina está preenchida e válida
        if (!cleanedLetter || !/^[A-Za-z]$/.test(cleanedLetter)) {
            Alert.alert("Atenção!", "Por favor, insira uma letra válida para a nova máquina.");
            return;
        }
    
        //Define o prefixo da seção com base na opção selecionada
        const sectionPrefix = ['CAIXA', 'BALCAO', 'SERVIDOR', 'CLINICA', 'GERENTE', 'RACK'].includes(selectedOption)
            ? selectedOption === 'CAIXA' ? 'Caixa' 
            : selectedOption === 'BALCAO' ? 'Balcao'
            : selectedOption === 'SERVIDOR' ? 'Servidor'
            : selectedOption === 'CLINICA' ? 'Clinica'
            : selectedOption === 'GERENTE' ? 'Gerente'
            : 'Rack'
            : '';
        
        
        //Cria a nova seção com a letra e tipo correto
        const newSection = { 
            title: `${sectionPrefix} ${cleanedLetter.toUpperCase()}`, 
            items: selectedOption === 'CAIXA' ? [...caixaItems] 
                : selectedOption === 'BALCAO' ? [...balcaoItems]
                : selectedOption === 'SERVIDOR' ? [...servidorItems]
                : selectedOption === 'CLINICA' ? [...clinicaItems]
                : selectedOption === 'GERENTE' ? [...gerenteItems]
                : [...rackItems]
        };

        //Atualiza o estado das seções
        setSections(prevSections => {
            const updatedSections = [...prevSections, newSection];
            return updatedSections;
        });

        setNewMachineLetter(""); 
        setModalVisible(false);  
    };
    
    

    return (
        <View style={{flex: 1}}>
            <ScrollView style={[PatrimonioAssinaturaStyles.container, themeStyles.screenBackground]} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={[PatrimonioAssinaturaStyles.title, themeStyles.text]}> {option} </Text>
                <Text style={[PatrimonioAssinaturaStyles.filialText, themeStyles.text]}>
                    FILIAL: {filial}
                </Text>

                <View style={PatrimonioAssinaturaStyles.optionContainer}>
                    {['CAIXA', 'BALCAO', 'SERVIDOR', 'GERENTE', 'CLINICA', 'RACK'].map(option => (
                        <View key={option}>
                            <TouchableOpacity
                                style={[PatrimonioAssinaturaStyles.optionButton, 
                                    { 
                                        backgroundColor: isDarkMode ? '#777' : '#aaa', 
                                        //Opacidade reduzida para opções não selecionadas
                                        opacity: selectedOption && selectedOption !== option ? 0.2 : 1, 
                                    }
                                ]}
                                onPress={() => toggleOption(option)}
                            >
                                <Text style={[PatrimonioAssinaturaStyles.optionText, themeStyles.text]}>{option}</Text>
                            </TouchableOpacity>

                            {/* Renderiza a seção correspondente ao item selecionado */}
                            {(selectedOption === option && (option === 'CAIXA' || option === 'BALCAO' || option === 'SERVIDOR' || 
                            option === 'CLINICA' || option === 'GERENTE' || option === 'RACK')) && (
                                <>
                                    {renderMaquinaSections()}
                                    <View style={PatrimonioAssinaturaStyles.buttonAddMachine}>
                                        <Button
                                            title="Adicionar Nova Máquina"
                                            onPress={() => {
                                                setSelectedSection(null);
                                                setModalVisible(true)
                                                }
                                            }
                                            color={isDarkMode ? '#BB5059' : '#BB5059'}
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    ))}
                </View>

		 {/* Botão para enviar JSON para o WhatsApp */}
                <View style={PatrimonioAssinaturaStyles.buttonSend}>
                        <Button 
                        title="ENVIAR"
                        onPress={sendJsonWhatsApp} //Chama a função de envio para WhatsApp
                        color={isDarkMode ? '#BB5059' : '#BB5059'}
                    />
                </View>

                
                {/* Modal de Adicionar Item e Máquina */}
                <Modals
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    modalType={selectedSection ? 'item' : 'machine'} 
                    allItems={allItems}
                    onSelectItem={addItemToSection}
                    onAddMachine={addNewMachine}
                    newMachineLetter={newMachineLetter} //Passando a letra da nova máquina
                    setNewMachineLetter={setNewMachineLetter}
                />
            </ScrollView>

     
        </View>
        
    );
}

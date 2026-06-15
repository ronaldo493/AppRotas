import React from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getThemeStyles } from "../../components/styles/ThemeStyles";
import { useTheme } from "../../src/context/ThemeContext";
import PatrimonioAssinaturaStyles from "../styles/PatrimonioAssinaturaStyles";
import MaquinaItem from "./MaquinaItem";

export default function MaquinaSection({ title, items, selectedItems, onAddItem, onDelete, onUpdateItem }) {
    const { isDarkMode } = useTheme();
    const themeStyles = getThemeStyles(isDarkMode);

    return (
        <View style={[PatrimonioAssinaturaStyles.contentSection, themeStyles.sidebar]}>
            <View style={PatrimonioAssinaturaStyles.sectionHeader}>
                <Text style={[PatrimonioAssinaturaStyles.titleSection, themeStyles.text]}>
                    {title}
                </Text>
                <TouchableOpacity onPress={onDelete}>
                    <Icon name="delete" size={24} color={isDarkMode ? '#B0B3B8' : '#000'} />
                </TouchableOpacity>
            </View>
            <View style={PatrimonioAssinaturaStyles.sectionItem}>
                {items.map((item, index) => (
                    <MaquinaItem key={index} item={item} onUpdate={onUpdateItem} />
                ))}
                {selectedItems.map((item, index) => (
                    <MaquinaItem key={`added-${index}`} item={item} onUpdate={onUpdateItem} />
                ))}
            </View>
            <Button 
                title="Adicionar Item" 
                onPress={onAddItem}
                color={isDarkMode ? '#777' : '#888'} 
            />
        </View>
    );
}

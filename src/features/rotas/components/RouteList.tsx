import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { MaterialIcons } from '@expo/vector-icons';
import {useAppTheme} from '../../../core/theme/appTheme';
import type {Filial} from '../../filiais/models/Filial';
import RouteListStyles from './routeList.styles';

interface RouteListProps {
  routes: Filial[];
  onRemoveRoute: (filial: Filial) => void;
  onReorderRoutes: (routes: Filial[]) => void;
}

export default function RouteList({
  routes,
  onRemoveRoute,
  onReorderRoutes,
}: RouteListProps) {
  const theme = useAppTheme();

  const renderItem = ({ item, drag, isActive}: RenderItemParams<Filial>) => (
    <View
      style={[
        RouteListStyles.routeItem,
        {
          backgroundColor: isActive
            ? theme.colors.primarySoft
            : theme.colors.surface,
          borderColor: isActive
            ? theme.colors.primary
            : theme.colors.outline,
        },
      ]}
    >
      <TouchableOpacity
        onPressIn={drag}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Reordenar filial ${item.codigofilial}`}
      >
        <MaterialIcons
          name="drag-handle"
          size={28}
          color={theme.colors.iconDefault}
        />
      </TouchableOpacity>

      <View style={RouteListStyles.routeContent}>
        <Text
          numberOfLines={2}
          style={[ RouteListStyles.text, { color: theme.colors.onSurface }]}
        >
          {item.nomefilial}
        </Text>

        <Text style={[ RouteListStyles.code, { color: theme.colors.onSurfaceVariant }]}>
          Filial {item.codigofilial}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => onRemoveRoute(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Remover filial ${item.codigofilial}`}
      >
        <MaterialIcons
          name="delete-outline"
          size={24}
          color={theme.colors.error}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <DraggableFlatList<Filial>
      data={routes}
      renderItem={renderItem}
      keyExtractor={item => String(item.codigofilial)}
      onDragEnd={({ data }) => onReorderRoutes(data)}
      style={RouteListStyles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

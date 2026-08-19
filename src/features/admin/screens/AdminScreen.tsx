import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';

import {useAuthContext} from '../../../core/auth/AuthContext';
import {useAppTheme} from '../../../core/theme/appTheme';
import useAdminActiveRoutesMapAvailability from '../hooks/useAdminActiveRoutesMapAvailability';
import styles from '../styles/adminHome.styles';
import AdminActiveRoutesMapScreen from './AdminActiveRoutesMapScreen';
import AdminPasswordManagementScreen from './AdminPasswordManagementScreen';
import AdminRouteMonitoringScreen from './AdminRouteMonitoringScreen';

type ModuloAdmin = 'inicio' | 'monitoramento' | 'mapa' | 'senhas';

interface AdminOptionProps {
  title: string;
  description: string;
  onPress: () => void;
}

function AdminOption({
  title,
  description,
  onPress,
}: AdminOptionProps): React.JSX.Element {
  const theme = useAppTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outline,
        },
      ]}
    >
      <View style={styles.optionText}>
        <Text style={[styles.optionTitle, {color: theme.colors.onSurface}]}>
          {title}
        </Text>
        <Text
          style={[
            styles.optionDescription,
            {color: theme.colors.onSurfaceVariant},
          ]}
        >
          {description}
        </Text>
      </View>
      <Text style={[styles.optionAction, {color: theme.colors.primary}]}>Abrir</Text>
    </TouchableOpacity>
  );
}

/** Entrada simples dos recursos administrativos liberados para o usuário. */
export default function AdminScreen(): React.JSX.Element {
  const theme = useAppTheme();
  const {user} = useAuthContext();
  const [modulo, setModulo] = useState<ModuloAdmin>('inicio');
  const mapaRotas = useAdminActiveRoutesMapAvailability();

  useEffect(() => {
    if (!mapaRotas.loading && !mapaRotas.enabled && modulo === 'mapa') {
      setModulo('inicio');
    }
  }, [mapaRotas.enabled, mapaRotas.loading, modulo]);

  if (modulo === 'monitoramento') {
    return <AdminRouteMonitoringScreen onBack={() => setModulo('inicio')} />;
  }

  if (modulo === 'senhas') {
    return <AdminPasswordManagementScreen onBack={() => setModulo('inicio')} />;
  }

  if (modulo === 'mapa') {
    return <AdminActiveRoutesMapScreen onBack={() => setModulo('inicio')} />;
  }

  const cargo = String(user?.cargo ?? '').trim().toUpperCase();
  const escopo = cargo === 'ADMIN'
    ? 'Acesso a todos os setores'
    : `Acesso ao setor ${String(user?.setor ?? 'não informado').trim()}`;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.onBackground}]}>
          Administração
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
          {escopo}
        </Text>
      </View>

      <View style={styles.options}>
        <AdminOption
          title="Monitoramento de rotas"
          description="Acompanhe execuções, confirmações por GPS e trajetos concluídos."
          onPress={() => setModulo('monitoramento')}
        />
        {mapaRotas.enabled ? (
          <AdminOption
            title="Rotas em andamento"
            description="Veja no mapa os percursos ativos que estão enviando localização."
            onPress={() => setModulo('mapa')}
          />
        ) : null}
        <AdminOption
          title="Trocar senha"
          description="Redefina o acesso de um colaborador dentro da sua permissão."
          onPress={() => setModulo('senhas')}
        />
      </View>
    </View>
  );
}

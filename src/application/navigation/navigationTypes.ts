import type {NavigatorScreenParams} from '@react-navigation/native';
import type {TipoServico} from '../../features/preventiva/models';

export type BottomTabParamList =
  Record<string, undefined>;

export type RootStackParamList = {
  MainDrawer: undefined;
  Patrimonio: {
    filial: string;
    option: TipoServico;
  };
};

export type DrawerParamList = {
  MainTabs:
    | NavigatorScreenParams<BottomTabParamList>
    | undefined;
  EditProfile: undefined;
  Sobre: undefined;
  Inicio: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

import type {NavigatorScreenParams} from '@react-navigation/native';
import type {TipoServico} from '../../features/patrimonio/models/Patrimonio';
import type {MenuRouteName} from './menuRegistry';

export type BottomTabParamList = {[Route in MenuRouteName]: undefined} & {Mais: undefined};

export type RootStackParamList = {
  MainDrawer:
    | NavigatorScreenParams<DrawerParamList>
    | undefined;
  PatrimonioRegistro: {
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
};

export type AuthStackParamList = {
  Login: undefined;
};

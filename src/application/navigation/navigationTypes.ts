import type {NavigatorScreenParams} from '@react-navigation/native';
import type {TipoServico} from '../../features/preventiva/models';
import type {MenuRouteName} from './menuRegistry';

export type BottomTabParamList = {[Route in MenuRouteName]: undefined} & {Mais: undefined};

export type RootStackParamList = {
  MainDrawer:
    | NavigatorScreenParams<DrawerParamList>
    | undefined;
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
};

export type AuthStackParamList = {
  Login: undefined;
};

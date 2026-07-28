AppRotas

Aplicativo mobile desenvolvido com React Native, Expo e TypeScript para criação de rotas entre filiais, abertura em aplicativos de navegação e registro de histórico no Strapi.

O projeto também possui autenticação, tema claro/escuro, navegação por abas e menu lateral, sugestões de usuários e suporte ao armazenamento local de históricos pendentes.

Funcionalidades

Rotas entre filiais

Pesquisa de filiais pelo código.

Inclusão e remoção de filiais da rota.

Reordenação das filiais selecionadas.

Validação para impedir filiais duplicadas.

Abertura da rota no:

Google Maps;

Waze.

Histórico de rotas

Registro das rotas realizadas no Strapi.

Histórico associado ao usuário e ao setor.

Ordenação por data e hora.

Paginação dos registros.

Carregamento incremental.

Armazenamento local quando o envio falhar.

Tentativa de sincronização dos históricos pendentes quando a conexão voltar.

Sugestões e feedbacks

Botão flutuante disponível durante a navegação.

Botão reposicionável por arraste.

Posição persistida com AsyncStorage.

Tipos de feedback:

Sugestão;

Melhoria;

Problema.

Envio das sugestões para o Strapi.

Toast de sucesso ou erro.

Modal adaptado ao teclado do dispositivo.

Aparência

Tema claro e escuro.

Integração com React Native Paper.

Cores personalizadas para:

fundo;

superfícies;

textos;

ícones;

botões;

menu lateral;

barra inferior;

mensagens de sucesso, erro e informação.

Estilo personalizado para mapas nos dois temas.

Navegação

A estrutura principal da navegação é:

Drawer
└── MainTabs
    ├── Home
    ├── Histórico
    ├── Mapa de Lojas
    ├── Pontos
    ├── Preventiva
    ├── Chamados
    └── Mais

O Drawer também possui rotas auxiliares, como:

Editar perfil;

Sobre.

Tecnologias utilizadas

React Native

Expo

TypeScript

React Navigation

React Native Paper

React Native Gesture Handler

React Native Safe Area Context

AsyncStorage

React Native Toast Message

Strapi

Estrutura do projeto

src/
├── components/
│   ├── AppToast.tsx
│   ├── HeaderMenu/
│   ├── MoreMenuModal/
│   ├── RouteList/
│   ├── SearchBar/
│   ├── Sidebar/
│   ├── Sugestion/
│   └── ThemeStyles.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── StrapiContext.tsx
│   └── ThemeContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useFabPosition.ts
│   ├── useHistoryRoutes.ts
│   ├── usePagination.ts
│   └── useSugestao.ts
│
├── navigation/
│   ├── AppNavigation.tsx
│   ├── BottomTabNavigator.tsx
│   └── MainStackNavigator.tsx
│
├── providers/
│   └── AppProviders.tsx
│
├── screens/
│   ├── Home/
│   ├── History/
│   ├── Map/
│   ├── Preventive/
│   ├── Profile/
│   └── About/
│
├── services/
│   ├── api/
│   └── storage/
│       └── pendingRouteHistory.ts
│
└── type/
    ├── FeedBack.ts
    ├── Filial.ts
    ├── Historico.ts
    └── Strapi.ts

A estrutura pode variar conforme a evolução do projeto.

Organização das responsabilidades

screens

Contém as telas da aplicação e coordena as ações do usuário.

Exemplo:

Home
→ seleciona filiais
→ tenta salvar o histórico
→ abre o navegador escolhido

components

Contém componentes reutilizáveis, como:

barra de pesquisa;

lista de rotas;

menu lateral;

cabeçalho;

modal de sugestões;

Toast personalizado.

hooks

Centraliza regras que utilizam recursos do React, como:

estado;

efeitos;

contexto;

comunicação com a API;

paginação.

services

Contém regras independentes do React, como:

cliente HTTP;

acesso ao AsyncStorage;

sincronização de dados pendentes;

integração com mapas.

context

Mantém estados globais da aplicação:

autenticação;

token;

dados do Strapi;

tema claro ou escuro.

Tema

O tema é criado por meio da função:

createAppTheme(isDarkMode)

Ela combina o tema base do React Native Paper com as cores personalizadas do aplicativo.

Exemplo de uso:

import { useAppTheme } from '../../components/ThemeStyles';

const theme = useAppTheme();

<View
  style={{
    backgroundColor: theme.colors.background,
  }}
/>

O PaperProvider é configurado em AppProviders.tsx:

<PaperProvider theme={theme}>
  <AppNavigation />
  <AppToast />
</PaperProvider>

O AppToast fica dentro do provider para respeitar automaticamente o tema atual.

Histórico offline

Quando não for possível enviar o histórico ao Strapi, a aplicação salva a rota no AsyncStorage.

Fluxo:

Usuário traça a rota
        ↓
Tenta enviar ao Strapi
        ↓
Envio falhou?
   ├── Não → histórico salvo
   └── Sim → salva localmente
                  ↓
         abre o navegador normalmente
                  ↓
       tenta sincronizar posteriormente

O serviço responsável pode ficar em:

src/services/storage/pendingRouteHistory.ts

Esse serviço não deve ficar em hooks, pois não utiliza estado ou recursos do React.

Strapi

Sessões

Collection:

sessoes

Campo de localização:

cidadeOrigem (Text / Short text)

O aplicativo identifica a cidade atual no login e envia o valor
junto com `user` e `setor`. O campo deve aceitar valor nulo para
sessões antigas ou quando o usuário não autorizar a localização.

Histórico de visitas

Collection:

historico-visitas

Campos utilizados:

datahora
username
setor
tipoHistorico (Enumeration: loja, restaurante, posto_combustivel)
rotas

Exemplo do campo rotas:

[
  {
    "codigofilial": 1,
    "nomefilial": "Filial Centro",
    "nomecidade": "Piracicaba",
    "ordem": 1
  }
]

Permissões necessárias para usuários autenticados:

create

find

findOne

Pontos de interesse

Collection:

pontos-interesses

Campo de auditoria:

usernameCriador (Text / Short text)

O aplicativo preenche esse campo com o `username` do usuário
autenticado no momento da inclusão do ponto.

Cadastrar um ponto não cria histórico. Quando o usuário seleciona
um marcador e inicia a navegação pelo botão `Traçar rota`, o
aplicativo registra uma entrada em `historico-visitas`:

- `Restaurante` envia `tipoHistorico: restaurante`;
- `Posto de Combustível` envia `tipoHistorico: posto_combustivel`.

Os dados básicos do destino são armazenados no JSON `rotas`,
mantendo o mesmo contrato já utilizado pelo histórico de lojas.
Caso o histórico não possa ser enviado, ele entra na fila de
sincronização offline sem impedir a abertura do Google Maps.

Sugestões

Collection:

sugestoes

Campos utilizados:

user
setor
email
tipo
sugestao

Instalação

Clone o projeto e entre na pasta:

git clone <url-do-repositorio>
cd AppRotas

Instale as dependências:

yarn

Inicie o Expo:

yarn start

Para limpar o cache do Metro:

npx expo start -c

Executar no Android:

yarn android

Executar no iOS:

yarn ios

Os comandos podem variar conforme os scripts definidos no package.json.

Configuração da API

Mantenha a URL do Strapi centralizada em um arquivo de configuração ou variável de ambiente.

Exemplo:

EXPO_PUBLIC_STRAPI_URL=https://seu-servidor.com/api

Uso:

const apiUrl = process.env.EXPO_PUBLIC_STRAPI_URL;

Não salve tokens, senhas ou URLs privadas diretamente no repositório.

Tipos principais

Filial

export interface Filial {
  codigofilial: number;
  nomefilial: string;
  nomecidade: string;
  endereco?: string;
  numero?: string | number;
  bairro?: string;
  telefone?: string;
  cnpj?: string;
  [key: string]: unknown;
}

Histórico

export interface HistoricoRotaItem {
  codigofilial: number;
  nomefilial: string;
  nomecidade: string;
  ordem: number;
}

export interface HistoricoVisita {
  id: number;
  documentId?: string;
  datahora: string;
  username: string;
  setor: string;
  rotas: HistoricoRotaItem[];
  createdAt?: string;
  updatedAt?: string;
}

Boas práticas adotadas

Componentes escritos em TypeScript.

Regras de API isoladas em hooks ou serviços.

Tema centralizado.

Um único Toast global.

Um único componente de sugestão compartilhado entre as abas.

Tipos separados para entidades e respostas do Strapi.

Paginação do histórico.

Persistência local para operações pendentes.

Falhas no histórico não bloqueiam a navegação da rota.

Navegação dinâmica usando o campo rota como nome da tela.

Próximas melhorias

Sincronização automática ao detectar o retorno da internet.

Indicador de históricos pendentes.

Botão manual para sincronizar.

Idempotência para evitar históricos duplicados.

Testes unitários dos serviços.

Testes de integração dos hooks.

Tratamento centralizado de erros da API.

Registro de data da última sincronização.

Limite para registros pendentes armazenados localmente.

Tela administrativa para sugestões.

Controle de status das sugestões.

Observações

O aplicativo deve continuar funcionando mesmo quando o Strapi estiver indisponível. O registro do histórico é importante, mas não deve impedir o usuário de abrir a rota no Google Maps ou no Waze.

Para evitar duplicidades futuras, recomenda-se adicionar uma chave única de idempotência aos históricos enviados.

const DEFAULT_STRAPI_URL_DEVELOPMENT = 'http://192.168.1.73:1337/api';
// const DEFAULT_STRAPI_URL_DEVELOPMENT = 'http://10.215.10.30:1337/api';
const DEFAULT_STRAPI_URL_PRODUCTION = 'https://rotas.drogal.com.br/api';

const removeTrailingSlash = (value: string): string =>
  value.replace(/\/+$/, '');

export const environment = {
  strapiBaseUrl: removeTrailingSlash(
    process.env.EXPO_PUBLIC_STRAPI_URL ??
      (__DEV__
        ? DEFAULT_STRAPI_URL_DEVELOPMENT
        : DEFAULT_STRAPI_URL_PRODUCTION),
  ),
} as const;

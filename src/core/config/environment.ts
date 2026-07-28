const DEFAULT_STRAPI_URL_DEVELOPMENT = 'http://10.215.10.30:1337/api';
const DEFAULT_STRAPI_URL_PRODUCTION = 'http://ec2-18-229-222-186.sa-east-1.compute.amazonaws.com:3021/api';

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

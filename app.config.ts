import type { ConfigContext, ExpoConfig} from 'expo/config';

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
const allowCleartextTraffic = process.env.ALLOW_CLEARTEXT_TRAFFIC === 'true';

export default function defineExpoConfig({config}: ConfigContext): ExpoConfig {
  return {
    ...config,
    name: config.name ?? 'Suporte Drogal',
    slug: config.slug ?? 'AppDrogal',
    ios: {
      ...config.ios,
      ...(googleMapsApiKey
        ? {
            config: {
              ...config.ios?.config,
              googleMapsApiKey,
            },
          }
        : {}),
    },
    android: {
      ...config.android,
      ...(googleMapsApiKey
        ? {
            config: {
              ...config.android?.config,
              googleMaps: {
                apiKey: googleMapsApiKey,
              },
            },
          }
        : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic:
              allowCleartextTraffic,
          },
        },
      ],
    ],
  };
}

import { Platform } from 'react-native';

const config = {
  development: {
    API_BASE_URL: 'http://10.0.2.2:3000', // Android emulator
    API_BASE_URL_IOS: 'http://localhost:3000', // iOS simulator
  },
  production: {
    API_BASE_URL: 'https://tu-api-produccion.com',
  },
};

const isDev = __DEV__;
const isAndroid = Platform.OS === 'android';

export default {
  ...config[isDev ? 'development' : 'production'],
  API_URL: isDev 
    ? (isAndroid ? config.development.API_BASE_URL : config.development.API_BASE_URL_IOS)
    : config.production.API_BASE_URL,
};

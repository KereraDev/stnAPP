import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/apiClient';

class AuthService {
  async login(correo, contraseña) {
    try {
      const response = await apiClient.post('/api/auth/login', {
        correo,
        contraseña,
      });

      if (response.token && response.usuario) {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.usuario));
        return response;
      }
      
      throw new Error('Credenciales inválidas');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await AsyncStorage.multiRemove(['token', 'user']);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('token');
      return !!token;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }

  async getToken() {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  async refreshUserData() {
    try {
      // Si necesitas actualizar los datos del usuario desde el servidor
      const userData = await apiClient.get('/api/auth/me');
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Refresh user data error:', error);
      throw error;
    }
  }
}

export default new AuthService();

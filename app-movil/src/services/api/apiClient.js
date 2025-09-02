import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../utils/config';

class ApiClient {
  constructor() {
    this.baseURL = config.API_URL;
  }

  async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(await this.getAuthHeaders()),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          throw new Error('SESSION_EXPIRED');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Métodos HTTP básicos
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Para FormData (imágenes)
  async postFormData(endpoint, formData) {
    const headers = await this.getAuthHeaders();
    
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        // No incluir Content-Type para FormData
      },
      body: formData,
    });
  }

  // Método específico para subir imágenes
  async uploadImages(informeId, equipoIndex, images) {
    const formData = new FormData();
    
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.name || `image_${index}.jpg`,
      });
    });

    return this.postFormData(
      `/api/informes/${informeId}/equipos/${equipoIndex}/imagenes`, 
      formData
    );
  }
}

export default new ApiClient();

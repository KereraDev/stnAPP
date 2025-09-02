import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePickerComponent from '../../components/forms/ImagePickerComponent';
import apiClient from '../../services/api/apiClient';

export default function CreateInformeScreen({ navigation }) {
  const [formData, setFormData] = useState({
    ubicacion: '',
    descripcion: '',
    observaciones: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.ubicacion.trim()) {
      Alert.alert('Error', 'La ubicación es requerida');
      return;
    }

    setLoading(true);
    try {
      const informeData = {
        ubicacion: formData.ubicacion.trim(),
        descripcion: formData.descripcion.trim(),
        observaciones: formData.observaciones.trim(),
        fechaInicio: new Date().toISOString(),
        equipos: [
          {
            numeroFila: 1,
            numeroEstructura: '001',
            imagenes: [], // Las imágenes se subirán después
          }
        ],
      };

      const response = await apiClient.post('/api/informes', informeData);
      
      if (response.informe && images.length > 0) {
        // Subir imágenes si hay alguna
        try {
          await apiClient.uploadImages(response.informe._id, 0, images);
        } catch (imageError) {
          console.warn('Error uploading images:', imageError);
        }
      }

      Alert.alert(
        'Éxito',
        'Informe creado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating informe:', error);
      Alert.alert('Error', 'No se pudo crear el informe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ubicación *</Text>
            <TextInput
              style={styles.input}
              value={formData.ubicacion}
              onChangeText={(text) => setFormData(prev => ({ ...prev, ubicacion: text }))}
              placeholder="Ingresa la ubicación del lavado"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.descripcion}
              onChangeText={(text) => setFormData(prev => ({ ...prev, descripcion: text }))}
              placeholder="Describe el trabajo realizado"
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.observaciones}
              onChangeText={(text) => setFormData(prev => ({ ...prev, observaciones: text }))}
              placeholder="Observaciones adicionales"
              multiline
              numberOfLines={3}
              editable={!loading}
            />
          </View>

          <ImagePickerComponent
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            title="Imágenes del Equipo"
          />

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creando...' : 'Crear Informe'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#374151',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  submitButton: {
    backgroundColor: '#185dc8',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cancelText: {
    color: '#6b7280',
  },
});

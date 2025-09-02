import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePickerComponent from '../../components/forms/ImagePickerComponent';
import apiClient from '../../services/api/apiClient';

export default function ImageUploadScreen({ route, navigation }) {
  const { informe } = route.params || {};
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(0);

  useEffect(() => {
    if (informe?.equipos?.[selectedEquipo]?.imagenes) {
      // Convertir imágenes base64 existentes al formato esperado
      const existingImages = informe.equipos[selectedEquipo].imagenes.map((base64, index) => ({
        id: `existing_${index}`,
        uri: base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`,
        type: 'image/jpeg',
        name: `existing_image_${index}.jpg`,
        size: 0,
        isExisting: true,
      }));
      setImages(existingImages);
    }
  }, [informe, selectedEquipo]);

  const handleUpload = async () => {
    if (!informe?._id) {
      Alert.alert('Error', 'Informe no válido');
      return;
    }

    const newImages = images.filter(img => !img.isExisting);
    
    if (newImages.length === 0) {
      Alert.alert('Información', 'No hay imágenes nuevas para subir');
      return;
    }

    setLoading(true);
    try {
      // Convertir imágenes a base64 para el endpoint existente
      const base64Images = [];
      
      for (const image of newImages) {
        if (image.uri.startsWith('data:')) {
          base64Images.push(image.uri);
        } else {
          // Para imágenes locales, necesitaremos convertirlas
          // Por ahora, enviar la URI directamente
          base64Images.push(image.uri);
        }
      }

      // Usar el endpoint existente de agregar imágenes
      await apiClient.post(
        `/api/informes/${informe._id}/equipos/${selectedEquipo}/imagenes`, 
        { imagenes: base64Images }
      );

      Alert.alert(
        'Éxito',
        `${newImages.length} imagen(es) subida(s) correctamente`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'No se pudieron subir las imágenes');
    } finally {
      setLoading(false);
    }
  };

  const removeExistingImage = async (imageIndex) => {
    if (!informe?._id) return;

    try {
      await apiClient.delete(
        `/api/informes/${informe._id}/equipos/${selectedEquipo}/imagenes/${imageIndex}`
      );
      
      // Actualizar estado local
      setImages(prev => prev.filter((_, index) => index !== imageIndex));
      
      Alert.alert('Éxito', 'Imagen eliminada correctamente');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('Error', 'No se pudo eliminar la imagen');
    }
  };

  const handleImagesChange = (newImages) => {
    // Mantener imágenes existentes y agregar nuevas
    const existingImages = images.filter(img => img.isExisting);
    const freshImages = newImages.filter(img => !img.isExisting);
    setImages([...existingImages, ...freshImages]);
  };

  if (!informe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Informe no encontrado</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const equipos = informe.equipos || [{ numeroEstructura: '001', numeroFila: 1 }];
  const newImagesCount = images.filter(img => !img.isExisting).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestionar Imágenes</Text>
          <Text style={styles.subtitle}>
            Informe: {informe._id?.slice(-8)}
          </Text>
        </View>

        {equipos.length > 1 && (
          <View style={styles.equipoSelector}>
            <Text style={styles.selectorTitle}>Seleccionar Equipo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {equipos.map((equipo, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.equipoButton,
                    selectedEquipo === index && styles.equipoButtonActive
                  ]}
                  onPress={() => setSelectedEquipo(index)}
                >
                  <Text style={[
                    styles.equipoButtonText,
                    selectedEquipo === index && styles.equipoButtonTextActive
                  ]}>
                    {equipo.numeroEstructura || `Equipo ${index + 1}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.currentEquipo}>
          <Text style={styles.currentEquipoText}>
            Equipo: {equipos[selectedEquipo]?.numeroEstructura || `${selectedEquipo + 1}`}
          </Text>
          <Text style={styles.currentEquipoSubtext}>
            Imágenes actuales: {images.filter(img => img.isExisting).length} | 
            Nuevas: {newImagesCount}
          </Text>
        </View>

        <View style={styles.imageSection}>
          <ImagePickerComponent
            images={images.filter(img => !img.isExisting)}
            onImagesChange={handleImagesChange}
            maxImages={10}
            title="Agregar Nuevas Imágenes"
          />
        </View>

        {images.filter(img => img.isExisting).length > 0 && (
          <View style={styles.existingSection}>
            <Text style={styles.existingTitle}>Imágenes Existentes</Text>
            <Text style={styles.existingSubtitle}>
              Estas imágenes ya están guardadas en el servidor
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.existingContainer}
            >
              {images.filter(img => img.isExisting).map((image, index) => (
                <View key={image.id} style={styles.existingImageWrapper}>
                  <View style={styles.existingImage}>
                    <Icon name="image" size={40} color="#64748b" />
                  </View>
                  <TouchableOpacity
                    style={styles.existingRemoveButton}
                    onPress={() => removeExistingImage(index)}
                  >
                    <Icon name="delete" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.actions}>
          {newImagesCount > 0 && (
            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.disabledButton]}
              onPress={handleUpload}
              disabled={loading}
            >
              <Icon name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.uploadButtonText}>
                {loading ? 'Subiendo...' : `Subir ${newImagesCount} imagen(es)`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              {newImagesCount > 0 ? 'Cancelar' : 'Volver'}
            </Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#185dc8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  equipoSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  equipoButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  equipoButtonActive: {
    backgroundColor: '#185dc8',
    borderColor: '#185dc8',
  },
  equipoButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  equipoButtonTextActive: {
    color: '#fff',
  },
  currentEquipo: {
    backgroundColor: '#e0f2fe',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  currentEquipoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  currentEquipoSubtext: {
    fontSize: 14,
    color: '#0284c7',
    marginTop: 4,
  },
  imageSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  existingSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  existingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  existingSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  existingContainer: {
    marginTop: 8,
  },
  existingImageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  existingImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  existingRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  uploadButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

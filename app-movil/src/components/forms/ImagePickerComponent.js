import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ImagePickerComponent({ 
  images = [], 
  onImagesChange, 
  maxImages = 10,
  title = "Imágenes"
}) {
  const [uploading, setUploading] = useState(false);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permiso de Cámara',
            message: 'Esta aplicación necesita acceso a la cámara para tomar fotos.',
            buttonNeutral: 'Preguntar después',
            buttonNegative: 'Cancelar',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const showImagePicker = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Límite Alcanzado', `Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    const options = [
      { 
        text: 'Cámara', 
        onPress: () => openCamera()
      },
      { 
        text: 'Galería', 
        onPress: () => openGallery()
      },
      { 
        text: 'Cancelar', 
        style: 'cancel' 
      },
    ];

    Alert.alert('Seleccionar Imagen', 'Elige una opción:', options);
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permiso Denegado', 'Necesitas otorgar permisos de cámara para continuar.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchCamera(options, handleImageResponse);
  };

  const openGallery = () => {
    const remainingSlots = maxImages - images.length;
    
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      selectionLimit: remainingSlots,
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    launchImageLibrary(options, handleImageResponse);
  };

  const handleImageResponse = (response) => {
    if (response.didCancel) {
      return;
    }

    if (response.error) {
      Alert.alert('Error', 'Error al seleccionar la imagen: ' + response.error);
      return;
    }

    if (response.errorCode) {
      Alert.alert('Error', 'Código de error: ' + response.errorCode);
      return;
    }

    const assets = response.assets || [];
    if (assets.length === 0) {
      return;
    }

    const newImages = assets.map((asset, index) => ({
      id: Date.now() + index,
      uri: asset.uri,
      type: asset.type || 'image/jpeg',
      name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
      size: asset.fileSize || 0,
      width: asset.width,
      height: asset.height,
    }));

    const totalImages = images.length + newImages.length;
    if (totalImages > maxImages) {
      Alert.alert(
        'Límite Excedido', 
        `Solo puedes agregar ${maxImages - images.length} imágenes más`
      );
      return;
    }

    onImagesChange([...images, ...newImages]);
  };

  const removeImage = (imageId) => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Estás seguro de que quieres eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const updatedImages = images.filter(img => img.id !== imageId);
            onImagesChange(updatedImages);
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title} ({images.length}/{maxImages})
        </Text>
        {images.length < maxImages && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={showImagePicker}
            disabled={uploading}
          >
            <Icon name="add-a-photo" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        )}
      </View>

      {images.length > 0 ? (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.imagesContainer}
          contentContainerStyle={styles.imagesContent}
        >
          {images.map((image) => (
            <View key={image.id} style={styles.imageWrapper}>
              <Image source={{ uri: image.uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(image.id)}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
              <View style={styles.imageInfo}>
                <Text style={styles.imageSize}>
                  {formatFileSize(image.size)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity 
          style={styles.emptyState} 
          onPress={showImagePicker}
          disabled={uploading}
        >
          <Icon name="add-photo-alternate" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>Toca para agregar imágenes</Text>
          <Text style={styles.emptySubtext}>
            Puedes agregar hasta {maxImages} imágenes
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#185dc8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  imagesContainer: {
    marginTop: 8,
  },
  imagesContent: {
    paddingRight: 16,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
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
  imageInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  imageSize: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  emptyState: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyText: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 14,
  },
});

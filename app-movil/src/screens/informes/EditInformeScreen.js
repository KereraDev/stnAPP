import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function EditInformeScreen({ route, navigation }) {
  const { informe } = route.params || {};

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Detalles del Informe</Text>
          <Text style={styles.subtitle}>ID: {informe._id?.slice(-8)}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información General</Text>
            
            <View style={styles.infoRow}>
              <Icon name="location-on" size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Ubicación:</Text>
              <Text style={styles.infoValue}>{informe.ubicacion || 'N/A'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Icon name="event" size={20} color="#64748b" />
              <Text style={styles.infoLabel}>Fecha Inicio:</Text>
              <Text style={styles.infoValue}>
                {informe.fechaInicio 
                  ? new Date(informe.fechaInicio).toLocaleDateString('es-ES')
                  : 'N/A'}
              </Text>
            </View>

            {informe.fechaFin && (
              <View style={styles.infoRow}>
                <Icon name="event-available" size={20} color="#64748b" />
                <Text style={styles.infoLabel}>Fecha Fin:</Text>
                <Text style={styles.infoValue}>
                  {new Date(informe.fechaFin).toLocaleDateString('es-ES')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipos</Text>
            <Text style={styles.infoValue}>
              {informe.equipos?.length || 0} equipos registrados
            </Text>
          </View>

          {informe.descripcion && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Descripción</Text>
              <Text style={styles.description}>{informe.descripcion}</Text>
            </View>
          )}

          {informe.observaciones && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observaciones</Text>
              <Text style={styles.description}>{informe.observaciones}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ImageUpload', { informe })}
          >
            <Icon name="add-a-photo" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Gestionar Imágenes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => {
              // Implementar edición completa en versión futura
              alert('Funcionalidad de edición completa próximamente');
            }}
          >
            <Icon name="edit" size={20} color="#185dc8" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Editar Detalles
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
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#185dc8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#185dc8',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#185dc8',
  },
});

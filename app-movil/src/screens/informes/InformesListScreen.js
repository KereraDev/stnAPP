import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../../services/api/apiClient';

export default function InformesListScreen({ navigation }) {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInformes();
  }, []);

  const loadInformes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await apiClient.get('/api/informes');
      setInformes(response.informes || []);
    } catch (error) {
      console.error('Error loading informes:', error);
      Alert.alert('Error', 'No se pudieron cargar los informes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (fechaFin) => {
    if (!fechaFin) return '#f59e0b'; // En progreso - amarillo
    return '#10b981'; // Completado - verde
  };

  const getStatusText = (fechaFin) => {
    if (!fechaFin) return 'En Progreso';
    return 'Completado';
  };

  const InformeCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EditInforme', { informe: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Icon name="description" size={24} color="#185dc8" />
          <View style={styles.titleText}>
            <Text style={styles.cardId}>
              ID: {item._id?.slice(-8) || 'N/A'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {formatDate(item.fechaInicio)}
            </Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusColor(item.fechaFin) }
        ]}>
          <Text style={styles.statusText}>
            {getStatusText(item.fechaFin)}
          </Text>
        </View>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <Icon name="location-on" size={16} color="#64748b" />
          <Text style={styles.infoText}>
            {item.ubicacion || 'Sin ubicación'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="build" size={16} color="#64748b" />
          <Text style={styles.infoText}>
            {item.equipos?.length || 0} equipos
          </Text>
        </View>

        {item.fechaFin && (
          <View style={styles.infoRow}>
            <Icon name="event-available" size={16} color="#64748b" />
            <Text style={styles.infoText}>
              Finalizado: {formatDate(item.fechaFin)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ImageUpload', { informe: item })}
        >
          <Icon name="add-a-photo" size={16} color="#185dc8" />
          <Text style={styles.actionText}>Imágenes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditInforme', { informe: item })}
        >
          <Icon name="edit" size={16} color="#185dc8" />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="description" size={64} color="#94a3b8" />
      <Text style={styles.emptyTitle}>No hay informes</Text>
      <Text style={styles.emptySubtitle}>
        Crea tu primer informe para comenzar
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate('CreateInforme')}
      >
        <Text style={styles.emptyButtonText}>Crear Informe</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#185dc8" />
          <Text style={styles.loadingText}>Cargando informes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateInforme')}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Nuevo Informe</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={informes}
        renderItem={({ item }) => <InformeCard item={item} />}
        keyExtractor={(item) => item._id || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadInformes(true)}
            tintColor="#185dc8"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  createButton: {
    backgroundColor: '#185dc8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleText: {
    marginLeft: 12,
    flex: 1,
  },
  cardId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 16,
  },
  actionText: {
    fontSize: 14,
    color: '#185dc8',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#185dc8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

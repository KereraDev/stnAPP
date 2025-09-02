import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/api/apiClient';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInformes: 0,
    informesHoy: 0,
    ultimoInforme: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Reutilizar endpoints existentes
      const informesResponse = await apiClient.get('/api/informes');
      const informes = informesResponse.informes || [];
      
      const today = new Date().toISOString().split('T')[0];
      const informesHoy = informes.filter(inf => 
        inf.fechaInicio?.startsWith(today)
      ).length;

      setStats({
        totalInformes: informes.length,
        informesHoy,
        ultimoInforme: informes[0] || null,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert(
        'Error', 
        'No se pudieron cargar las estadísticas'
      );
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color = '#185dc8' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const MenuCard = ({ icon, title, subtitle, onPress, color = '#185dc8' }) => (
    <TouchableOpacity style={styles.menuCard} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={32} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#94a3b8" />
    </TouchableOpacity>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {getGreeting()}{user ? `, ${user.nombre?.split(' ')[0]}` : ''}!
          </Text>
          <Text style={styles.subGreeting}>Dashboard de Informes</Text>
        </View>

        <View style={styles.statsContainer}>
          <StatCard
            icon="description"
            title="Total Informes"
            value={stats.totalInformes}
            color="#185dc8"
          />
          <StatCard
            icon="today"
            title="Informes Hoy"
            value={stats.informesHoy}
            color="#10b981"
          />
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          
          <MenuCard
            icon="add-circle"
            title="Crear Informe"
            subtitle="Registrar nuevo informe de lavado"
            color="#10b981"
            onPress={() => navigation.navigate('Informes', { 
              screen: 'CreateInforme' 
            })}
          />
          
          <MenuCard
            icon="list"
            title="Mis Informes"
            subtitle="Ver y gestionar mis informes"
            color="#185dc8"
            onPress={() => navigation.navigate('Informes', { 
              screen: 'InformesList' 
            })}
          />
          
          <MenuCard
            icon="camera-alt"
            title="Subir Imágenes"
            subtitle="Agregar imágenes a informes existentes"
            color="#f59e0b"
            onPress={() => navigation.navigate('Informes', { 
              screen: 'ImageUpload' 
            })}
          />
        </View>

        {stats.ultimoInforme && (
          <View style={styles.recentContainer}>
            <Text style={styles.sectionTitle}>Último Informe</Text>
            <View style={styles.recentCard}>
              <Icon name="description" size={24} color="#185dc8" />
              <View style={styles.recentContent}>
                <Text style={styles.recentTitle}>
                  ID: {stats.ultimoInforme._id?.slice(-8) || 'N/A'}
                </Text>
                <Text style={styles.recentSubtitle}>
                  {stats.ultimoInforme.fechaInicio ? 
                    new Date(stats.ultimoInforme.fechaInicio).toLocaleDateString('es-ES')
                    : 'Fecha no disponible'}
                </Text>
              </View>
            </View>
          </View>
        )}
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
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  menuContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  recentContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentContent: {
    flex: 1,
    marginLeft: 16,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  recentSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
});

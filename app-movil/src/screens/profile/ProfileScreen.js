import React from 'react';
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
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const ProfileItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.profileItemLeft}>
        <Icon name={icon} size={24} color="#64748b" />
        <View style={styles.profileItemText}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          <Text style={styles.profileItemValue}>{value || 'No disponible'}</Text>
        </View>
      </View>
      {onPress && (
        <Icon name="chevron-right" size={24} color="#94a3b8" />
      )}
    </TouchableOpacity>
  );

  const MenuSection = ({ title, children }) => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const MenuButton = ({ icon, title, subtitle, onPress, color = '#185dc8', dangerous = false }) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: dangerous ? '#ef4444' : color }]}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, dangerous && styles.dangerousText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        )}
      </View>
      <Icon name="chevron-right" size={24} color="#94a3b8" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Icon name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.userName}>
            {user?.nombre || 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.correo || 'correo@ejemplo.com'}
          </Text>
        </View>

        <MenuSection title="Información Personal">
          <ProfileItem
            icon="person"
            label="Nombre"
            value={user?.nombre}
          />
          <ProfileItem
            icon="email"
            label="Correo Electrónico"
            value={user?.correo}
          />
          <ProfileItem
            icon="work"
            label="Rol"
            value={user?.rol}
          />
          {user?.departamento && (
            <ProfileItem
              icon="business"
              label="Departamento"
              value={user.departamento}
            />
          )}
        </MenuSection>

        <MenuSection title="Aplicación">
          <MenuButton
            icon="info"
            title="Acerca de"
            subtitle="Información de la aplicación"
            onPress={() => Alert.alert('STN Saesa Mobile', 'Versión 1.0.0\n\nSistema móvil para gestión de informes de lavado de equipos.')}
            color="#6366f1"
          />
          
          <MenuButton
            icon="help"
            title="Ayuda y Soporte"
            subtitle="Obtén ayuda con la aplicación"
            onPress={() => Alert.alert('Ayuda', 'Para soporte técnico, contacta al administrador del sistema.')}
            color="#f59e0b"
          />
          
          <MenuButton
            icon="privacy-tip"
            title="Privacidad"
            subtitle="Política de privacidad"
            onPress={() => Alert.alert('Privacidad', 'Los datos son procesados de acuerdo a las políticas de la empresa.')}
            color="#10b981"
          />
        </MenuSection>

        <MenuSection title="Cuenta">
          <MenuButton
            icon="logout"
            title="Cerrar Sesión"
            subtitle="Salir de la aplicación"
            onPress={handleLogout}
            dangerous={true}
          />
        </MenuSection>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            STN Saesa Mobile v1.0.0
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 STN Saesa
          </Text>
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
  header: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#185dc8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#64748b',
  },
  menuSection: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#fff',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemText: {
    marginLeft: 16,
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  dangerousText: {
    color: '#ef4444',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});

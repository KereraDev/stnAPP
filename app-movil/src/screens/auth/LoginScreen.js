import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!correo.trim() || !contraseña.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await login(correo.trim(), contraseña);
      // El navegador se actualizará automáticamente
    } catch (error) {
      let errorMessage = 'Error de conexión';
      
      if (error.message === 'SESSION_EXPIRED' || error.message.includes('Credenciales')) {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }
      
      Alert.alert('Error de Login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            {/* <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            /> */}
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <Text style={styles.logoText}>STN</Text>
            </View>
            <Text style={styles.title}>STN Saesa</Text>
            <Text style={styles.subtitle}>Sistema de Lavados</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="usuario@ejemplo.com"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                value={contraseña}
                onChangeText={setContraseña}
                secureTextEntry
                editable={!loading}
                placeholderTextColor="#94a3b8"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  logoPlaceholder: {
    backgroundColor: '#185dc8',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#185dc8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  form: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#374151',
  },
  button: {
    backgroundColor: '#185dc8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#185dc8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

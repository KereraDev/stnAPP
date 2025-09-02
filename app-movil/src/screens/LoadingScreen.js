import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        /> */}
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <Text style={styles.logoText}>STN</Text>
        </View>
        <Text style={styles.title}>STN Saesa</Text>
        <Text style={styles.subtitle}>Cargando...</Text>
        <ActivityIndicator 
          size="large" 
          color="#185dc8" 
          style={styles.loader}
        />
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#185dc8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      if (authenticated) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (correo, contraseña) => {
    try {
      const response = await authService.login(correo, contraseña);
      setUser(response.usuario);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Forzar logout local aunque falle
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.refreshUserData();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Refresh user error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

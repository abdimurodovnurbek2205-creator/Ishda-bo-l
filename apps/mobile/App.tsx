import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    checkSavedAuth();
  }, []);

  const checkSavedAuth = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user_info');
      const savedEmp = await AsyncStorage.getItem('employee_info');

      if (savedUser && savedEmp) {
        setUser(JSON.parse(savedUser));
        setEmployee(JSON.parse(savedEmp));
      }
    } catch (e) {
      console.log('Error reading auth state', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'user_info', 'employee_info', 'active_work_started_at']);
    setUser(null);
    setEmployee(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {user ? (
        <HomeScreen user={user} employee={employee} onLogout={handleLogout} />
      ) : (
        <LoginScreen
          onLoginSuccess={(u, e) => {
            setUser(u);
            setEmployee(e);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

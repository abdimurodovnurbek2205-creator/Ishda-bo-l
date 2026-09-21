import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, registerUser } from '../services/apiService';

interface LoginScreenProps {
  onLoginSuccess: (user: any, employee: any) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState("Bandixon tuman O'simliklar karantini va himoyasi bo'limi");
  const [position, setPosition] = useState('Inspektor');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const showAlert = (title: string, message: string) => {
    setErrorMessage(message);
    if (Platform.OS === 'web') {
      console.log(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    if (!phoneOrEmail || !password) {
      showAlert('Xatolik', 'Telefon raqamingiz hamda parolingizni kiriting');
      return;
    }

    setLoading(true);
    try {
      const targetUrl = `${API_BASE_URL}/auth/login`;
      console.log('Attempting login request to:', targetUrl);

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phoneOrEmail.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Telefon raqam yoki parol noto‘g‘ri');
      }

      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_info', JSON.stringify(data.user));
      if (data.employee) {
        await AsyncStorage.setItem('employee_id', data.employee.id);
        await AsyncStorage.setItem('employee_info', JSON.stringify(data.employee));
      }

      onLoginSuccess(data.user, data.employee);
    } catch (err: any) {
      console.error('Login error:', err);
      let userFriendlyMsg = err.message || 'Server bilan aloqa uzildi';
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        userFriendlyMsg = 'Server bilan aloqa bog‘lanmadi. Port 3000 server faolligini tekshiring.';
      }
      showAlert('Kirish Xatosi', userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    if (!name || !phoneOrEmail || !password) {
      showAlert('Xatolik', 'Ism, Telefon raqam va Parol kiritilishi shart');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({
        name: name.trim(),
        phone: phoneOrEmail.trim(),
        password: password.trim(),
        department: department.trim(),
        position: position.trim(),
      });

      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_info', JSON.stringify(data.user));
      if (data.employee) {
        await AsyncStorage.setItem('employee_id', data.employee.id);
        await AsyncStorage.setItem('employee_info', JSON.stringify(data.employee));
      }

      Alert.alert('Muvaffaqiyatli', 'Ro‘yxatdan o‘tdingiz! Tizimga xush kelibsiz.');
      onLoginSuccess(data.user, data.employee);
    } catch (err: any) {
      console.error('Registration error:', err);
      showAlert('Ro‘yxatdan o‘tish xatosi', err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>BANDIXON MONITORING</Text>
          <Text style={styles.subtitle}>Bandixon tuman O'simliklar karantini va himoyasi bo'limi</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, !isRegisterMode && styles.tabButtonActive]}
            onPress={() => {
              setIsRegisterMode(false);
              setErrorMessage('');
            }}
          >
            <Text style={[styles.tabText, !isRegisterMode && styles.tabTextActive]}>Tizimga Kirish</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isRegisterMode && (
            <>
              <Text style={styles.label}>F.I.SH (Ism Familiya)</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ism Familiya"
              />
            </>
          )}

          <Text style={styles.label}>Telefon Raqamingiz</Text>
          <TextInput
            style={styles.input}
            value={phoneOrEmail}
            onChangeText={(text) => {
              setPhoneOrEmail(text);
              setErrorMessage('');
            }}
            autoCapitalize="none"
            keyboardType="phone-pad"
            placeholder="+998901234567"
          />

          {isRegisterMode && (
            <>
              <Text style={styles.label}>Bo‘lim / Tashkilot</Text>
              <TextInput
                style={styles.input}
                value={department}
                onChangeText={setDepartment}
                placeholder="Bo'lim nomi"
              />

              <Text style={styles.label}>Lavozim</Text>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="Inspektor"
              />
            </>
          )}

          <Text style={styles.label}>Parolingiz</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage('');
            }}
            secureTextEntry
            placeholder="******"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={isRegisterMode ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRegisterMode ? 'Ro‘yxatdan O‘tish' : 'Tizimga Kirish'}
              </Text>
            )}
          </TouchableOpacity>

          {!isRegisterMode && (
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Eslatma:</Text>
              <Text style={styles.hintText}>Ilovadan foydalanish uchun Bo'lim boshlig'i Bo'riyev Shuxrat tomonidan sizga biriktirilgan Telefon raqam va Parol orqali kiring.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    backgroundColor: '#0284c7',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  subtitle: {
    color: '#e0f2fe',
    fontSize: 12,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  hintBox: {
    marginTop: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hintTitle: {
    fontWeight: 'bold',
    fontSize: 11,
    color: '#475569',
  },
  hintText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});

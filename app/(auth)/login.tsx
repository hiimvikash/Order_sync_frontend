import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility
  const router = useRouter();
  const { login } = useAuth();

  // Form validation
  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Both email and password are required.');
      return false;
    }
    return true;
  };

  // Function to handle login
  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        const { token, user } = response.data;

        // Use the login function from context
        await login(user, token);

        // Navigate based on role
        navigateBasedOnRole(user);
      } else {
        Alert.alert('Login failed', 'Invalid credentials.');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // If it's an Axios error, you can access the response
        if (!error.response) {
          Alert.alert('Network Error', 'Please check your internet connection.');
        } else {
          Alert.alert('Login failed', 'Please check your credentials.');
        }
      } else {
        // For any other errors
        Alert.alert('An unexpected error occurred');
        console.error('Login error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate based on user role
  const navigateBasedOnRole = (user: { role: any; }) => {
    switch (user.role) {
      case 'ADMIN':
        router.replace('/(app)/admin/dashboard');
        break;
      case 'SALESPERSON':
        router.replace('/(app)/salesperson/dashboard');
        break;
      case 'DISTRIBUTOR':
        router.replace('/(app)/distributor/dashboard');
        break;
      default:
        Alert.alert('Error', 'Unknown role');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
        <View style={styles.innerContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Needibay</Text>
          </View>
          <Text style={styles.loginHeader}>Login</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.inputField}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                style={[styles.inputField, { flex: 1 }]}
                secureTextEntry={!passwordVisible}
              />
              <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                <Ionicons
                  name={passwordVisible ? 'eye' : 'eye-off'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'Loading...' : 'LOGIN'}</Text>
          </TouchableOpacity>
        </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9B86EC',
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1.5,
  },
  loginHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  inputContainer: {
    width: '85%',
    marginBottom: 20,
  },
  inputField: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingRight: 12,
    marginTop:20
  },
  loginButton: {
    backgroundColor: '#D6F171',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    margin: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default function LoginScreenWrapper() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen />
    </>
  );
}

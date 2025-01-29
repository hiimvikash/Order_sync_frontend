import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the distributor signup schema using zod
export const distributorSignupSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  phoneNumber: z.string()
    .min(10, { message: "Phone number must be at least 10 characters long" })
    .max(15, { message: "Phone number must be at most 15 characters long" })
    .regex(/^\d+$/, { message: "Phone number must only contain digits" }),
  gstNumber: z.string().optional(),
  pan: z.union([
    z.string().length(10, { message: "PAN must be exactly 10 characters long" }),
    z.string().max(0)
  ]).optional(),
  address: z.string().min(1, { message: "Address is required" }),
});
const CreateDistributor = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    gstNumber: '',
    pan: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prevState => ({ ...prevState, [field]: value }));
  };

  // Validate form using zod schema
  const isFormValid = () => {
    try {
      const validatedData = distributorSignupSchema.parse({
        ...formData,
        gstNumber: formData.gstNumber || undefined,
        pan: formData.pan || undefined
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        Alert.alert('Validation Error');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
      return false;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!isFormValid()) {
      return; // Stop submission if validation fails
    }
  
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        gstNumber: formData.gstNumber || undefined,
        pan: formData.pan || undefined
      };
  
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/admin/create-distributor`, 
        dataToSubmit, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
  
      if (response.status === 201) {
        Alert.alert('Success', 'Distributor created successfully!');
        router.replace('/(app)/admin/dashboard');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.inner} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/(app)/admin/dashboard')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Distributor</Text>
        </View>

        <View style={styles.formContainer}>
          {Object.entries(formData).map(([key, value]) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()}
              placeholderTextColor="#A9A9A9"
              value={value}
              onChangeText={(newValue) => handleInputChange(key, newValue)}
              secureTextEntry={key === 'password'}
              keyboardType={key === 'email' ? 'email-address' : key === 'phoneNumber' ? 'phone-pad' : 'default'}
            />
          ))}

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    paddingTop: 50
  },
  inner: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  formContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A9A9A9',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#000000',
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#9B86EC',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateDistributor;
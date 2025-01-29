import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { z } from 'zod'; // Import Zod for schema validation
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Zod validation schema
export const salespersonSignupSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  name: z.string().min(1, { message: "Name is required" }), // Ensure key matches formData
  phoneNumber: z.string().min(10, { message: "Check Phone number again" })
    .max(15, { message: "15 digit ka konsa hota h bhai" }),
  employeeId: z.string().min(1, { message: "Employee ID is required" }),
  pan: z.string(), // Assuming PAN is a 10 character string
  address: z.string(),
});

const CreateSalesman = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    employeeId: '',
    pan: '',
    address: ''
  });

  const [loading, setLoading] = useState(false);

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData(prevState => ({ ...prevState, [field]: value }));
  };

  // Validate form fields using Zod
  const isFormValid = () => {
    try {
      salespersonSignupSchema.parse(formData); // Validate the formData against the schema
      return true; // If validation passes
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors.map(err => err.message).join('\n'); // Collect all error messages
        Alert.alert('Inpur Error :(', message); // Display validation errors
      }
      return false; // If validation fails
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!isFormValid()) {
      return; // Stop if validation fails
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token')

      
      
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/admin/create-salesperson`,{
        ...formData
      },{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Salesperson created successfully!');
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
          <Text style={styles.title}>Create New Salesman</Text>
        </View>

        <View style={styles.formContainer}>
          {Object.entries(formData).map(([key, value]) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
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

export default CreateSalesman;

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, TouchableOpacity, View, Text, StyleSheet } from "react-native";

interface User {
  role: string; // Define other user properties if necessary
}

export const Logout = () => {
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null); // Specify the type of user

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData)); // Parse user data
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
    </View>
      
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#FF3B30', // Simple red color for logout
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    padding:20
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    padding:30,
  },
});

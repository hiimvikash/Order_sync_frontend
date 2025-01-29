import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Distributor = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  gstNumber: string;
  pan: string;
  createdAt: string;
  updatedAt: string;
};

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/admin/get-distributors`;
const DELETE_URL = (id: string) => `${process.env.EXPO_PUBLIC_API_URL}/admin/distributor/${id}`;

const ViewDistributor = () => {
  const router = useRouter();
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);

  useEffect(() => {
    fetchDistributors(); // Fetch distributors on mount
  }, []);

  const fetchDistributors = async () => {
    const token = await AsyncStorage.getItem('token')
    try {
      const response = await axios.get(API_URL,{
        headers:{
            Authorization: `Bearer ${token}`
        }
      }); // Fetching from the API
      setDistributors(response.data);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      Alert.alert('Error', 'Failed to fetch distributors. Please try again.');
    }
  };

  const openModal = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedDistributor(null);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this distributor?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await axios.delete(DELETE_URL(id)); // Deleting the distributor
              Alert.alert('Success', 'Distributor deleted successfully');
              fetchDistributors(); // Refresh the list after deletion
            } catch (error) {
              console.error('Error deleting distributor:', error);
              Alert.alert('Error', 'Failed to delete distributor. Please try again.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderDistributorItem = useCallback(({ item }: { item: Distributor }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openModal(item)}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Address: {item.address}</Text>
        <Text style={styles.detail}>Phone: {item.phoneNumber}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => {/* Add edit functionality */}}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [openModal]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/admin/dashboard')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Distributors</Text>
      </View>

      {/* Distributor List */}
      <FlatList
        data={distributors}
        renderItem={renderDistributorItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {/* Add Distributor Button */}
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Distributor</Text>
      </TouchableOpacity>

      {/* Modal for Distributor Details */}
      {selectedDistributor && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Distributor Details</Text>
              {selectedDistributor && Object.entries(selectedDistributor).map(([key, value]) => (
                <Text key={key} style={styles.modalDetail}>
                  {`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}
                </Text>
              ))}
              {/* Additional details can be shown here */}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 20,
        paddingTop: 50,
      },
      backButton: {
        marginRight: 10,
      },
      title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        flex: 1,
      },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF', // White card
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2, // Shadow effect for Android
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detail: {
    fontSize: 16,
    color: '#333333', // Dark grey text for details
    marginBottom: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50', // Green button
    borderRadius: 5,
    padding: 10,
  },
  deleteButton: {
    backgroundColor: '#F44336', // Red button
    borderRadius: 5,
    padding: 10,
  },
  buttonText: {
    color: '#FFFFFF', // White text for buttons
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#9b86ec', // Blue button
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF', // White text for button
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%', // Modal width
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalDetail: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default ViewDistributor;

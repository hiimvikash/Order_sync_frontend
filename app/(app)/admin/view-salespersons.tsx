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

type Salesperson = {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  employeeId: string;
  pan: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/admin/get-salesperson`;
// const DELETE_URL = (id: string) => `${process.env.EXPO_PUBLIC_API_URL}/admin/salesperson/${id}`;

const ViewSalesperson = () => {
  const router = useRouter();
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);

  useEffect(() => {
    fetchSalespeople();
  }, []);

  const fetchSalespeople = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSalespeople(response.data);
    } catch (error) {
      console.error('Error fetching salespeople:', error);
      Alert.alert('Error', 'Failed to fetch salespeople. Please try again.');
    }
  };

  const openModal = (salesperson: Salesperson) => {
    setSelectedSalesperson(salesperson);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedSalesperson(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this salesperson?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "OK", 
          onPress: async () => {
            try {
              // await axios.delete(DELETE_URL(id));
              Alert.alert('Coming soon', 'This feature is coming soon.....');
              fetchSalespeople();
            } catch (error) {
              console.error('Error deleting salesperson:', error);
              Alert.alert('Error', 'Failed to delete salesperson. Please try again.');
            }
          } 
        },
      ],
      { cancelable: false }
    );
  };

  const renderSalespersonItem = useCallback(({ item }: { item: Salesperson }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openModal(item)}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Phone: {item.phoneNumber}</Text>
        <Text style={styles.detail}>Email: {item.email}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() =>handleDelete(item.id)}>
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/admin/dashboard')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Salespersons</Text>
      </View>

      <FlatList
        data={salespeople}
        renderItem={renderSalespersonItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => router.replace('/(app)/admin/create-salesperson')}>
        <Text style={styles.addButtonText}>Add Salesperson</Text>
      </TouchableOpacity>

      {selectedSalesperson && (
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
              <Text style={styles.modalTitle}>Salesperson Details</Text>
              {selectedSalesperson && Object.entries(selectedSalesperson).map(([key, value]) => (
                <Text key={key} style={styles.modalDetail}>
                  {`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`}
                </Text>
              ))}
              <Text style={styles.modalDetail}>
                Created At: {new Date(selectedSalesperson.createdAt).toLocaleString()}
              </Text>
              <Text style={styles.modalDetail}>
                Updated At: {new Date(selectedSalesperson.updatedAt).toLocaleString()}
              </Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detail: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 10,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 5,
    padding: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#9B86EC',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
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

export default ViewSalesperson;

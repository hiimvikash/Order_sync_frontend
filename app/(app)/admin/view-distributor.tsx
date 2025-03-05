import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-virtualized-view';
import { set } from 'zod';

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
  const [emodalVisible, setEmodalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Distributor>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleEditDistributorSubmit = useCallback(async () => {
    if (!selectedDistributor) return;
  
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      // Get only the updated fields
      const updatedFields = Object.entries(formData).reduce(
        (acc, [key, value]) => {
          if (value !== selectedDistributor[key as keyof Distributor]) {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, any>
      );
  
      if (Object.keys(updatedFields).length === 0) {
        Alert.alert("No Changes", "No changes were made to the distributor.");
        return;
      }
  
      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/distributor/${selectedDistributor.id}`,
        updatedFields,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await fetchDistributors();
      Alert.alert("Success", "Distributor updated successfully");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update distributor. Please try again.");
    } finally {
      setLoading(false);
      setEmodalVisible(false);
    }
  }, [selectedDistributor, formData, fetchDistributors]);
  

  const renderDistributorItem = useCallback(({ item }: { item: Distributor }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openModal(item)}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Address: {item.address}</Text>
        <Text style={styles.detail}>Phone: {item.phoneNumber}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={() => {setSelectedDistributor(item); setEmodalVisible(true); setFormData(item);}}>
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
      <TouchableOpacity style={styles.addButton} onPress={() => router.replace("/(app)/admin/create-distributor")}>
        <Text style={styles.addButtonText}>Add Distributor</Text>
      </TouchableOpacity>

      {/* Modal for Distributor Details */}
      {selectedDistributor && (
        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Distributor Details</Text>
            <ScrollView style={styles.detailsContainer}>
              {selectedDistributor && Object.entries(selectedDistributor)
              .filter(([key]) => key !== "password" && key !== "createdAt" && key !== "updatedAt" && key !== "imageUrl")
              .map(([key, value]) => (
                <View key={key} style={styles.detailRow}>
                  <Text style={styles.detailKey}>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text>
                  <Text style={styles.detailValue}>{String(value)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

)}
{/* // edit modal */}

<Modal
      animationType="slide"
      transparent={true}
      visible={emodalVisible}
      onRequestClose={() => setEmodalVisible(false)}
    >

      <View style={styles.emodalContainer}>
        <View style={styles.emodalContent}>
          {/* Modal Header */}
          <View style={styles.emodalHeader}>
            <Text style={styles.emodalTitle}>Edit Distributor</Text>
            <TouchableOpacity
              onPress={() => setEmodalVisible(false)}
              style={styles.ecloseButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Loading Indicator or Edit Form */}
{loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ):(
            <EditForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEditDistributorSubmit}
            />
            )}
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
};


const EditForm = memo(
  ({
    formData,
    setFormData,
    onSubmit,
  }: {
    formData: Partial<Distributor>;
    setFormData: (data: Partial<Distributor>) => void;
    onSubmit: () => void;
  }) => (

    <View style={styles.editFormContainer}>
      {Object.entries({
        name: { label: "Distributor Name", type: "text", icon: "business-outline" },
        address: { label: "Address", type: "text", icon: "location-outline" },
        phoneNumber: { label: "Phone Number", type: "numeric", icon: "call-outline" },
        gstNumber: { label: "GST Number", type: "text", icon: "receipt-outline" },
        pan: { label: "PAN Number", type: "text", icon: "card-outline" },
      }).map(([key, { label, type, icon }]) => (
        <View key={key} style={styles.inputContainer}>
          {/* <Ionicons name={icon} size={20} color="#666" style={styles.inputIcon} /> */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
              style={styles.formInput}
              placeholder={`Enter ${label.toLowerCase()}`}
              value={String(formData[key as keyof Partial<Distributor>] || "")}
              onChangeText={(text:string) =>
                setFormData({
                  ...formData,
                  [key]: type === "numeric" ? Number(text) : text,
                })
              }
              keyboardType={type === "numeric" ? "numeric" : "default"}
              placeholderTextColor="#999"
            />
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={onSubmit}
        activeOpacity={0.8}
      >
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </View>
  )
);

const styles = StyleSheet.create({

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  detailsContainer: {
    width: "100%",
    maxHeight: 300,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  detailKey: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  detailValue: {
    fontSize: 16,
    color: "#666",
  },











  emodalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end",
  },
  
  emodalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  emodalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  emodalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  ecloseButton: {
    padding: 5,
  },

  editFormContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
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
  // modalContainer: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  // },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%', // Modal width
  },
  // closeButton: {
  //   position: 'absolute',
  //   top: 10,
  //   right: 10,
  // },
  // modalTitle: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   marginBottom: 15,
  // },
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

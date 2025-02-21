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

  const [emodalVisible, setEmodalVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Salesperson>>({});

  const [loading, setLoading] = useState(false);

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

  const handleEditSalespersonSubmit = useCallback(async () => {
    if (!selectedSalesperson) return;
  
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      
      // Get only the updated fields
      const updatedFields = Object.entries(formData).reduce(
        (acc, [key, value]) => {
          if (value !== selectedSalesperson[key as keyof Salesperson]) {
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
        `${process.env.EXPO_PUBLIC_API_URL}/admin/salesperson/${selectedSalesperson.id}`,
        updatedFields,
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      await fetchSalespeople();
      Alert.alert("Success", "Distributor updated successfully");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update distributor. Please try again.");
    } finally {
      setLoading(false);
      setEmodalVisible(false);
    }
  }, [selectedSalesperson, formData, fetchSalespeople]);

  const renderSalespersonItem = useCallback(({ item }: { item: Salesperson }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => openModal(item)}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.detail}>Phone: {item.phoneNumber}</Text>
        <Text style={styles.detail}>Email: {item.email}</Text>
      </TouchableOpacity>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={()=>{setSelectedSalesperson(item); setEmodalVisible(true); setFormData(item)}}>
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
                  <EditSalespersonForm
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleEditSalespersonSubmit}
                  />
                  )}
              </View>
            </View>
          </Modal>
    </SafeAreaView>
  );
};


const EditSalespersonForm = memo(
  ({
    formData,
    setFormData,
    onSubmit,
  }: {
    formData: Partial<Salesperson>;
    setFormData: (data: Partial<Salesperson>) => void;
    onSubmit: () => void;
  }) => (
    <View style={styles.editFormContainer}>
      {Object.entries({
        name: { label: "Salesperson Name", type: "text", icon: "person-outline" },
        address: { label: "Address", type: "text", icon: "location-outline" },
        phoneNumber: { label: "Phone Number", type: "numeric", icon: "call-outline" },
        gstNumber: { label: "GST Number", type: "text", icon: "receipt-outline" },
        pan: { label: "PAN Number", type: "text", icon: "card-outline" },
      }).map(([key, { label, type, icon }]) => (
        <View key={key} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
              style={styles.formInput}
              placeholder={`Enter ${label.toLowerCase()}`}
              value={String(formData[key as keyof Partial<Salesperson>] || "")}
              onChangeText={(text: string) =>
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

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { set } from "zod";


interface Entity {
  id: number;
  name: string;
}

interface DistributorOrderData {
  productId: number;

  distributorId: number;

  startDate : String;
  endDate : String;
}

const INITIAL_FORM_STATE: DistributorOrderData = {
  productId: 0,
  distributorId: 0,
  startDate : "",
  endDate : "",
};

// Searchable Dropdown Component
const SearchableDropdown: React.FC<{
  data: Entity[];
  placeholder: string;
  value: number;
  onSelect: (value: number) => void;
  error?: string;
}> = ({ data, placeholder, value, onSelect, error }) => {

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  

  const filteredData = useMemo(
    () =>
      data.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [data, searchQuery]
  );

  const selectedItem = useMemo(
    () => data.find((item) => item.id === value),
    [data, value]
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            !selectedItem && styles.placeholderText,
          ]}
        >
          {selectedItem ? selectedItem.name : placeholder}
        </Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={24}
          color="#666"
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.id === value && styles.selectedItem,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      item.id === value && styles.selectedItemText,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === value && (
                    <Ionicons name="checkmark" size={20} color="#007bff" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const DistributorOrderCount = memo(() => {
  const [formData, setFormData] =
    useState<DistributorOrderData>(INITIAL_FORM_STATE);
  const [products, setProducts] = useState<Entity[]>([]);
  const [distributors, setDistributors] = useState<Entity[]>([]);

  const [loading, setLoading] = useState(false);
  const [submiting, setSubmiting] = useState(false);

  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

    const [order, setOrder] = useState<Number>(-2);
    const [fetched, setfetched] = useState(false);
    const [finalAmount, setFinalAmount] = useState<Number>(-2);


  // Enhanced API calls
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
        if (!token) {
            console.log("not token");
            Alert.alert("Authentication Error", "User not authenticated.");
            return;
        }

      const [distributorsRes, productRes] = await Promise.all([
        axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/salesperson/get-distributors`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(`${process.env.EXPO_PUBLIC_API_URL}/admin/get-products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const filteredProducts = productRes.data.map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      const filteredDistributor = distributorsRes.data.map((item: any) => ({
        id: item.id,
        name: item.name,
      }));
      setProducts(filteredProducts);
      setDistributors(filteredDistributor);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isFormValid = () => {
    return (
      (formData.startDate?.trim() || "").length > 0 &&
      (formData.endDate?.trim() || "").length > 0 &&
      (formData.distributorId ?? 0) !== 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert("Validation Error", "Please fill in all required fields.");
      return;
    }

    setSubmiting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      console.log(token);
      if (!token) {
        console.log("not token");
        Alert.alert("Authentication Error", "User not authenticated.");
        return;
      }

      let res: any;
      if(formData.productId === 0){
        res = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/admin/distributortotalamount`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      }else{
       res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/distributorOrderCount`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    }
      console.log(res.data);
      setOrder(res.data.finalQuantity);
      if(res.data.finalAmount){
        setFinalAmount(res.data.finalAmount);
      }else{
        setFinalAmount(0);
      }

    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "Failed to add stock.");
    } finally {
      setSubmiting(false);
      setfetched(true);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleInputChange = (field: keyof DistributorOrderData, value: any) => {
    console.log(field, value);
  
    // Update other fields normally
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  useEffect(() => {
    console.log("Updated FormData:", formData);
  }, [formData]);

  useEffect(() => {
    console.log(order, finalAmount)
  },[order, finalAmount]);


  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setStartPickerVisible(false);
    if (selectedDate) {
      setStartDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setEndPickerVisible(false);
    if (selectedDate) {
      setEndDate(selectedDate.toISOString().split('T')[0]);
    }
  };
  useEffect(()=>{
    handleInputChange("startDate", startDate);
    handleInputChange("endDate", endDate);
  }, [startDate, endDate]);



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(app)/admin/inventory-management")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Distributor Order Count</Text>
        </View>

        <Text style={styles.label}>Products *</Text>
        <SearchableDropdown
          data={products}
          placeholder="Select a Products"
          value={formData.productId}
          onSelect={(value) => handleInputChange("productId", value)}
        />
        <Text style={styles.label}>Distributor *</Text>
        <SearchableDropdown
          data={distributors}
          placeholder="Select a Distributor"
          value={formData.distributorId}
          onSelect={(value) => handleInputChange("distributorId", value)}
        />


                <View style={styles.dateContainer}>
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setStartPickerVisible(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    <Text style={styles.dateButtonText}>
                      {startDate || "Start Date"}
                    </Text>
                  </TouchableOpacity>
        
                  <TouchableOpacity 
                    style={styles.dateButton}
                    onPress={() => setEndPickerVisible(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                    <Text style={styles.dateButtonText}>
                      {endDate || "End Date"}
                    </Text>
                  </TouchableOpacity>
                </View>

{startPickerVisible && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}

      {endPickerVisible && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid() && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid()}
        >
          {submiting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Get Quantity Count</Text>
          )}
        </TouchableOpacity>

        {fetched && (
          <View style={styles.containery}>
            <Text style={styles.labely}>Order Dispatched</Text>
            <Text style={styles.stock}>{String(order)}</Text>
            <Text style={styles.labely}>Order Amount</Text>
            <Text style={styles.stock}>{String(finalAmount)}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
});

export default DistributorOrderCount;

const styles = StyleSheet.create({

  
    containery: {
        backgroundColor: "#f8f9fa",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 3,
        marginVertical: 10,
      },
      labely: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 5,
      },
      stock: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2c3e50",
      },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        flex: 0.48,
    },
    dateButtonText: {
        marginLeft: 8,
        color: '#333',
        fontSize: 14,
    },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: "#A7A7A7",
  },
  submitButtonText: {
    color: "#FFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  keyboardAvoidingView: {
    flex: 1,
  },

  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  required: {
    color: "#FF3B30",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    color: "#000",
  },
  container: {
    padding: 10,
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  inner: {
    padding: 20,
    paddingTop: 50,
  },

  scrollContent: {
    paddingBottom: 24,
  },
  welcomeContainer: {
    padding: 16,
    backgroundColor: "#FFF",
    marginBottom: 16,
    marginTop: 50,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subText: {
    fontSize: 16,
    color: "#666",
  },
  category: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginLeft: 8,
  },
  buttonGrid: {
    gap: 12,
  },
  button: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    elevation: 2,
    overflow: "hidden",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },
  dropdownButton: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#666",
  },
  dropdownModal: {
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: "80%",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    padding: 8,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedItem: {
    backgroundColor: "#f0f9ff",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  selectedItemText: {
    color: "#007bff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
});

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

interface Entity {
  id: number;
  name: string;
}

interface DistributorOrderData {
  productId: number;
  productName: String;

  distributorId: number;
  distributorName: String;

  quantity: number;
}

const INITIAL_FORM_STATE: DistributorOrderData = {
  productId: 0,
  productName: "",

  distributorId: 0,
  distributorName: "",

  quantity: 0,
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

const CreateDistributorOrder = memo(() => {
  const [formData, setFormData] =
    useState<DistributorOrderData>(INITIAL_FORM_STATE);
  const [products, setProducts] = useState<Entity[]>([]);
  const [distributors, setDistributors] = useState<Entity[]>([]);

  const [loading, setLoading] = useState(false);
  const [submiting, setSubmiting] = useState(false);

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
      (formData.productName?.trim() || "").length > 0 &&
      (formData.productId ?? 0) !== 0 &&
      (formData.distributorName?.trim() || "").length > 0 &&
      (formData.distributorId ?? 0) !== 0 &&
      (formData.quantity ?? 0) !== 0
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
      const res = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/admin//distributor-order`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert("Success", "Order created successfully!");
      router.replace("/(app)/admin/inventory-management");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", "Failed to add stock.");
    } finally {
      setSubmiting(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleInputChange = (field: keyof DistributorOrderData, value: any) => {
    console.log(field, value);
  
    if (field === "productId") {
      const product = products.find((item) => item.id == value);
      if (product) {
        setFormData((prev) => ({
          ...prev,
          productId: product.id,
          productName: product.name,
        }));
      } else {
        Alert.alert("Error", "Invalid Product");
      }
      return;
    }
  
    if (field === "distributorId") {
      const distributor = distributors.find((item) => item.id == value);
      if (distributor) {
        setFormData((prev) => ({
          ...prev,
          distributorId: distributor.id,
          distributorName: distributor.name,
        }));
      } else {
        Alert.alert("Error", "Invalid Distributor");
      }
      return;
    }
  
    // Update other fields normally
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  useEffect(() => {
    console.log("Updated FormData:", formData);
  }, [formData]);

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
          <Text style={styles.title}>Create Distributor Order</Text>
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            Order Quantity <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={`Enter Inventory Count`}
            value={formData.quantity.toString()}
            onChangeText={(text) => handleInputChange("quantity", text)}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            !isFormValid() && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid()}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Order</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
});

export default CreateDistributorOrder;

const styles = StyleSheet.create({
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

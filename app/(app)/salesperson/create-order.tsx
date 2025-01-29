import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// Types and Interfaces
interface OrderItem {
  productId: string;
  quantity: number;
  variantId?: string;
  productName: string;
  price: number;
  variantName?: string;
}

interface PartialPayment {
  initialAmount: number;
  remainingAmount: number;
  dueDate: string;
}

interface OrderFormData {
  shopkeeperId: number;
  distributorId: number;
  salespersonId: number;
  deliveryDate: string;
  deliverySlot: string;
  paymentTerm: '' | 'COD' | 'CREDIT' | 'PARTIAL';
  orderNote?: string;
  totalAmount: number;
  items: OrderItem[];
  partialPayment?: PartialPayment;
}

interface Product {
  id: string;
  name: string;
  retailerPrice: number;
  variants: {
    id: string;
    variantName: string;
    variantValue: string;
    price: number;
  }[];
}
interface Category {
  id: string; // Assuming the ID is a string; adjust if it's a number
  name: string;
  products: Product[]; // Array of products related to this category
}


interface Entity {
  id: number;
  name: string;
}

// Constants
const TIME_SLOTS = ['11:00 AM - 2:00 PM', '4:00 PM -9:00 PM'];
const INITIAL_FORM_STATE: OrderFormData = {
  shopkeeperId: 0,
  distributorId: 0,
  salespersonId: 0,
  deliveryDate: '',
  deliverySlot: '',
  paymentTerm: '',
  orderNote: '',
  totalAmount: 0,
  items: [],
  partialPayment: {
    initialAmount: 0,
    remainingAmount: 0,
    dueDate: '',
  }, // Initialize partialPayment with default values
};

// Custom Error class for API errors
class APIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

// Searchable Dropdown Component
const SearchableDropdown: React.FC<{
  data: Entity[];
  placeholder: string;
  value: number;
  onSelect: (value: number) => void;
  error?: string;
}> = ({ data, placeholder, value, onSelect, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => 
    data.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [data, searchQuery]
  );

  const selectedItem = useMemo(() => 
    data.find(item => item.id === value),
    [data, value]
  );

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.dropdownButtonText, !selectedItem && styles.placeholderText]}>
          {selectedItem ? selectedItem.name : placeholder}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={24} color="#666" />
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
                  style={[styles.dropdownItem, item.id === value && styles.selectedItem]}
                  onPress={() => {
                    onSelect(item.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.dropdownItemText, item.id === value && styles.selectedItemText]}>
                    {item.name}
                  </Text>
                  {item.id === value && <Ionicons name="checkmark" size={20} color="#007bff" />}
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

// Main Component
const CreateOrder = () => {
  const [showAcknowledgmentModal, setShowAcknowledgmentModal] = useState(false);
  const [formData, setFormData] = useState<OrderFormData>(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [Category, setCategory] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [shopkeepers, setShopkeepers] = useState<Entity[]>([]);
  const [distributors, setDistributors] = useState<Entity[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});
  const [itemModalStep, setItemModalStep] = useState<'category' | 'product' | 'variant' | 'quantity'>('product');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API Functions
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const user = await AsyncStorage.getItem('user');
      
      if (!token || !user) {
        throw new APIError(401, 'Authentication required');
      }

      const parsedUser = JSON.parse(user);
      const baseURL = process.env.EXPO_PUBLIC_API_URL;
      const headers = { Authorization: `Bearer ${token}` };

      const [categoryRes,productsRes, shopkeepersRes, distributorsRes] = await Promise.all([
        axios.get(`${baseURL}/salesperson/get-category`, { headers }),
        axios.get(`${baseURL}/salesperson/get-products`, { headers }),
        axios.get(`${baseURL}/salesperson/${parsedUser.id}/shops`, { headers }),
        axios.get(`${baseURL}/salesperson/get-distributors`, { headers })
      ]);
      setCategory(categoryRes.data);
      setProducts(productsRes.data);
      setShopkeepers(shopkeepersRes.data);
      setDistributors(distributorsRes.data);
      setFormData(prev => ({ ...prev, salespersonId: parsedUser.id }));
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Error Handling
  const handleError = (error: any) => {
    let message = 'An unexpected error occurred';
    
    if (error instanceof APIError) {
      message = error.message;
    } else if (axios.isAxiosError(error)) {
      message = error.response?.data?.message?.[0] || 
                error.response?.data?.message || 
                error.message;
    }

    Alert.alert('Error', message);
  };

  // Form Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof OrderFormData, string>> = {};
  
    // Required field validation
    if (!formData.shopkeeperId) newErrors.shopkeeperId = 'Shopkeeper is required';
    if (!formData.distributorId) newErrors.distributorId = 'Distributor is required';
    if (!formData.deliveryDate) newErrors.deliveryDate = 'Delivery date is required';
    if (!formData.deliverySlot) newErrors.deliverySlot = 'Delivery slot is required';
    if (formData.items.length === 0) newErrors.items = 'At least one item is required';
  
    // Partial payment validation
    if (formData.paymentTerm === 'PARTIAL') {
      if (!formData.partialPayment) {
        newErrors.partialPayment = 'Partial payment details are required';
      } else {
        const { initialAmount, remainingAmount, dueDate } = formData.partialPayment;
        if (initialAmount + remainingAmount !== formData.totalAmount) {
          Alert.alert("Initial and remaining amounts must equal total amount")
          newErrors.partialPayment = 'Initial and remaining amounts must equal total amount';
        }
        if (!dueDate) newErrors.partialPayment = 'Due date is required';
      }
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Form Handlers
  const handleInputChange = useCallback((field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'shopkeeperId' || field === 'distributorId' 
        ? Number(value) 
        : value
    }));
  }, []);

  const handlePartialPaymentChange = useCallback((field: keyof PartialPayment, value: any) => {
    setFormData(prev => ({
      ...prev,
      partialPayment: {
        ...prev.partialPayment!,
        [field]: field === 'dueDate' ? value : Number(value) // Ensure this does not throw an error
      }
    }));
  }, []);

  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('deliveryDate', selectedDate.toISOString().split('T')[0]);
    }
  }, [handleInputChange]);

  // Item Management
  const handleItemAddition = useCallback(() => {
    if (!selectedProduct) return;

    const selectedVariantObj = selectedProduct.variants.find(
      variant => variant.id === selectedVariant
    );

    const price = selectedVariantObj?.price ?? selectedProduct.retailerPrice;

    const newItem: OrderItem = {
      productId: selectedProduct.id,
      quantity,
      variantId: selectedVariant || undefined,
      productName: selectedProduct.name,
      price,
      variantName: selectedVariantObj?.variantName
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      totalAmount: prev.totalAmount + (price * quantity)
    }));

    // Reset modal state
    setModalVisible(false);
    setItemModalStep('product');
    setQuantity(1);
    setSelectedProduct(null);

    setSelectedVariant(null);
  }, [selectedProduct, selectedVariant, quantity]);

  const removeItem = useCallback((index: number) => {
    setFormData(prev => {
      const itemToRemove = prev.items[index];
      const itemTotal = itemToRemove.quantity * itemToRemove.price;
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
        totalAmount: prev.totalAmount - itemTotal
      };
    });
  }, []);

  // Form Submission
  const handleSubmit = async () => {
    if (formData.paymentTerm === '') {
      Alert.alert('Please select Payment term')
      return;
    }
    try {
      // Validate the form and log the validation result
      const isValid = validateForm();
      console.log('Form Validation Result:', isValid);
    
  
      if (!isValid) {
        // If validation fails, show an alert and return early
        Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
        return;
      }
  
      // Check for partial payment validation specifically
      if (formData.paymentTerm === 'PARTIAL') {
        const partialPayment = formData.partialPayment;
  
        // Ensure partialPayment is defined before accessing its properties
        if (partialPayment) {
          const { initialAmount, remainingAmount } = partialPayment;
          if (initialAmount + remainingAmount !== formData.totalAmount) {
            Alert.alert('Validation Error', 'Initial and remaining amounts must equal total amount.');
            return; // Prevent order creation
          }
        } else {
          Alert.alert('Validation Error', 'Partial payment details are required.');
          return; // Prevent order creation
        }
      }
  
      // Display the acknowledgment modal
      setShowAcknowledgmentModal(true);
    } catch (error) {
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }
  const AcknowledgmentModal = () => {
  
    const [isSubmitting, setIsSubmitting] = useState(false);
  
  
    const handleConfirm = async () => {
      if (formData.paymentTerm === '') {
        Alert.alert('Please select Payment term')
        return;
      }
      try {
        setIsSubmitting(true);
        const token = await AsyncStorage.getItem('token');
  
        if (!token) {
          throw new APIError(401, 'Authentication required');
        }
  
        // Prepare submission data
        const submitData = {
          ...formData,
          items: formData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            ...(item.variantId && { variantId: item.variantId })
          }))
        };
  
        // Make the API request
        await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/salesperson/create-order`,
          submitData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
  
        Alert.alert('Success', 'Order created successfully!');
        router.replace('/salesperson/dashboard');
      } catch (error) {
        handleError(error);
      } finally {
        setIsSubmitting(false);
        setShowAcknowledgmentModal(false);
      }
    };
  
    return (
      <Modal visible={showAcknowledgmentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Order Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAcknowledgmentModal(false)}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              {/* Display the order details here */}
              <Text>Shopkeeper: {shopkeepers.find(shop => shop.id === formData.shopkeeperId)?.name}</Text>
              <Text>Distributor: {distributors.find(d => d.id === formData.distributorId)?.name}</Text>
              <Text>Delivery Date: {formData.deliveryDate}</Text>
              <Text>Delivery Slot: {formData.deliverySlot}</Text>
              <Text>Payment Term: {formData.paymentTerm}</Text>
              <Text>Total Amount: Rs.{formData.totalAmount.toFixed(2)}</Text>
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Order Items</Text>
                {formData.items.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      {item.variantName && (
                        <Text style={styles.variantName}>Variant: {item.variantName}</Text>
                      )}
                      <Text style={styles.itemPrice}>
                        Rs.{item.price} × {item.quantity} = Rs.{(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmSubmitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Confirm Order</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowAcknowledgmentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  // Add Partial Payment UI
  const renderPartialPaymentFields = () => {
    if (formData.paymentTerm !== 'PARTIAL') return null;
  
    return (
      <View style={styles.partialPaymentSection}>
        <Text style={styles.sectionTitle}>Partial Payment Details</Text>
        
        <Text style={styles.label}>Advance *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.partialPayment?.initialAmount?.toString() || ''} // Use optional chaining
          onChangeText={(value) => handlePartialPaymentChange('initialAmount', value)}
        />
  
        <Text style={styles.label}>Balance *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={formData.partialPayment?.remainingAmount?.toString() || ''} // Use optional chaining
          onChangeText={(value) => handlePartialPaymentChange('remainingAmount', value)}
        />
  
        <Text style={styles.label}>Due Date *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowDueDatePicker(true)}
        >
          <Text>{formData.partialPayment?.dueDate || 'Select due date'}</Text>
        </TouchableOpacity>
  
        {showDueDatePicker && (
          <DateTimePicker
            value={formData.partialPayment?.dueDate ? new Date(formData.partialPayment.dueDate) : new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDueDatePicker(false);
              if (selectedDate) {
                handlePartialPaymentChange('dueDate', selectedDate.toISOString().split('T')[0]);
              }
            }}
          />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.inner} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/(app)/salesperson/dashboard')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Create New Order</Text>
        </View>

        {/* Form Fields */}
        {/* Shopkeeper Selection */}
        {/* Replace the existing Shopkeeper Selection */}
<Text style={styles.label}>Shopkeeper *</Text>
<SearchableDropdown
  data={shopkeepers}
  placeholder="Select a shopkeeper"
  value={formData.shopkeeperId}
  onSelect={(value) => handleInputChange('shopkeeperId', String(value))}
  error={errors.shopkeeperId}
/>
{errors.shopkeeperId && <Text style={styles.errorText}>{errors.shopkeeperId}</Text>}

        {/* Distributor Selection */}
        <Text style={styles.label}>Distributor *</Text>
        <View style={[styles.pickerContainer]}>
          <Picker
            selectedValue={formData.distributorId}
            onValueChange={(value) => handleInputChange('distributorId', String(value))}
          >
            <Picker.Item label="Select a distributor" value={0} />
            {distributors.map((distributor) => (
              <Picker.Item key={distributor.id} label={distributor.name} value={distributor.id} />
            ))}
          </Picker>
        </View>
       {/* Delivery Date */}
       <Text style={styles.label}>Delivery Date *</Text>
        <TouchableOpacity
          style={[styles.dateInput]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{formData.deliveryDate || 'Select delivery date'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.deliveryDate ? new Date(formData.deliveryDate) : new Date()}
            mode="date"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
        {/* Delivery Slot */}
        <Text style={styles.label}>Delivery Slot *</Text>
        <View style={[styles.pickerContainer]}>
          <Picker
            selectedValue={formData.deliverySlot}
            onValueChange={(value) => handleInputChange('deliverySlot', value)}
          >
            <Picker.Item label="Select delivery slot" value="" />
            {TIME_SLOTS.map((slot) => (
              <Picker.Item key={slot} label={slot} value={slot} />
            ))}
          </Picker>
        </View>
        {/* Order Note */}
        <Text style={styles.label}>Order Note (Optional)</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Add any special instructions or notes"
          value={formData.orderNote}
          onChangeText={(value) => handleInputChange('orderNote', value)}
          multiline
          numberOfLines={3}
        />

        {/* Items Section */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Order Items *</Text>
          {formData.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.productName}</Text>
                {item.variantName && (
                  <Text style={styles.variantName}>Variant: {item.variantName}</Text>
                )}
                <Text style={styles.itemPrice}>
                  Rs.{item.price} × {item.quantity} = Rs.{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeItem(index)}
              >
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          ))}
          {errors.items && <Text style={styles.errorText}>{errors.items}</Text>}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setModalVisible(true);
              setItemModalStep('category');
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Total Amount */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalAmount}>Rs.{formData.totalAmount.toFixed(2)}</Text>
        </View>

        {/* Updated Payment Terms picker to include PARTIAL */}
          <Text style={styles.label}>Payment Terms *</Text>
          <View style={styles.pickerContainer}>
            <Picker
            selectedValue={formData.paymentTerm}
              onValueChange={(value) => handleInputChange('paymentTerm', value)}
            >
            <Picker.Item label="Select payment term" value="" /> 
              <Picker.Item label="Cash on Delivery" value="COD" />
              <Picker.Item label="Credit" value="CREDIT" />
              <Picker.Item label="Partial Payment" value="PARTIAL" />
            </Picker>
          </View>


        {/* Render partial payment fields when PARTIAL is selected */}
        {renderPartialPaymentFields()}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              <Text style={styles.submitButtonText}>Submit Order</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      {/* Product Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
              {itemModalStep === 'category'
                  ? 'Select Category'
                  : itemModalStep === 'product'
                  ? 'Select Product'
                  : itemModalStep === 'variant'
                  ? 'Select Variant'
                  : 'Set Quantity'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setModalVisible(false);
                  setItemModalStep('product');
                  setSelectedCategory(null);
                }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            {itemModalStep === 'category' && (
              <FlatList
                data={Category}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productItem}
                    onPress={() => {
                      setSelectedCategory((item.id));
                      setItemModalStep('product'); // Move to product selection
                    }}
                  >
                    <Text style={styles.productName}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {itemModalStep === 'product' && (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productItem}
                    onPress={() => {
                      setSelectedProduct(item);
                      if (item.variants.length > 0) {
                        setItemModalStep('variant');
                      } else {
                        setItemModalStep('quantity');
                      }
                    }}
                  >
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productPrice}>
                      Rs.{item.retailerPrice.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {itemModalStep === 'variant' && selectedProduct && (
              <FlatList
                data={selectedProduct.variants}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.variantItem}
                    onPress={() => {
                      setSelectedVariant(item.id);
                      setItemModalStep('quantity');
                    }}
                  >
                    <Text style={styles.variantName}>
                      {item.variantName}: {item.variantValue}
                    </Text>
                    <Text style={styles.variantPrice}>
                      Rs.{item.price.toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            {itemModalStep === 'quantity' && (
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Select Quantity:</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                   <Ionicons name="remove" size={24} color="white" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={String(quantity)}
                    onChangeText={(value) => setQuantity(Math.max(1, parseInt(value) || 0))}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => setQuantity(quantity + 1)}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.addItemButton}
                  onPress={handleItemAddition}
                >
                  <Text style={styles.addItemButtonText}>Add to Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
      <AcknowledgmentModal/>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    inner: {
      padding: 20,
      paddingTop: 50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    backButton: {
      padding: 8,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
      marginRight: 40, // Compensate for back button
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: '#333',
    },
    pickerContainer: {
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      marginBottom: 16,
      overflow: 'hidden',
    },
    dateInput: {
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      padding: 12,
      marginBottom: 16,
    },
    textArea: {
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      padding: 12,
      marginBottom: 16,
      height: 80,
      textAlignVertical: 'top',
    },
    errorBorder: {
      borderColor: '#dc3545',
    },
    errorText: {
      color: '#dc3545',
      fontSize: 14,
      marginTop: -12,
      marginBottom: 16,
    },
    itemsSection: {
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    itemCard: {
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    itemDetails: {
      flex: 1,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
    },
    variantName: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    itemPrice: {
      fontSize: 14,
      color: '#444',
      marginTop: 4,
    },
    removeButton: {
      padding: 8,
    },
    addButton: {
      backgroundColor: '#007bff',
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    addButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    totalSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 8,
      padding: 16,
      marginVertical: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: '600',
    },
    totalAmount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#28a745',
    },
    submitButton: {
      backgroundColor: '#28a745',
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      padding:10,
      backgroundColor: 'white',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalCloseButton: {
      padding: 8,
    },
    productItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
    },
    productPrice: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
    },
    variantPrice: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    variantItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    quantityContainer: {
      padding: 24,
    },
    quantityLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    quantityButton: {
      backgroundColor: '#007bff',
      borderRadius: 8,
      padding: 12,
    },
    quantityInput: {
      backgroundColor: 'white',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 16,
      minWidth: 80,
      textAlign: 'center',
      fontSize: 16,
    },
    addItemButton: {
      backgroundColor: '#28a745',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    addItemButtonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    dropdownButton: {
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: '#333',
    },
    placeholderText: {
      color: '#666',
    },
    dropdownModal: {
      backgroundColor: 'white',
      borderRadius: 12,
      maxHeight: '80%',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    selectedItem: {
      backgroundColor: '#f0f9ff',
    },
    dropdownItemText: {
      fontSize: 16,
      color: '#333',
    },
    selectedItemText: {
      color: '#007bff',
      fontWeight: '600',
    },
    partialPaymentSection: {
      marginTop: 16,
      padding: 16,
      backgroundColor: '#f8f9fa',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#dee2e6',
    },
    input: {
      backgroundColor: 'white',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#ddd',
      padding: 12,
      marginBottom: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#666',
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#DC3545',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
  },
  cancelButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
  },
  modalBody: {
    maxHeight: 300,  // Adjust if needed
  },
  modalBodyContent: {
    paddingBottom: 16,
  },
  confirmSubmitButton: {
    margin: 5,
    flex: 1,
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
},
confirmCancelButton: {
  margin: 5,
    flex: 1,
    backgroundColor: '#DC3545',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
},
  });
  
  export default CreateOrder;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles/styles';
import { ScrollView } from 'react-native-virtualized-view'
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { OrderCard } from './distributor-component.tsx/OrderCard';
import { OrderItemsList } from './distributor-component.tsx/OrderItemsList';
import { QuantityForm, QuantityUpdateConfirmationModal } from './distributor-component.tsx/Quantity-form';
import { ConfirmationModal } from './distributor-component.tsx/ConfirmationModal';
import { PartialPaymentForm } from './distributor-component.tsx/PartialPaymentForm';
import { PartialPaymentConfirmationModal } from './distributor-component.tsx/PartialPaymentConfirmationModal';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  productId: number;
  variantId: number;
}

interface Shopkeeper {
  id: number;
  name: string;
  contactNumber: string;
  balance?: number;
}

interface PartialPayment {
  initialAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: string;
}

interface Order {
  id: number;
  deliveryDate: string;
  totalAmount: number;
  status: string;
  // shopkeeper: Shopkeeper & {
  //   balance?: number;
  // };
  shopkeeper: Shopkeeper;
  items: OrderItem[];
  partialPayment?: PartialPayment;
  paymentTerm: string
}

interface PartialPaymentForm {
  initialAmount: string;
  remainingAmount: string;
  dueDate: Date;
  paymentStatus: string;
}
interface QuantityForm {
  items: {
    productName: any;
    productId: number;
    variantId?: number; // Optional for variant, depending on your logic
    quantity: number;
  }[];
}

const ORDER_STATUSES = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DELIVERED: 'Delivered',
  CANCELED: 'Cancelled',
} as const;

const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
} as const;


// Helper Functions
const getStatusColor = (status: string) => {
  const colors = {
    PENDING: '#FFA500',
    CONFIRMED: '#FFA500',
    DELIVERED: '#28A745',
    CANCELED: '#DC3545',
  };
  return colors[status as keyof typeof colors] || '#000000';
};

const getStatusStyle = (status: string) => ({
  borderLeftWidth: 5,
  borderLeftColor: getStatusColor(status),
});

// Main Component
const DistributorOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const router = useRouter();
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // Partial Payment States
  const [showPartialPaymentForm, setShowPartialPaymentForm] = useState(false);
  const [showQtyChange, setShowQtyChange] = useState(false);
  const [qtyConfirmVisible, setQtyConfirmVisible] = useState(false);
  const [partialPaymentConfirmVisible, setPartialPaymentConfirmVisible] = useState(false);
  const [partialPaymentFormData, setPartialPaymentFormData] = useState<PartialPaymentForm | null>(null);
  const [quantityFormData, setQuantityFormData] = useState<QuantityForm | null>(null);

  const handleShowPartialPayment = useCallback(() => {
    if (selectedOrder?.partialPayment) {
      setPartialPaymentFormData({
        initialAmount: selectedOrder.partialPayment.initialAmount.toString(),
        remainingAmount: selectedOrder.partialPayment.remainingAmount.toString(),
        dueDate: new Date(selectedOrder.partialPayment.dueDate),
        paymentStatus: selectedOrder.partialPayment.paymentStatus,
      });
    } else {
      setPartialPaymentFormData({
        initialAmount: '',
        remainingAmount: '',
        dueDate: new Date(),
        paymentStatus: PAYMENT_STATUSES.PENDING,
      });
    }
    setShowPartialPaymentForm(true);
  }, [selectedOrder]);

  // handle update qty change

  const handleUpdateQty = useCallback(() => {
    if (selectedOrder?.items && selectedOrder.items.length > 0) {
      console.log("selected items", selectedOrder.items);
      const updatedItems = selectedOrder.items.map((item) => ({
        productName: item.productName,
        productId: item.productId,        // Make sure productId is included
        variantId: item.variantId,        // Make sure variantId is included
        quantity: item.quantity,
        price: item.price,
      }));

      // Set the state to store the items to update (this can be useful for the form)
      setQuantityFormData({ items: updatedItems });
    } else {
      console.error('No items found in the order.');
    }

    // Show the quantity change form
    setShowQtyChange(true);
  }, [selectedOrder]);



  const handlePartialPaymentSubmit = useCallback((formData: PartialPaymentForm) => {
    setPartialPaymentFormData(formData);
    setPartialPaymentConfirmVisible(true);
  }, []);
  const handleQuantityChangeSubmit = useCallback((formData: QuantityForm) => {
    setQuantityFormData(formData);
    setQtyConfirmVisible(true);
  }, []);


  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setStartPickerVisible(false);
    if (selectedDate) {
      setStartDate(selectedDate.toISOString().split('T')[0]);
    }
  };
  const filterOrdersByDate = () => {
    if (!startDate) {
      Alert.alert('Warning', 'Please select the date.');
      return;
    }

    const start = new Date(startDate);

    // Reset the time of the start date to 00:00:00 to compare only the date part
    start.setHours(0, 0, 0, 0);

    const filtered = orders.filter((order) => {
      const deliveryDate = new Date(order.deliveryDate);

      // Reset the time of the delivery date to 00:00:00 to compare only the date part
      deliveryDate.setHours(0, 0, 0, 0);

      // Compare the numeric value of the date
      return deliveryDate.getTime() === start.getTime();
    });

    setFilteredOrders(filtered);
  };

  //search functionality

  const filterOrdersByShopkeeper = () => {
    if (!searchQuery) {
      setFilteredOrders(orders);
      return;
    }
  
    const filtered = orders.filter(order =>
      order.shopkeeper.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setStartDate('');
    setFilteredOrders(orders);
  };

  const handleUpdatePartialPayment = useCallback(async () => {
    if (!selectedOrder || !partialPaymentFormData) return;

    setUpdatingPayment(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/distributor/orders/${selectedOrder.id}/partial-payment`,
        {
          initialAmount: parseFloat(partialPaymentFormData.initialAmount),
          remainingAmount: parseFloat(partialPaymentFormData.remainingAmount),
          dueDate: partialPaymentFormData.dueDate.toISOString(),
          paymentStatus: partialPaymentFormData.paymentStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Partial payment updated successfully!');
        await fetchOrders();
        setShowPartialPaymentForm(false);
        setPartialPaymentConfirmVisible(false);
        setPartialPaymentFormData(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update partial payment');
    } finally {
      setUpdatingPayment(false);
    }
  }, [selectedOrder, partialPaymentFormData,]);

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const token = await AsyncStorage.getItem('token');
      // Fetch orders
      const ordersResponse = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/distributor/get-orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // console.log("ordersResponse data orders", ordersResponse.data.orders);

      //Fetch shopkeeper balances
      const balancesResponse = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/distributor/shopkeepers/balances`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("balancesResponse response: ", balancesResponse.data);

      // Map balances to orders
      const ordersWithBalances = ordersResponse.data.orders.map((order: Order) => {
        const shopkeeperBalance = balancesResponse.data.shopkeepers.find(
          (s: any) => s.name === order.shopkeeper.name // Change this line to match by name
        );
        return {
          ...order,
          shopkeeper: {
            ...order.shopkeeper,
            balance: shopkeeperBalance?.totalBalance || 0,
          },
        };
      });

      //Check if orders are mapped properly
      // console.log("Orders with balances: ", ordersWithBalances);

      setOrders(ordersWithBalances);
      setFilteredOrders(ordersWithBalances);

    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      Alert.alert(
        'Error',
        'Failed to fetch orders. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleOrderPress = useCallback((order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
    setStatus(order.status);
    setDeliveryDate(new Date(order.deliveryDate));
  }, []);

  const handleStatusChange = useCallback((selectedStatus: string) => {
    setStatus(selectedStatus);
    if(selectedStatus=="DELIVERED"){
      setShowImageUploadModal(true);
    }
    setConfirmationVisible(true);
  }, []);
  


  const handleImagePicker = async (useCamera: boolean) => {
    const permissionMethod = useCamera 
        ? ImagePicker.requestCameraPermissionsAsync 
        : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { granted } = await permissionMethod();
    if (!granted) {
        Alert.alert('Permission Required', `Permission to access ${useCamera ? 'camera' : 'media library'} is required!`);
        return;
    }

    const result = await (useCamera 
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync)({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
        setImage(result.assets[0].uri);
        setShowImageUploadModal(false); // Close the modal after selecting an image
        await handleUpdatePhoto(); // Call the photo update function
    }
};

const handleUpdatePhoto = async () => {
  console.log("API called");

  try {
      const token = await AsyncStorage.getItem('token');
      if (!image) {
          Alert.alert('Error', 'Please select an image of the shopkeeper.');
          return;
      }

      const formDataToSend = new FormData();

      // Append image if exists
      if (image) {
          const imageFileName = image.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(imageFileName);
          const imageType = match ? `image/${match[1]}` : 'image/jpeg';
          formDataToSend.append('file', {
              uri: image,
              name: imageFileName,
              type: imageType,
          } as any);

          // Make sure to replace :orderId with the actual order ID
          const response = await axios.put(
              `${process.env.EXPO_PUBLIC_API_URL}/distributor/orders/${selectedOrder?.id}/confirmation-photo`, // Use selectedOrder.id here
              formDataToSend,
              {
                  headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'multipart/form-data',
                      'Authorization': `Bearer ${token}`,
                  },
              }
          );

          // Handle the response
          if (response.status === 200) {
              Alert.alert('Success', 'Photo uploaded successfully!');
              // Optionally, you can refresh the orders or perform other actions here
          } else {
              Alert.alert('Error', 'Failed to upload photo. Please try again.');
          }
      }
  } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload photo');
      console.error('Error uploading photo:', error);
  }
};
const handleUpdateOrder = useCallback(async () => {
  if (!selectedOrder) return;

  setUpdating(true);
  try {
    const token = await AsyncStorage.getItem('token');
    
    // Prepare the payload
    const payload = {
      status,
      deliveryDate: deliveryDate.toISOString(),
    };

    const response = await axios.put(
      `${process.env.EXPO_PUBLIC_API_URL}/distributor/orders/${selectedOrder.id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.status === 200) {
      console.log(response.data);
      Alert.alert('Success', 'Order updated successfully!');
      await fetchOrders();
      setModalVisible(false);
      setConfirmationVisible(false);
    }
  } catch (error: any) {
    Alert.alert('Error', error.response?.data?.message || 'Failed to update order');
  } finally {
    setUpdating(false);
  }
}, [selectedOrder, status, deliveryDate, fetchOrders]);

const handleQtyChange = useCallback(async () => {
  if (!selectedOrder || !quantityFormData) return;

  setUpdating(true);  // Show loading spinner or indicator

  // Map the items from the form data, ensuring productId, variantId, and quantity are included
  const updatedItems = quantityFormData.items.map((item) => ({
    productId: item.productId,  // Ensure this is set
    variantId: item.variantId || null,  // Ensure this is set
    quantity: item.quantity,    // The updated quantity from form data
  }));

  try {
    const token = await AsyncStorage.getItem('token');

    // Prepare the payload
    const payload = {
      items: updatedItems,  // Send the updated quantities of items
    };

    const response = await axios.put(
      `${process.env.EXPO_PUBLIC_API_URL}/distributor/orders/${selectedOrder.id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.status === 200) {
      Alert.alert('Success', 'Order items updated successfully!');
      await fetchOrders();  // Refresh orders after update
      setShowQtyChange(false);  // Close the modal
      setQtyConfirmVisible(false);  // Hide confirmation if applicable
    }
  } catch (error: any) {
    console.log(error);
    Alert.alert('Error', error.response?.data?.message || 'Failed to update order items');
  } finally {
    setUpdating(false);  // Hide loading indicator
  }
}, [selectedOrder, quantityFormData, fetchOrders]);
  // const sortedOrders = useMemo(() => {
  //   return [...orders].sort((a, b) => {
  //     // Sort by status priority (Pending > Delivered > Cancelled)
  //     const statusPriority = { PENDING: 0, DELIVERED: 1, CANCELED: 2 };
  //     const statusDiff = statusPriority[a.status as keyof typeof statusPriority] - 
  //                       statusPriority[b.status as keyof typeof statusPriority];

  //     if (statusDiff !== 0) return statusDiff;

  //     // If same status, sort by delivery date (newest first)
  //     return new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime();
  //   });
  // }, [orders]);

  const renderOrderItem = useCallback(({ item }: { item: Order }) => (
    <OrderCard item={item} onPress={handleOrderPress} />
  ), [handleOrderPress]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/distributor/dashboard')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
        <TouchableOpacity onPress={fetchOrders} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#007BFF" />
        </TouchableOpacity>
      </View>
      <View style={styles.filterSection}>
        <View style={styles.dateContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setStartPickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {startDate || "Select Date"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.button, styles.filterButton]}
            onPress={filterOrdersByDate}
          >
            <Ionicons name="search-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={resetFilters}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
      {startPickerVisible && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      <View style={styles.searchContainer}>
  <TextInput
    style={styles.searchInput}
    placeholder="Search by Shopkeeper Name"
    value={searchQuery}
    onChangeText={text => {
      setSearchQuery(text);
      filterOrdersByShopkeeper(); // Call the filter function on text change
    }}
  />
</View>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshing={loading}
        onRefresh={fetchOrders}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {selectedOrder?.status === "PENDING" && (
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={status}
                    onValueChange={handleStatusChange}
                    style={styles.picker}
                  >
                    {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                      <Picker.Item key={key} label={value} value={key} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
            {selectedOrder?.status !== "PENDING" && (
              <>
                <OrderItemsList items={selectedOrder?.items || []} />
                <TouchableOpacity
                  style={styles.partialPaymentButton}
                  onPress={handleUpdateQty}
                >
                  <Text style={styles.buttonText}>Update Quantity Change</Text>
                </TouchableOpacity>

                <View style={styles.orderActions}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Delivery Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={styles.datePickerButton}
                    >
                      <Ionicons name="calendar" size={20} color="#007BFF" />
                      <Text style={styles.dateText}>
                        {deliveryDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showDatePicker && (
                    <DateTimePicker
                      value={deliveryDate}
                      mode="date"
                      display="default"
                      onChange={(_, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDeliveryDate(selectedDate);
                        }
                      }}
                      minimumDate={new Date()}
                    />
                  )}

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Status</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={status}
                        onValueChange={handleStatusChange}
                        style={styles.picker}
                      >
                        {Object.entries(ORDER_STATUSES).map(([key, value]) => (
                          <Picker.Item key={key} label={value} value={key} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  {selectedOrder?.partialPayment && (
                    <TouchableOpacity
                      style={styles.partialPaymentButton}
                      onPress={handleShowPartialPayment}
                    >
                      <Text style={styles.buttonText}>Update Partial Payment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={confirmationVisible}
        status={ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]}
        onConfirm={handleUpdateOrder}
        onCancel={() => setConfirmationVisible(false)}
      />

      {showPartialPaymentForm && partialPaymentFormData && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPartialPaymentForm}
          onRequestClose={() => setShowPartialPaymentForm(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <PartialPaymentForm
                partialPayment={selectedOrder?.partialPayment}
                formData={partialPaymentFormData}
                onUpdate={handlePartialPaymentSubmit}
                onClose={() => setShowPartialPaymentForm(false)}
                loading={updatingPayment}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* handle quantity */}
      {showQtyChange && quantityFormData && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showQtyChange}
          onRequestClose={() => setShowQtyChange(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <QuantityForm
                orderItem={selectedOrder?.items[0]}
                formData={quantityFormData}
                onUpdate={handleQuantityChangeSubmit}
                onClose={() => setShowQtyChange(false)}
                loading={updating}
              />
            </View>
          </View>
        </Modal>
      )}
      <Modal
    animationType="slide"
    transparent={true}
    visible={showImageUploadModal}
    onRequestClose={() => setShowImageUploadModal(false)}
>
    <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Confirmation Photo</Text>
            <TouchableOpacity onPress={() => handleImagePicker(true)} style={styles.partialPaymentButton}>
                <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={() => handleImagePicker(false)}>
                <Text style={styles.buttonText2}>Choose from Gallery</Text>
            </TouchableOpacity> */}
            <TouchableOpacity onPress={() => setShowImageUploadModal(false)} style={styles.partialPaymentButton}>
                <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
        </View>
    </View>
</Modal>

      <QuantityUpdateConfirmationModal
        visible={qtyConfirmVisible}
        onConfirm={handleQtyChange}
        onCancel={() => setQtyConfirmVisible(false)}
        loading={updating}
      />

      <PartialPaymentConfirmationModal
        visible={partialPaymentConfirmVisible}
        onConfirm={handleUpdatePartialPayment}
        onCancel={() => setPartialPaymentConfirmVisible(false)}
        loading={updatingPayment}
      />
    </SafeAreaView>
  );
};

export default DistributorOrdersScreen;
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  Modal, 
  ActivityIndicator, 
  Alert,
  StatusBar,
  Dimensions,
  Pressable,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Orderstyles } from './styles/styles';

type Order = {
  orderId:string;
  shopName: string;
  employeeName: string;
  distributorName: string;
  orderDate: string;
  contactNumber: string;
  products: { 
    productName: string; 
    quantity: number;
    variant: string;
    variantValue: string;
  }[];
  totalAmount: number;
  paymentType: string;
  deliveryDate: string;
  deliverySlot: string;
  status: string;
  partialPayment: PartialPayment | null; // Add this line
  paymentStatus: string; // Add this line
};
type PartialPayment = {
  id: number;
  initialAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

const OrderList = () => {
  const router = useRouter();
  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
        return '#FF0000';
      default:
        return '#808080';
    }
  };

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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No authorization token found');
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/admin/get-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdersData(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filterOrdersByDate = () => {
    if (!startDate || !endDate) {
      Alert.alert('Warning', 'Please select both start and end dates.');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = ordersData.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= start && orderDate <= end;
    });
    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredOrders(ordersData);
  };

  const exportOrdersToXLSX = async () => {
    try {
      if (!filteredOrders.length) {
        Alert.alert('Warning', 'No orders to export.');
        return;
      }
  
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }
  
      const fileName = `OrderReport_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;
  
      const worksheetData = filteredOrders.map(order => ({
        'Order id': order.orderId,
        'Shop Name': order.shopName,
        'Employee Name': order.employeeName,
        'Distributor Name': order.distributorName,
        'Order Date': order.orderDate ? new Date(order.orderDate).toLocaleDateString() : '',
        'Contact Number': order.contactNumber,
        'Total Amount': order.totalAmount.toFixed(2),
        'Payment Type': order.paymentType,
        'Delivery Date': order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '',
        'Delivery Slot': order.deliverySlot,
        'Status': order.status,
        'Products': order.products.map(p => {
          const productDetails = p.variant 
            ? `${p.productName} (${p.variant})` 
            : p.productName;
          return p.quantity > 0 ? `${productDetails} x${p.quantity}` : productDetails;
        }).join('\n'),
        // Partial Payment data, formatted
        'Advance Amount': order.partialPayment ? order.partialPayment.initialAmount.toFixed(2) : '',
        'Balance Amount': order.partialPayment ? order.partialPayment.remainingAmount.toFixed(2) : '',
        'Partial Payment Due Date': order.partialPayment ? new Date(order.partialPayment.dueDate).toLocaleDateString() : '',
        'Partial Payment Status': order.partialPayment ? order.partialPayment.paymentStatus : '',
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
      // Format header row: make them bold
      const header = worksheet['!rows'] || [];
      for (let i = 0; i < Object.keys(worksheetData[0]).length; i++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: i })];
        if (cell) {
          cell.s = { font: { bold: true } };
        }
      }
  
      // Auto-adjust column widths
      const columnWidths: number[] = [];
      worksheetData.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const cellValue = row[key as keyof typeof row] ? row[key as keyof typeof row].toString() : '';
          columnWidths.push(cellValue.length);
        });
      });
  
      worksheet['!cols'] = columnWidths.map((width) => ({
        wpx: Math.min(200, width * 10)  // Limit max width
      }));
  
      // Set borders for all cells
      const range = worksheet['!ref'];

      if (range) {
        const decodedRange = XLSX.utils.decode_range(range);

        // Loop through the rows and columns to apply formatting
        for (let row = decodedRange.s.r; row <= decodedRange.e.r; row++) {
          for (let col = decodedRange.s.c; col <= decodedRange.e.c; col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell) {
              cell.s = {
                border: {
                  top: { style: 'thin' },
                  left: { style: 'thin' },
                  bottom: { style: 'thin' },
                  right: { style: 'thin' },
                },
                alignment: { horizontal: 'center', vertical: 'center' }
              };
            }
          }
        }
      } else {
        console.error('Worksheet reference range not found');
      }

  
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  
      const wbout = XLSX.write(workbook, {
        type: 'base64',
        bookType: 'xlsx'
      });
  
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64
      });
  
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Export Orders Report',
        UTI: 'com.microsoft.excel.xlsx'
      });
  
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
  
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'There was an error exporting the file. Please try again.');
    }
  };
  
  
  
  const openModal = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };


  const renderOrderItem = ({ item }: { item: Order }) => (
    <Pressable 
      style={({pressed}) => [
        Orderstyles.card,
        pressed && Orderstyles.cardPressed
      ]}
      onPress={() => openModal(item)}
      android_ripple={{ color: '#e0e0e0' }}
    >
      <View style={Orderstyles.cardHeader}>
        <Text style={Orderstyles.shopName}>Order id: {item.orderId}{'\n'}{item.shopName}</Text>
        <View style={[Orderstyles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={Orderstyles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={Orderstyles.cardContent}>
        <View style={Orderstyles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={Orderstyles.infoText}>{item.employeeName}</Text>
        </View>

        <View style={Orderstyles.infoRow}>
          <Ionicons name="business-outline" size={16} color="#666" />
          <Text style={Orderstyles.infoText}>{item.distributorName}</Text>
        </View>

        <View style={Orderstyles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={Orderstyles.infoText}>
            {new Date(item.orderDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={Orderstyles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={Orderstyles.infoText}>
            Rs. {item.totalAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const OrderDetailsModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={Orderstyles.modalContainer}>
        <View style={Orderstyles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={Orderstyles.modalHeader}>
              <Text style={Orderstyles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={closeModal} style={Orderstyles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <>
                <View style={Orderstyles.modalSection}>
                  <Text style={Orderstyles.sectionTitle}>Shop Information</Text>
                  <Text style={Orderstyles.modalDetail}>Shop Name: {selectedOrder.shopName}</Text>
                  <Text style={Orderstyles.modalDetail}>Contact: {selectedOrder.contactNumber}</Text>
                </View>

                <View style={Orderstyles.modalSection}>
                  <Text style={Orderstyles.sectionTitle}>Order Information</Text>
                  <Text style={Orderstyles.modalDetail}>Employee: {selectedOrder.employeeName}</Text>
                  <Text style={Orderstyles.modalDetail}>Distributor: {selectedOrder.distributorName}</Text>
                  <Text style={Orderstyles.modalDetail}>
                    Order Date: {new Date(selectedOrder.orderDate).toLocaleString()}
                  </Text>
                  <Text style={Orderstyles.modalDetail}>Payment Type: {selectedOrder.paymentType}</Text>
                  <Text style={Orderstyles.modalDetail}>
                    Total Amount: Rs. {selectedOrder.totalAmount.toFixed(2)}
                  </Text>
                </View>
                {selectedOrder?.partialPayment ? (
                    <View style={Orderstyles.modalSection}>
                      <Text style={Orderstyles.sectionTitle}>Partial Payment Details</Text>
                      <Text style={Orderstyles.modalDetail}>
                        Advance: ₹{selectedOrder.partialPayment.initialAmount.toLocaleString()}
                      </Text>
                      <Text style={Orderstyles.modalDetail}>
                        Balance Amount: ₹{selectedOrder.partialPayment.remainingAmount.toLocaleString()}
                      </Text>
                      <Text style={Orderstyles.modalDetail}>
                        Due Date: {new Date(selectedOrder.partialPayment.dueDate).toLocaleDateString()}
                      </Text>
                      <Text style={Orderstyles.modalDetail}>
                        Payment Status: {selectedOrder.partialPayment.paymentStatus}
                      </Text>
                    </View>
                  ) : (
                    <View style={Orderstyles.modalSection}>
                      <Text style={Orderstyles.infoText}>No partial payment details available.</Text>
                    </View>
                  )}


                <View style={Orderstyles.modalSection}>
                  <Text style={Orderstyles.sectionTitle}>Delivery Information</Text>
                  <Text style={Orderstyles.modalDetail}>
                    Delivery Date: {new Date(selectedOrder.deliveryDate).toLocaleString()}
                  </Text>
                  <Text style={Orderstyles.modalDetail}>Delivery Slot: {selectedOrder.deliverySlot}</Text>
                  <View style={[Orderstyles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                    <Text style={Orderstyles.statusText}>{selectedOrder.status}</Text>
                  </View>
                </View>

                <View style={Orderstyles.modalSection}>
                  <Text style={Orderstyles.sectionTitle}>Products</Text>
                  {selectedOrder.products.map((product, index) => (
                    <View key={index} style={Orderstyles.productItem}>
                      <Text style={Orderstyles.productName}>
                        {product.productName} ({product.variant})
                      </Text>
                      <Text style={Orderstyles.productQuantity}>x{product.quantity}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={Orderstyles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={Orderstyles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={Orderstyles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={Orderstyles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/admin/dashboard')}
          style={Orderstyles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={Orderstyles.title}>Orders</Text>
      </View>

      <View style={Orderstyles.filterSection}>
        <View style={Orderstyles.dateContainer}>
          <TouchableOpacity 
            style={Orderstyles.dateButton}
            onPress={() => setStartPickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={Orderstyles.dateButtonText}>
              {startDate || "Start Date"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={Orderstyles.dateButton}
            onPress={() => setEndPickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={Orderstyles.dateButtonText}>
              {endDate || "End Date"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={Orderstyles.filterButtons}>
          <TouchableOpacity 
            style={[Orderstyles.button, Orderstyles.filterButton]} 
            onPress={filterOrdersByDate}
          >
            <Ionicons name="search-outline" size={20} color="#fff" />
            <Text style={Orderstyles.buttonText}>Filter</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[Orderstyles.button, Orderstyles.resetButton]} 
            onPress={resetFilters}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={Orderstyles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[Orderstyles.button, Orderstyles.exportButton]} 
          onPress={exportOrdersToXLSX}
        >
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={Orderstyles.buttonText}>Export Orders</Text>
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

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={Orderstyles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      <OrderDetailsModal />
    </SafeAreaView>
  );
};

export default OrderList;
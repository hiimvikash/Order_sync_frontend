import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Platform,
  ToastAndroid,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Product = {
  name: string;
  distributorPrice: number;
  retailerPrice: number;
  mrp: number;
};

type Item = {
  id: number;
  orderId: number;
  quantity: number;
  product: Product;
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

type Order = {
  id: number;
  orderDate: string;
  deliveryDate: string;
  deliverySlot: string;
  paymentTerm: string;
  orderNote: string;
  totalAmount: number;
  status: string;
  items: Item[];
  shopkeeper: {
    name: string;
    ownerName: string;
    contactNumber: string;
  };
  distributor: {
    name: string;
    phoneNumber: string;
  };
  partialPayment: PartialPayment | null; // Add this line
  paymentStatus: string; // Add this line
};

const SalespersonOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const formatDate = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#FF0000';
      default:
        return '#666666';
    }
  };

  const fetchOrders = async () => {
    try {
      const user = await AsyncStorage.getItem('user');
      const parsedUser = JSON.parse(user || '{}');
      const token = await AsyncStorage.getItem('token');
      
      if (!parsedUser.id) {
        ToastAndroid.show('Error loading user data', ToastAndroid.SHORT);
        return;
      }
      
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/salesperson/orders/${parsedUser.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrders(response.data);
      
    } catch (error) {
      ToastAndroid.show('Failed to fetch orders', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const openModal = (order: Order) => {
    setSelectedOrder(order);
    
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

  const OrderStatusBadge = ({ status }: { status: string }) => (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
        {status}
      </Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => openModal(item)}    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>Order #{item.id}</Text>
        <OrderStatusBadge status={item.status} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.orderDetail}>Order: {formatDate(item.orderDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.orderDetail}>Delivery: {formatDate(item.deliveryDate)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.orderDetail}>{item.shopkeeper.name}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>₹{item.totalAmount.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Details</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScroll}>
            {selectedOrder && (
              <>
                <View style={styles.orderInfo}>
                  <View style={styles.orderInfoHeader}>
                    <Text style={styles.orderInfoTitle}>Order #{selectedOrder.id}</Text>
                    <OrderStatusBadge status={selectedOrder.status} />
                  </View>
                  
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Information</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>
                          Order Date: {formatDate(selectedOrder.orderDate)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>
                          Delivery Date: {formatDate(selectedOrder.deliveryDate)}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.infoText}>
                          Slot: {selectedOrder.deliverySlot}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    {selectedOrder.items.map((item) => (
                      <View key={item.id} style={styles.itemCard}>
                        <Text style={styles.itemName}>{item.product.name}</Text>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                          <Text style={styles.itemPrice}>
                            ₹{item.product.retailerPrice.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shopkeeper Details</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{selectedOrder.shopkeeper.name}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>
                          {selectedOrder.shopkeeper.contactNumber}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distributor Details</Text>
                    <View style={styles.sectionContent}>
                      <View style={styles.infoRow}>
                        <Ionicons name="business-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>{selectedOrder.distributor.name}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#666" />
                        <Text style={styles.infoText}>
                          {selectedOrder.distributor.phoneNumber}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Partial Payment Details</Text>
                  {selectedOrder.partialPayment ? (
                    <View style={styles.sectionContent}>
                      <Text style={styles.infoText}>
                        Advance: ₹{selectedOrder.partialPayment.initialAmount.toLocaleString()}
                      </Text>
                      <Text style={styles.infoText}>
                        Balance Amount: ₹{selectedOrder.partialPayment.remainingAmount.toLocaleString()}
                      </Text>
                      <Text style={styles.infoText}>
                        Due Date: {formatDate(selectedOrder.partialPayment.dueDate)}
                      </Text>
                      <Text style={styles.infoText}>
                        Payment Status: {selectedOrder.partialPayment.paymentStatus}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.infoText}>No partial payment details available.</Text>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Type</Text>
                  <Text style={styles.infoText}>{selectedOrder.paymentTerm}</Text>
                </View>

                  <View style={styles.totalSection}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>
                      ₹{selectedOrder.totalAmount.toLocaleString()}
                    </Text>
                  </View>
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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace('/(app)/salesperson/dashboard')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Your Orders</Text>
        </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    paddingTop: 50,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardBody: {
    padding: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetail: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  amountContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: '#666666',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  modalScroll: {
    flex: 1,
  },
  orderInfo: {
    padding: 16,
  },
  orderInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  itemCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666666',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  totalSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    marginTop: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
});

export default SalespersonOrdersScreen;
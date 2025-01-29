import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { styles } from '../styles/styles';
interface Order {
    id: number;
    deliveryDate: string;
    totalAmount: number;
    status: string;
    shopkeeper: Shopkeeper;
    items: OrderItem[];
    partialPayment?: PartialPayment;
    paymentTerm:string
  }
  interface PartialPayment {
    initialAmount: number;
    remainingAmount: number;
    dueDate: string;
    paymentStatus: string;
  }
  interface Shopkeeper {
    id:number
    name: string;
    contactNumber: string;
    balance?: number;
  }
  // interface Shopkeeper {
  //   name: string;
  //   contactNumber: string;
  // }
  interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    productId: number;
    variantId: number;
  }
interface OrderItemProps {
    item: Order;
    onPress: (order: Order) => void;
  }
  // Helper Functions
const getStatusColor = (status: string) => {
    const colors = {
      PENDING: '#FFA500',
      DELIVERED: '#28A745',
      CANCELED: '#DC3545',
    };
    return colors[status as keyof typeof colors] || '#000000';
  };
  
  const getStatusStyle = (status: string) => ({
    borderLeftWidth: 5,
    borderLeftColor: getStatusColor(status),
  });
export const OrderCard = React.memo(({ item, onPress }: OrderItemProps) => {
    const formattedDate = new Date(item.deliveryDate).toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={[styles.card, getStatusStyle(item.status)]} 
        onPress={() => onPress(item)}
      >
         <View style={{ position: 'relative' }}>
        {item.shopkeeper?.balance != null && (
          <Text style={[styles.orderDetail, { 
            position: 'absolute', 
            top: 0, 
            right: 10, 
            backgroundColor: '#FFD700', // Highlight color
            padding: 0,
            borderRadius: 5,
            fontWeight: 'bold',
            color: '#000' // Text color
          }]}>
            Shop Balance Amount: ₹{item.shopkeeper.balance.toLocaleString()}
          </Text>
        )}
      </View>
      <Text style={styles.orderDetail}>ID: #{item.id}</Text>
        <Text style={styles.orderNumber}>Shopkeeper: {item.shopkeeper.name}</Text>
        <Text style={styles.orderDetail}>Contact: {item.shopkeeper.contactNumber}</Text>
        <Text style={styles.orderDetail}>Delivery: {formattedDate}</Text>
        <Text style={[styles.orderDetail, { fontWeight: 'bold' }]}>Payment Type: {item.paymentTerm}</Text>
        <Text style={styles.orderDetail}>Amount: ₹{item.totalAmount.toLocaleString()}</Text>
        {item.partialPayment && (
    <>
      <Text style={styles.orderDetail}>Advance Amount: ₹{item.partialPayment.initialAmount.toLocaleString()}</Text>
      <Text style={styles.orderDetail}>Partial payment Balance Amount: ₹{item.partialPayment.remainingAmount.toLocaleString()}</Text>
      <Text style={styles.orderDetail}>Payment Status: {item.partialPayment.paymentStatus}</Text>
    </>
  )}
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
})

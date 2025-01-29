import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { styles } from '../styles/styles';
import { Ionicons } from '@expo/vector-icons';

// Types
interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  productId: number;
  variantId: number;
}

interface QuantityForm {
    items: {
      productName: any;
      productId: number;
      variantId?: number; // Optional for variant, depending on your logic
      quantity: number;
    }[];
  }
  

export const QuantityForm = React.memo(({ 
    orderItem, 
    formData, 
    onUpdate, 
    onClose, 
    loading 
  }: { 
    orderItem: OrderItem | undefined;
    formData: QuantityForm;
    onUpdate: (formData: QuantityForm) => void;
    onClose: () => void;
    loading: boolean;
  }) => {
    const [localFormData, setLocalFormData] = useState<QuantityForm>(formData);
  
    // Handle quantity change for each item
    const handleQuantityChange = (index: number, newQuantity: string) => {
        // Parse the input as an integer or default to 0
        const parsedQuantity = parseInt(newQuantity, 10) || 0;
      
        // // Validate the parsed quantity
        // if (parsedQuantity <= 0) {
        //   Alert.alert('Error', 'Quantity must be a positive number');
        //   return;
        // }
      
        // Update the specific item in the local form data
        setLocalFormData(prev => {
          const updatedItems = [...prev.items];
          updatedItems[index] = {
            ...updatedItems[index],
            quantity: parsedQuantity,
          };
          return { ...prev, items: updatedItems };
        });
      };
      
    
  
    const handleSubmit = () => {
      // Ensure all items have valid quantities
      if (!localFormData.items || localFormData.items.some(item => item.quantity <= 0)) {
        Alert.alert('Error', 'Please ensure all quantities are greater than 0');
        return;
      }
      onUpdate(localFormData);  // Call the onUpdate function passed as a prop
    };
  
    return (
      <View style={styles.partialPaymentForm}>
        <View style={styles.formHeader}>
          <Text style={styles.sectionTitle}>Update Quantities</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
  
        {localFormData.items.map((item, index) => (
          <View key={index} style={styles.formField}>
            <Text style={styles.fieldLabel}>{`Product ${item.productName}`}</Text>
  
            <Text style={styles.fieldLabel}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={String(item.quantity)}
              onChangeText={(text) => handleQuantityChange(index, text)}
              keyboardType="numeric"
              placeholder="Enter quantity"
            />
          </View>
        ))}
  
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.cancelButton, { flex: 1 }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.updateButton, loading && styles.disabledButton, { flex: 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Confirm Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  });

  export const QuantityUpdateConfirmationModal = React.memo(({ 
    visible, 
    onConfirm, 
    onCancel, 
    loading 
  }: { 
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
  }) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.confirmationContent}>
          <Text style={styles.modalTitle}>Confirm Quantity Update</Text>
          <Text style={styles.modalDetail}>
            Are you sure you want to update the quantity details?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Confirm</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));
  
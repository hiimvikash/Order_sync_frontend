
import React, { useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from '../styles/styles';

interface PartialPayment {
  initialAmount: number;
  remainingAmount: number;
  dueDate: string;
  paymentStatus: string;
}
interface PartialPaymentForm {
  initialAmount: string;
  remainingAmount: string;
  dueDate: Date;
  paymentStatus: string;
}


const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
} as const;
export const PartialPaymentForm = React.memo(({ 
    partialPayment,
    formData,
    onUpdate,
    onClose,
    loading 
  }: { 
    partialPayment: PartialPayment | undefined;
    formData: PartialPaymentForm;
    onUpdate: (formData: PartialPaymentForm) => void;
    onClose: () => void;
    loading: boolean;
  }) => {
    const [localFormData, setLocalFormData] = useState<PartialPaymentForm>(formData);
    const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
    const handleSubmit = () => {
      if (!localFormData.initialAmount || !localFormData.remainingAmount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      onUpdate(localFormData);
    };
  
    return (
      <View style={styles.partialPaymentForm}>
        <View style={styles.formHeader}>
          <Text style={styles.sectionTitle}>Update Partial Payment</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
  
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Initial Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={localFormData.initialAmount}
            onChangeText={(text) => setLocalFormData(prev => ({ ...prev, initialAmount: text }))}
            keyboardType="numeric"
            placeholder="Enter initial amount"
          />
        </View>
  
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Remaining Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={localFormData.remainingAmount}
            onChangeText={(text) => setLocalFormData(prev => ({ ...prev, remainingAmount: text }))}
            keyboardType="numeric"
            placeholder="Enter remaining amount"
          />
        </View>
  
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Due Date</Text>
          <TouchableOpacity
            onPress={() => setShowDueDatePicker(true)}
            style={styles.datePickerButton}
          >
            <Ionicons name="calendar" size={20} color="#007BFF" />
            <Text style={styles.dateText}>
              {localFormData.dueDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
  
        {showDueDatePicker && (
          <DateTimePicker
            value={localFormData.dueDate}
            mode="date"
            display="default"
            onChange={(_, selectedDate) => {
              setShowDueDatePicker(false);
              if (selectedDate) {
                setLocalFormData(prev => ({ ...prev, dueDate: selectedDate }));
              }
            }}
            minimumDate={new Date()}
          />
        )}
  
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Payment Status</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={localFormData.paymentStatus}
              onValueChange={(value) => setLocalFormData(prev => ({ ...prev, paymentStatus: value }))}
              style={styles.picker}
            >
              {Object.entries(PAYMENT_STATUSES).map(([key, value]) => (
                <Picker.Item key={key} label={key.charAt(0) + key.slice(1).toLowerCase()} value={value} />
              ))}
            </Picker>
          </View>
        </View>
  
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
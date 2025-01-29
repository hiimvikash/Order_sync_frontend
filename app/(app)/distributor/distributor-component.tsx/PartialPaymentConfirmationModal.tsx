import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { styles } from '../styles/styles';
export const PartialPaymentConfirmationModal = React.memo(({ 
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
          <Text style={styles.modalTitle}>Confirm Payment Update</Text>
          <Text style={styles.modalDetail}>
            Are you sure you want to update the partial payment details?
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
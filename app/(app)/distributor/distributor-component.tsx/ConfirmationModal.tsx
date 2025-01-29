import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { styles } from '../styles/styles';

export const ConfirmationModal = React.memo(({ 
    visible, 
    status, 
    onConfirm, 
    onCancel 
  }: { 
    visible: boolean;
    status: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.confirmationContent}>
          <Text style={styles.modalTitle}>Confirm Changes</Text>
          <Text style={styles.modalDetail}>
            Are you sure you want to update the order status to {status}?
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  ));
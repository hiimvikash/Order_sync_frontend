import { StyleSheet } from "react-native";

export const Orderstyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
    },
    loadingText: {
      marginTop: 10,
      color: '#666',
      fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  filterSection: {
      backgroundColor: '#fff',
      padding: 16,
      elevation: 2,
      marginBottom: 8,
  },
  dateContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',
      padding: 12,
      borderRadius: 8,
      flex: 0.48,
  },
  dateButtonText: {
      marginLeft: 8,
      color: '#333',
      fontSize: 14,
  },
  filterButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      elevation: 1,
  },
  filterButton: {
      backgroundColor: '#007AFF',
      flex: 0.48,
  },
  resetButton: {
      backgroundColor: '#FF3B30',
      flex: 0.48,
  },
  exportButton: {
      backgroundColor: '#34C759',
  },
  buttonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 8,
  },
  list: {
      padding: 16,
  },
  card: {
      backgroundColor: '#fff',
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
      overflow: 'hidden',
  },
  cardPressed: {
      opacity: 0.7,
  },
  cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  shopName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
  },
  statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginLeft: 8,
  },
  statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '500',
  },
  cardContent: {
      padding: 16,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
  },
  infoText: {
      marginLeft: 8,
      color: '#666',
      fontSize: 14,
  },
  modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
  },
  closeButton: {
      padding: 8,
  },
  modalSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
  },
  modalDetail: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
  },
  productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
  },
  productName: {
      fontSize: 14,
      color: '#333',
      flex: 1,
  },
  productQuantity: {
      fontSize: 14,
      color: '#666',
      marginLeft: 16,
  }
  });
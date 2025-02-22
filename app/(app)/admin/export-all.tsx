import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-virtualized-view";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";


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
export interface ProductInventory {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  reserve1: string;
  reserve2: string;
  reserve3: string;
  unitPrice: number; // Add this line
}

export interface DistributorOrder {
  id: number;
  distributorId: number;
  distributorName: string;
  productId: number;
  productName: string;
  quantity: number;
  dispatchDate: string;
  createdAt: string;
  updatedAt: string;
}

const ExportAll = memo(() => {
  const [productInventory, setProductInventory] = useState<ProductInventory[]>(
    []
  );
  const [distributorOrders, setDistributorOrders] = useState<
    DistributorOrder[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("not token");
        Alert.alert("Authentication Error", "User not authenticated.");
        return;
      }
      const result = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/getallexports`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (result.data.success) {
        setProductInventory(result.data.data.productInventory);
        setDistributorOrders(result.data.data.distributorOrders);
      } else {
        Alert.alert("Error", "Failed to fetch data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Something went wrong while fetching data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('No authorization token found');
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/admin/get-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);


  
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const exportDistributorOrdersToXLSX = async (
    distributorOrder: DistributorOrder[]
  ) => {
    try {
      if (!distributorOrder.length) {
        Alert.alert("Warning", "No orders to export.");
        return;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device");
        return;
      }

      const fileName = `DistributorOrders_${new Date()
        .toLocaleDateString()
        .replace(/\//g, "-")}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      // Convert data to Excel format
      const worksheetData = distributorOrder.map((order: any) => ({
        "Order ID": order.id,
        "Distributor Name": order.distributorName,
        "Product ID": order.productId,
        "Product Name": order.productName,
        Quantity: order.quantity,
        "Dispatch Date": order.dispatchDate
          ? new Date(order.dispatchDate).toLocaleDateString()
          : "",
        "Created At": new Date(order.createdAt).toLocaleDateString(),
        "Updated At": new Date(order.updatedAt).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Bold headers
      const headerKeys = Object.keys(worksheetData[0]);
      headerKeys.forEach((key, colIndex) => {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: colIndex })];
        if (cell) cell.s = { font: { bold: true } };
      });

      // Adjust column widths
      worksheet["!cols"] = headerKeys.map((key) => ({
        wpx: Math.min(200, key.length * 10),
      }));

      // Apply borders & center alignment
      const range = worksheet["!ref"];
      if (range) {
        const decodedRange = XLSX.utils.decode_range(range);
        for (let row = decodedRange.s.r; row <= decodedRange.e.r; row++) {
          for (let col = decodedRange.s.c; col <= decodedRange.e.c; col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell) {
              cell.s = {
                border: {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                },
                alignment: { horizontal: "center", vertical: "center" },
              };
            }
          }
        }
      } else {
        console.error("Worksheet reference range not found");
      }

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Distributor Orders");

      // Convert to base64
      const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

      // Save file
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Distributor Orders",
        UTI: "com.microsoft.excel.xlsx",
      });

      // Cleanup file after sharing
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        "There was an error exporting the file. Please try again."
      );
    }
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
  const exportProductInventoryToXLSX = async (
    productInventory: ProductInventory[]
  ) => {
    try {
      if (!productInventory.length) {
        Alert.alert("Warning", "No inventory records to export.");
        return;
      }
  
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Error", "Sharing is not available on this device.");
        return;
      }
  
      const fileName = `ProductInventory_${new Date()
        .toLocaleDateString()
        .replace(/\//g, "-")}.xlsx`;
      const fileUri = FileSystem.cacheDirectory + fileName;
  
      // Convert data to Excel format (Added 'Unit Price' column)
      const worksheetData = productInventory.map((product) => ({
        ID: product.id,
        "Product ID": product.productId,
        "Product Name": product.productName,
        "Unit Price": product.unitPrice, // Added new column
        Quantity: product.quantity,
        "Created At": new Date(product.createdAt).toLocaleDateString(),
        "Updated At": new Date(product.updatedAt).toLocaleDateString(),
        "Reserve 1": product.reserve1,
        "Reserve 2": product.reserve2,
        "Reserve 3": product.reserve3,
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  
      // Bold headers
      const headerKeys = Object.keys(worksheetData[0]);
      headerKeys.forEach((key, colIndex) => {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: colIndex })];
        if (cell) cell.s = { font: { bold: true } };
      });
  
      // Adjust column widths
      worksheet["!cols"] = headerKeys.map((key) => ({
        wpx: Math.min(200, key.length * 10),
      }));
  
      // Apply borders & center alignment
      const range = worksheet["!ref"];
      if (range) {
        const decodedRange = XLSX.utils.decode_range(range);
        for (let row = decodedRange.s.r; row <= decodedRange.e.r; row++) {
          for (let col = decodedRange.s.c; col <= decodedRange.e.c; col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            if (cell) {
              cell.s = {
                border: {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                },
                alignment: { horizontal: "center", vertical: "center" },
              };
            }
          }
        }
      } else {
        console.error("Worksheet reference range not found");
      }
  
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Product Inventory");
  
      // Convert to base64
      const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  
      // Save file
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });
  
      // Share file
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Export Product Inventory",
        UTI: "com.microsoft.excel.xlsx",
      });
  
      // Cleanup file after sharing
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert(
        "Export Failed",
        "There was an error exporting the file. Please try again."
      );
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
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.replace("/(app)/admin/inventory-management")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Export All</Text>
        </View>

        <View style={styles.exportCard}>
          <Text style={styles.exportHeading}>
            Export all distributor orders
          </Text>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              exportDistributorOrdersToXLSX(distributorOrders);
            }}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color="white"
              style={styles.icon}
            />
            <Text style={styles.exportButtonText}>Export as XLSX</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <View style={styles.exportCard}>
          <Text style={styles.exportHeading}>Export all product inventory</Text>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              exportProductInventoryToXLSX(productInventory);
            }}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color="white"
              style={styles.icon}
            />
            <Text style={styles.exportButtonText}>Export as XLSX</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.divider} />
        <View style={styles.exportCard}>
          <Text style={styles.exportHeading}>Export all shops orders</Text>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportOrdersToXLSX}
          >
            <Ionicons
              name="download-outline"
              size={24}
              color="white"
              style={styles.icon}
            />
            <Text style={styles.exportButtonText}>Export as XLSX</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

export default ExportAll;

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
    width: "100%",
  },

  exportCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5, // Shadow for Android
    alignItems: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  exportHeading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  icon: {
    marginRight: 5,
  },
  container: {
    padding: 10,
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  scrollContent: {
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
    marginRight: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});

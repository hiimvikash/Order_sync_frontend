import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced type definitions
interface Variant {
  id: number;
  productId: number;
  variantName: string;
  variantValue: string;
  price: number;
  stockQuantity: number;
}

interface Product {
  id: number;
  name: string;
  distributorPrice: number;
  retailerPrice: number;
  mrp: number;
  categoryId: number;
  inventoryCount: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
}
// Enhanced search input component
const SearchBar = memo(({ onSearch }: { onSearch: (text: string) => void }) => (
  <View style={styles.searchContainer}>
    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchInput}
      placeholder="Search products..."
      placeholderTextColor="#666"
      onChangeText={onSearch}
    />
  </View>
));

// Enhanced product details view
const ProductDetails = memo(({ product }: { product: Product }) => (
  <ScrollView style={styles.detailsContainer}>
    <View style={styles.detailsHeader}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text style={styles.timestampText}>
        Updated: {new Date(product.updatedAt).toLocaleDateString()}
      </Text>
    </View>
    
    <View style={styles.priceSection}>
      <View style={styles.priceItem}>
        <Text style={styles.priceLabel}>MRP</Text>
        <Text style={styles.priceValue}>₹{product.mrp}</Text>
      </View>
      <View style={styles.priceItem}>
        <Text style={styles.priceLabel}>Retailer</Text>
        <Text style={styles.priceValue}>₹{product.retailerPrice}</Text>
      </View>
      <View style={styles.priceItem}>
        <Text style={styles.priceLabel}>Distributor</Text>
        <Text style={styles.priceValue}>₹{product.distributorPrice}</Text>
      </View>
    </View>

    <View style={styles.inventorySection}>
      <Text style={styles.sectionTitle}>Inventory Details</Text>
      <Text style={styles.inventoryText}>
        Stock Count: {product.inventoryCount} units
      </Text>
      <Text style={styles.inventoryText}>
        Category ID: {product.categoryId}
      </Text>
    </View>

    <ScrollView style={styles.variantsSection}>
      <Text style={styles.sectionTitle}>Product Variants</Text>
      {product.variants.map(variant => (
        <View key={variant.id} style={styles.variantItem}>
          <View style={styles.variantHeader}>
            <Text style={styles.variantName}>{variant.variantName}</Text>
            <Text style={styles.variantValue}>{variant.variantValue}</Text>
          </View>
          <View style={styles.variantDetails}>
            <Text style={styles.variantPrice}>₹{variant.price}</Text>
            <Text style={styles.variantStock}>
              Stock: {variant.stockQuantity} units
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  </ScrollView>
));

// Enhanced edit form
const EditForm = memo(({ formData, setFormData, onSubmit }: {
  formData: Partial<Product>;
  setFormData: (data: Partial<Product>) => void;
  onSubmit: () => void;
}) => (
  <View style={styles.editFormContainer}>
    {Object.entries({
      name: { label: 'Product Name', type: 'text', icon: 'cube-outline' },
      distributorPrice: { label: 'Distributor Price', type: 'numeric', icon: 'cash-outline' },
      retailerPrice: { label: 'Retailer Price', type: 'numeric', icon: 'cash-outline' },
      mrp: { label: 'MRP', type: 'numeric', icon: 'pricetag-outline' },
      categoryId: { label: 'Category ID', type: 'numeric', icon: 'folder-outline' },
      inventoryCount: { label: 'Inventory Count', type: 'numeric', icon: 'archive-outline' },
    }).map(([key, { label, type, icon }]) => (
      <View key={key} style={styles.inputContainer}>
        <Ionicons size={20} color="#666" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>{label}</Text>
          <TextInput
            style={styles.formInput}
            placeholder={`Enter ${label.toLowerCase()}`}
            value={String(formData[key as keyof Partial<Product>] || '')}
            onChangeText={(text) => setFormData({
              ...formData,
              [key]: type === 'numeric' ? Number(text) : text
            })}
            keyboardType={type === 'numeric' ? 'numeric' : 'default'}
            placeholderTextColor="#999"
          />
        </View>
      </View>
    ))}
    <TouchableOpacity 
      style={styles.submitButton}
      onPress={onSubmit}
      activeOpacity={0.8}
    >
      <Ionicons name="save-outline" size={20} color="#fff" />
      <Text style={styles.submitButtonText}>Save Changes</Text>
    </TouchableOpacity>
  </View>
));

// Enhanced variant form
const VariantForm = memo(({ variantData, setVariantData, onSubmit }: {
  variantData: Partial<Variant>;
  setVariantData: (data: Partial<Variant>) => void;
  onSubmit: () => void;
}) => (
  <View style={styles.variantFormContainer}>
    {Object.entries({
      variantName: { label: 'Variant Name', type: 'text', icon: 'text-outline' },
      variantValue: { label: 'Variant Value', type: 'text', icon: 'information-circle-outline' },
      price: { label: 'Retailer Price', type: 'numeric', icon: 'pricetag-outline' },
      stockQuantity: { label: 'Stock Quantity', type: 'numeric', icon: 'archive-outline' },
    }).map(([key, { label, type, icon }]) => (
      <View key={key} style={styles.inputContainer}>
        <Ionicons  size={20} color="#666" style={styles.inputIcon} />
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>{label}</Text>
          <TextInput
            style={styles.formInput}
            placeholder={`Enter ${label.toLowerCase()}`}
            value={String(variantData[key as keyof Variant] || '')}
            onChangeText={(text) => setVariantData({
              ...variantData,
              [key]: type === 'numeric' ? Number(text) : text
            })}
            keyboardType={type === 'numeric' ? 'numeric' : 'default'}
            placeholderTextColor="#999"
          />
        </View>
      </View>
    ))}
    <TouchableOpacity 
      style={styles.submitButton}
      onPress={onSubmit}
      activeOpacity={0.8}
    >
      <Ionicons name="add-circle-outline" size={20} color="#fff" />
      <Text style={styles.submitButtonText}>Add Variant</Text>
    </TouchableOpacity>
  </View>
));

// Enhanced product item
const ProductItem = memo(({ 
  item, 
  onPress, 
  onEdit, 
  onDelete, 
  onAddVariant 
}: { 
  item: Product;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddVariant: () => void;
}) => (
  <View style={styles.productCard}>
    <TouchableOpacity 
      onPress={onPress}
      style={styles.productContent}
      activeOpacity={0.7}
    >
      <View style={styles.productHeader}>
        <Text style={styles.productTitle}>{item.name}</Text>
        <View style={styles.stockBadge}>
          <Text style={styles.stockText}>
            Stock: {item.inventoryCount}
          </Text>
        </View>
      </View>
      
      <View style={styles.priceContainer}>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>MRP</Text>
          <Text style={styles.priceAmount}>₹{item.mrp}</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Retailer</Text>
          <Text style={styles.priceAmount}>₹{item.retailerPrice}</Text>
        </View>
        <View style={styles.priceColumn}>
          <Text style={styles.priceLabel}>Distributor</Text>
          <Text style={styles.priceAmount}>₹{item.distributorPrice}</Text>
        </View>
      </View>

      <Text style={styles.variantCount}>
        {item.variants.length} variant{item.variants.length !== 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>

    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton]}
        onPress={onEdit}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Edit</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.variantButton]}
        onPress={onAddVariant}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Add Variant</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.actionButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
));

const ProductList = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [variantModalVisible, setVariantModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [variantData, setVariantData] = useState<Partial<Variant>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Enhanced API calls
  const fetchProducts = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/get-products`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(response.data);
      setFilteredProducts(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Search functionality
  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products]);

  // Enhanced handlers
  const handleDelete = useCallback(async (id: number) => {
    Alert.alert(
      "Delete Product",
      "This action cannot be undone. Are you sure?",
      [
        { 
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const token = await AsyncStorage.getItem('token');
              await axios.delete(
                `${process.env.EXPO_PUBLIC_API_URL}/admin/product/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              await fetchProducts();
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  }, [fetchProducts]);

  const handleEditSubmit = useCallback(async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const updatedFields = Object.entries(formData).reduce((acc, [key, value]) => {
        if (value !== selectedProduct[key as keyof Product]) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      if (Object.keys(updatedFields).length === 0) {
        Alert.alert('No Changes', 'No changes were made to the product.');
        return;
      }

      await axios.put(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/product/${selectedProduct.id}`,
        updatedFields,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchProducts();
      Alert.alert('Success', 'Product updated successfully');
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, formData, fetchProducts]);

  const handleAddVariantSubmit = useCallback(async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/products/${selectedProduct.id}/variants`,
        { variants: [variantData] },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchProducts();
      Alert.alert('Success', 'Variant added successfully');
      setVariantModalVisible(false);
      setVariantData({});
    } catch (error) {
      Alert.alert('Error', 'Failed to add variant. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, variantData, fetchProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  // Enhanced render item
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductItem
      item={item}
      onPress={() => {
        setSelectedProduct(item);
        setEditMode(false);
        setModalVisible(true);
      }}
      onEdit={() => {
        setSelectedProduct(item);
        setFormData(item);
        setEditMode(true);
        setModalVisible(true);
      }}
      onDelete={() => handleDelete(item.id)}
      onAddVariant={() => {
        setSelectedProduct(item);
        setVariantModalVisible(true);
      }}
    />
  ), [handleDelete]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/admin/dashboard')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Products</Text>
      </View>

      <SearchBar onSearch={handleSearch} />

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No products found' : 'No products added yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Tap the + button to add products'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
            />
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Edit Product' : 'Product Details'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              editMode ? (
                <EditForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleEditSubmit}
                />
              ) : (
                selectedProduct && <ProductDetails product={selectedProduct} />
              )
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={variantModalVisible}
        onRequestClose={() => setVariantModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Variant</Text>
              <TouchableOpacity 
                onPress={() => setVariantModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <VariantForm
                variantData={variantData}
                setVariantData={setVariantData}
                onSubmit={handleAddVariantSubmit}
              />
            )}
          </View>
        </View>
      </Modal>
      <TouchableOpacity
          onPress={() => router.replace("/(app)/admin/create-product")}
          style={styles.addButton}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  addButton: {
    margin:10,
    backgroundColor: '#9b86ec',
    borderRadius: 20,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    flexDirection: 'row',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: 'hidden',
  },
  productContent: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  stockBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceColumn: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  variantCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  variantButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  detailsContainer: {
    padding: 16,
  },
  detailsHeader: {
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  inventorySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  inventoryText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  variantsSection: {
    marginBottom: 16,
  },
  variantItem: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  variantValue: {
    fontSize: 16,
    color: '#666',
  },
  variantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  variantPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  variantStock: {
    fontSize: 14,
    color: '#666',
  },
  editFormContainer: {
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  variantFormContainer: {
    padding: 16,
  },
});

export default memo(ProductList);
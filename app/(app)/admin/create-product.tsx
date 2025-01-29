import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Interfaces moved to separate types file for better organization
interface DataToSend {
  name: string;
  distributorPrice: string;
  retailerPrice: string;
  mrp: string;
  categoryId: string;
  inventoryCount: string;
  image: string | null;
}
interface RenderInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void; // Function that takes a string and returns void
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'ascii-capable' | 'numbers-and-punctuation' | 'url' | 'decimal-pad' | 'twitter' | 'web-search' | 'visible-password'; // Add other types as needed
  required?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Variant {
  variantName: string;
  variantValue: string;
  price: number;
  stockQuantity: number;
}

const INITIAL_VARIANT = {
  variantName: '',
  variantValue: '',
  price: 0,
  stockQuantity: 0,
};

const CreateProductForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    distributorPrice: '',
    retailerPrice: '',
    mrp: '',
    categoryId: '',
    inventoryCount: '',
    variants: [] as Variant[],
  });

  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newVariant, setNewVariant] = useState<Variant>(INITIAL_VARIANT);
  const [imageUploading, setImageUploading] = useState(false);

  // Memoized validation check
  const isFormValid = useMemo(() => {
    return (
      formData.name.trim() &&
      formData.distributorPrice &&
      formData.retailerPrice &&
      formData.mrp &&
      formData.categoryId &&
      formData.inventoryCount
    );
  }, [formData]);

  // Fetch categories using useCallback
  const fetchCategories = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/get-categories`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories(response.data);
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch categories. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleImageSelection = useCallback(async () => {
    try {
      setImageUploading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library access to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }
  
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formDataToSend = new FormData();
  
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'variants') {
          // Only append variants if there are any
          if (formData.variants.length > 0) {
            formDataToSend.append('variants', JSON.stringify(formData.variants));
          }
        } else {
          formDataToSend.append(key, value.toString());
        }
      });
  
      // Handle image
      if (image) {
        const imageFileName = image.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(imageFileName);
        const imageType = match ? `image/${match[1]}` : 'image/jpeg';
  
        formDataToSend.append('image', {
          uri: image,
          name: imageFileName,
          type: imageType,
        } as any);
      }
  
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/admin/create-product`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      Alert.alert('Success', 'Product created successfully!');
      router.replace('/(app)/admin/dashboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to create product. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateCategory = async () => {
    const token = await AsyncStorage.getItem('token')
    if (!newCategory) {
      Alert.alert('Error', 'Please enter a category name.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/admin/create-category`, {
        name: newCategory,
      },{
        headers:{
          Authorization:`Bearer ${token}`
        }
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Category created successfully!');
        setCategories([...categories, response.data.category]);
        setNewCategory('');
        setShowCategoryModal(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create category. Please try again.');
    }
  };

  const renderInput = useCallback(({ 
    placeholder, 
    value, 
    onChangeText, 
    keyboardType = 'default',
    required = true 
  }: RenderInputProps) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {placeholder} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.input}
        placeholder={`Enter ${placeholder.toLowerCase()}`}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  ), []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.replace('/(app)/admin/dashboard')}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Product</Text>
          </View>

          {/* Form Fields */}
          {renderInput({
            placeholder: 'Product Name',
            value: formData.name,
            onChangeText: (text: string) => handleInputChange('name', text)
          })}
          
          {renderInput({
            placeholder: 'Distributor Price',
            value: formData.distributorPrice,
            onChangeText: (text: string) => handleInputChange('distributorPrice', text),
            keyboardType: 'numeric'
          })}

          {renderInput({
            placeholder: 'Retailer Price',
            value: formData.retailerPrice,
            onChangeText: (text: string) => handleInputChange('retailerPrice', text),
            keyboardType: 'numeric'
          })}

          {renderInput({
            placeholder: 'MRP',
            value: formData.mrp,
            onChangeText: (text: string) => handleInputChange('mrp', text),
            keyboardType: 'numeric'
          })}

          {renderInput({
            placeholder: 'Inventory Count',
            value: formData.inventoryCount,
            onChangeText: (text: string) => handleInputChange('inventoryCount', text),
            keyboardType: 'numeric'
          })}

           {/* Category Picker */}
      <View style={styles.pickerContainer}>
        <Text style={styles.inputLabel}>Category <Text style={styles.required}>*</Text></Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={formData.categoryId}
            onValueChange={(itemValue) => handleInputChange('categoryId', itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Select Category" value="" />
            {categories.map((category) => (
              <Picker.Item
                key={category.id}
                label={category.name}
                value={category.id}
              />
            ))}
          </Picker>
        </View>
      </View>

     {/* Button to open the 'Create New Category' modal */}
     <TouchableOpacity onPress={() => setShowCategoryModal(true)} style={styles.addButton}>
        <Text style={styles.addButtonText}>Create New Category</Text>
      </TouchableOpacity>

      {/* Create New Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Category</Text>
            <TextInput
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="New Category Name"
              style={styles.input}
            />
            <TouchableOpacity onPress={handleCreateCategory} style={styles.categorySubmitButton}>
              <Text style={styles.submitButtonText}>Create Category</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
          {/* Image Section */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Product Image</Text>
            <TouchableOpacity 
              onPress={handleImageSelection}
              style={styles.imageUploadButton}
              disabled={imageUploading}
            >
              {imageUploading ? (
                <ActivityIndicator color="#007AFF" />
              ) : image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="cloud-upload" size={40} color="#9b86ec" />
                  <Text style={styles.uploadText}>Upload Image</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Variants Section */}
          <View style={styles.variantsSection}>
            <Text style={styles.sectionTitle}>Product Variants</Text>
            {formData.variants.map((variant, index) => (
              <View key={index} style={styles.variantCard}>
                <View style={styles.variantInfo}>
                  <Text style={styles.variantName}>{variant.variantName}</Text>
                  <Text style={styles.variantDetails}>
                    Value: {variant.variantValue} | Price: ₹{variant.price} | Stock: {variant.stockQuantity}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newVariants = [...formData.variants];
                    newVariants.splice(index, 1);
                    setFormData(prev => ({ ...prev, variants: newVariants }));
                  }}
                  style={styles.deleteVariant}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setShowVariantModal(true)}
              style={styles.addButton}
            >
              <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Variant</Text>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Product</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <Modal
        visible={showVariantModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Variant</Text>
            {renderInput({
              placeholder: 'Variant Name',
              value: newVariant.variantName,
              onChangeText: (text: string) => setNewVariant(prev => ({ ...prev, variantName: text }))
            })}
            {renderInput({
              placeholder: 'Variant Value',
              value: newVariant.variantValue,
              onChangeText: (text: string) => setNewVariant(prev => ({ ...prev, variantValue: text }))
            })}
            {renderInput({
              placeholder: 'Retailer Price',
              value: newVariant.price.toString(),
              onChangeText: (text: string) => setNewVariant(prev => ({ ...prev, price: parseFloat(text) || 0 })),
              keyboardType: 'numeric'
            })}
            {renderInput({
              placeholder: 'Stock Quantity',
              value: newVariant.stockQuantity.toString(),
              onChangeText: (text: string) => setNewVariant(prev => ({ ...prev, stockQuantity: parseInt(text) || 0 })),
              keyboardType: 'numeric'
            })}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowVariantModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setFormData(prev => ({
                    ...prev,
                    variants: [...prev.variants, newVariant]
                  }));
                  setNewVariant(INITIAL_VARIANT);
                  setShowVariantModal(false);
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Add</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ... Previous code remains the same ...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    color: '#000',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  imageUploadButton: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    height: 200,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#9b86ec',
    marginTop: 8,
    fontSize: 16,
  },
  variantsSection: {
    marginBottom: 24,
  },
  variantCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  variantDetails: {
    fontSize: 14,
    color: '#666',
  },
  deleteVariant: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#007AFF',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#A7A7A7',
  },
  submitButtonText: {
    color: '#FFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#F2F2F7',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Additional shadow styles for cards
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButton: {
    margin: 10,
    padding: 10,
    backgroundColor: '#FF0000', // Change to your preferred color
    borderRadius: 5,
    alignSelf: 'flex-end', // Aligns the button to the right side
  },
  closeButtonText: {
    color: '#ffffff', // Change to your preferred text color
    textAlign: 'center',
  },
  categorySubmitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
    marginTop:40
  },
});

export default CreateProductForm;
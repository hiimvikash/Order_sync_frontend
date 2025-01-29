import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

interface FormData {
  name: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  gpsLocation: string;
}

const CreateShopkeeperForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ownerName: '',
    contactNumber: '',
    email: '',
    gpsLocation: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to proceed.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setFormData(prev => ({
        ...prev,
        gpsLocation: `${location.coords.latitude}, ${location.coords.longitude}`,
      }));
      Alert.alert('Success', 'Location captured successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch location. Please try again.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleImagePicker = async (useCamera: boolean) => {
    const permissionMethod = useCamera 
      ? ImagePicker.requestCameraPermissionsAsync 
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    
    const { granted } = await permissionMethod();
    if (!granted) {
      Alert.alert('Permission Required', `Permission to access ${useCamera ? 'camera' : 'media library'} is required!`);
      return;
    }

    const result = await (useCamera 
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync)({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const { name, ownerName, contactNumber } = formData;
    if (!name || !ownerName || !contactNumber) {
      Alert.alert('Error', 'Please fill out all required fields.');
      return;
    }
    // Check for image
  if (!image) {
    Alert.alert('Error', 'Please select an image of the shopkeeper.');
    return;
  }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) throw new Error('User not found');

      const user = JSON.parse(userStr);
      const formDataToSend = new FormData();

      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('salespersonId', user.id.toString());

      // Append image if exists
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
        `${process.env.EXPO_PUBLIC_API_URL}/salesperson/create-shop`,
        formDataToSend,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.status === 201) {
        Alert.alert('Success', 'Shopkeeper created successfully!');
        router.replace('/salesperson/dashboard');
      }
    } catch (error: any) {
      
      Alert.alert('Phone number Already taken or Server Error :(');
    } finally {
      setLoading(false);
    }
  };

  const renderFormField = (key: keyof FormData, value: string) => {
    if (key === 'gpsLocation') {
      return (
        <TouchableOpacity onPress={fetchLocation} style={styles.textArea}>
          <Text style={{ color: value ? 'black' : '#A9A9A9' }}>
            {value || 'Tap to get GPS Location'}
          </Text>
        </TouchableOpacity>
      );
    }
  
    return (
      <TextInput
        style={styles.textArea}
        placeholder={`Enter ${key === 'name' ? 'ShopName' : key.replace(/([A-Z])/g, ' $1').toLowerCase()}`} // Change placeholder for 'name'
        value={value}
        onChangeText={(text) => handleInputChange(key, text)}
        keyboardType={
          key === 'contactNumber' ? 'phone-pad' 
          : key === 'email' ? 'email-address' 
          : 'default'
        }
      />
    );
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(app)/salesperson/dashboard')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Onboard Shop</Text>
      </View>

      <ScrollView style={styles.formContainer}>
        {(Object.keys(formData) as Array<keyof FormData>).map((key) => (
          <View style={styles.inputCard} key={key}>
            <Text style={styles.label}>
            {key === 'email' ? '' : '*'}
            {key === 'name' 
              ? 'Shop Name' 
              : key === 'gpsLocation' 
              ? 'GPS Location of Shop' 
              : key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            }
          </Text>

            {renderFormField(key, formData[key])}
          </View>
        ))}
          {image &&(
            <Image source={{ uri: image }} style={styles.imagePreview} />
          )}        

{
  !image && (
    <TouchableOpacity onPress={() => handleImagePicker(true)} style={styles.button}>
      <Ionicons name="camera" size={24} color="white" />
      <Text style={styles.buttonText}>FRONT SHOP IMAGE</Text>
    </TouchableOpacity>
  )
}

        {image && (
          <TouchableOpacity onPress={() => setImage(null)} style={styles.clearButton}>
            <Ionicons name="close" size={24} color="white" />
            <Text style={styles.clearButtonText}>Clear Image</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Shop</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    flex: 1,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputCard: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 1,
    height: 60,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 1,
  },
  picker: {
    height: 60,
    width: '100%',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imagePlaceholder: {
    color: '#A9A9A9',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    margin:'auto'

  },
  clearButton: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
    flexDirection: 'row',
  },
  clearButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateShopkeeperForm;
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Shop = {
  id: number;
  name: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  gpsLocation: string;
  imageUrl: string;
  videoUrl: string;
  preferredDeliverySlot: string;
  salesperson?: {
    name: string;  // salesperson is an object with a name property
  };
  createdAt: string;
  updatedAt: string;
};

const { width } = Dimensions.get('window');

const ShopList = () => {
  const router = useRouter();
  const [shopsData, setShopsData] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchShops = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    
    try {
      const token = await AsyncStorage.getItem("token") || "";
      const response = await axios(`${process.env.EXPO_PUBLIC_API_URL}/admin/get-shops`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setShopsData(response.data);
      setFilteredShops(response.data);
    } catch (error) {
      setError('Failed to load shops. Please try again.');
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    const filtered = shopsData.filter(shop => 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredShops(filtered);
  }, [searchQuery, shopsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShops(false);
  }, []);

  const openModal = (shop: Shop) => {
    setSelectedShop(shop);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedShop(null);
  };

  const openInMaps = (gpsLocation: string) => {
    const [latitude, longitude] = gpsLocation.split(',');
    const url = Platform.select({
      ios: `maps:${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    });
    if (url) {
      Linking.openURL(url).catch((err) => console.error('Error opening maps:', err));
    }
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const renderShopItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity 
      onPress={() => openModal(item)} 
      style={styles.card}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.shopImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="business-outline" size={40} color="#999" />
            </View>
          )}
        </View>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.shopDetail} numberOfLines={1}>👤 {item.ownerName}</Text>
          <Text style={styles.shopDetail} numberOfLines={1}>📞 {item.contactNumber}</Text>
          <Text style={styles.shopDetail} numberOfLines={1}>🕒 {item.preferredDeliverySlot}</Text>
        </View>
        <TouchableOpacity style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.replace('/(app)/admin/dashboard')}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>Shops</Text>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search shops or owners..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#999"
      />
      {searchQuery !== '' && (
        <TouchableOpacity
          onPress={() => setSearchQuery('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading shops...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      {renderHeader()}
      {renderSearchBar()}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchShops()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          renderItem={renderShopItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business" size={50} color="#999" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No shops found matching your search' : 'No shops available'}
              </Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            
            {selectedShop && (
              <>
                <Text style={styles.modalTitle}>{selectedShop.name}</Text>
                
                {selectedShop.imageUrl && (
                  <Image 
                    source={{ uri: selectedShop.imageUrl }} 
                    style={styles.shopModalImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.modalDetailsContainer}>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="person" size={20} color="#666" />
                    <Text style={styles.modalDetailText}>{selectedShop.ownerName}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.modalDetailRow}
                    onPress={() => handleCall(selectedShop.contactNumber)}
                  >
                    <Ionicons name="call" size={20} color="#007AFF" />
                    <Text style={[styles.modalDetailText, styles.linkText]}>
                      {selectedShop.contactNumber}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalDetailRow}
                    onPress={() => handleEmail(selectedShop.email)}
                  >
                    <Ionicons name="mail" size={20} color="#007AFF" />
                    <Text style={[styles.modalDetailText, styles.linkText]}>
                      {selectedShop.email}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.modalDetailRow}
                    onPress={() => openInMaps(selectedShop.gpsLocation)}
                  >
                    <Ionicons name="location" size={20} color="#007AFF" />
                    <Text style={[styles.modalDetailText, styles.linkText]}>
                      View Location
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.modalDetailRow}>
                    <Ionicons name="time" size={20} color="#666" />
                    <Text style={styles.modalDetailText}>
                      {selectedShop.preferredDeliverySlot}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Ionicons name="star" size={20} color="#666" />
                    <Text style={styles.modalDetailText}>
                      Onboarded By : {selectedShop.salesperson?.name}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 12,
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
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  shopDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    marginRight: 40,
  },
  shopModalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalDetailsContainer: {
    marginTop: 8,
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalDetailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  linkText: {
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ShopList;
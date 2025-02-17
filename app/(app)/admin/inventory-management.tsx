import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ButtonData {
    label: string;
    description: string;
    action: ButtonAction;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }

  type ButtonAction = 
  | 'modify-product-inventory'
  | 'create-distributor-order'
  | 'view-inventory'
  | 'distributor-order-count'
  | 'export-all';

 const butts : ButtonData[] = [
    {
      label: 'Product Inventory',
      description: 'Modify your product inventory',
      action: 'modify-product-inventory',
      icon: 'logo-docker',
    },

    {
        label: 'View your Inventory',
        description: 'Get your stock count',
        action: 'view-inventory',
        icon: 'layers',
    },
    {
      label: 'Create Distributor Orders',
      description: 'Create order for your distributor directly',
      action: 'create-distributor-order',
      icon: 'train',
    },
    {
      label: 'Distributor Orders Count',
      description: 'Total quantity ordered for the selected product',
      action: 'distributor-order-count',
      icon: 'logo-apple-ar',
    },
    {
      label: 'Export All',
      description: 'Export all your inventory data & orders',
      action: 'export-all',
      icon: 'download',
    }
  ]
  

const InventoryManagement = () => {


      const handleNavigation = (action: ButtonAction) => {
        // Create the route path as a properly typed string literal
        const route = `/(app)/admin/${action}` as const;
        router.replace(route as Href<string>);
      };

      const renderButton = (button: ButtonData) => (
        <TouchableOpacity
          key={button.label}
          style={styles.button}
          activeOpacity={0.7}
          onPress={() => handleNavigation(button.action)}
        >
          <View style={styles.buttonContent}>
            <View style={styles.iconContainer}>
              <Ionicons name={button.icon} size={24} color="#9B86EC" />
              {button.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{button.badge}</Text>
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.buttonText}>{button.label}</Text>
              <Text style={styles.description}>{button.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#9B86EC" />
          </View>
        </TouchableOpacity>
      );
    return (
        <SafeAreaView style={styles.container}>
              <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />
              <View style={styles.header}>
                          <TouchableOpacity
                            onPress={() => router.replace('/(app)/admin/dashboard')}
                            style={styles.backButton}
                          >
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                          </TouchableOpacity>
                          <Text style={styles.title}>Manage your Inventory</Text>
                </View>
                  <View style={styles.buttonGrid}>
                    {butts.map(renderButton)}
                  </View>
        </SafeAreaView>
    );
};



export default InventoryManagement;









const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  scrollContent: {
    paddingBottom: 24,
  },
  welcomeContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 16,
    marginTop: 50,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subText: {
    fontSize: 16,
    color: '#666',
  },
  category: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  buttonGrid: {
    gap: 12,
  },
  button: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      paddingTop:  20,
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
});
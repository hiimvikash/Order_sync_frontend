import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { Logout } from '@/components/Logout';
import { router, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ButtonAction = 
  | 'create-distributor'
  | 'create-salesperson'
  | 'create-product'
  | 'view-orders'
  | 'view-distributor'
  | 'view-products'
  | 'view-salespersons'
  | 'view-shops';

interface ButtonData {
  label: string;
  description: string;
  action: ButtonAction;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

interface CategoryData {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  buttons: ButtonData[];
}

// Group buttons by category
const buttonCategories: CategoryData[] = [
  {
    title: 'Create',
    icon: 'add-circle',
    buttons: [
      {
        label: 'New Distributor',
        description: 'Create a new distributor profile',
        action: 'create-distributor',
        icon: 'business',
      },
      {
        label: 'New Salesman',
        description: 'Create a new salesman profile',
        action: 'create-salesperson',
        icon: 'person-add',
      },
      {
        label: 'New Product',
        description: 'Add a new product to inventory',
        action: 'create-product',
        icon: 'cube',
      },
    ],
  },
  {
    title: 'View & Manage',
    icon: 'list',
    buttons: [
      {
        label: 'Orders',
        description: 'View and manage all orders',
        action: 'view-orders',
        icon: 'cart',
      },
      {
        label: 'Distributors',
        description: 'Manage distributor profiles',
        action: 'view-distributor',
        icon: 'business',
      },
      {
        label: 'Products',
        description: 'View and edit product inventory',
        action: 'view-products',
        icon: 'cube',
      },
      {
        label: 'Salesmen',
        description: 'Manage salesman profiles',
        action: 'view-salespersons',
        icon: 'people',
      },
      {
        label: 'Shops',
        description: 'View all registered shops',
        action: 'view-shops',
        icon: 'storefront',
      },
    ],
  },
];

export const AdminDashboard = () => {
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

  const renderCategory = (category: CategoryData) => (
    <View key={category.title} style={styles.category}>
      <View style={styles.categoryHeader}>
        <Ionicons name={category.icon} size={24} color="#9B86EC" />
        <Text style={styles.categoryTitle}>{category.title}</Text>
      </View>
      <View style={styles.buttonGrid}>
        {category.buttons.map(renderButton)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F5F5F5" barStyle="dark-content" />

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back, Admin!</Text>
          <Text style={styles.subText}>What would you like to do today?</Text>
        </View>

        {buttonCategories.map(renderCategory)}
        <Logout />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
});

export default AdminDashboard;
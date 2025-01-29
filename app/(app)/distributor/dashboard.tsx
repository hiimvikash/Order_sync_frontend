import { Logout } from '@/components/Logout';
import { router, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  View,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const DistributorDashboard = () => {
  const [loading, setLoading] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current; // Set initial opacity to 1

  // Animation effect when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fadeAnim.setValue(0); // Start animation from 0
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      return () => {
        fadeAnim.setValue(1); // Reset to visible when unmounted
      };
    }, [fadeAnim])
  );

  const handleButtonClick = async (action: any) => {
    if (action === 'viewOrders') {
        router.replace('/(app)/distributor/order'); // Replace with the correct path to the Create Salesman screen
    }
  };

  const renderButton = (button: { action: React.Key | null | undefined; icon: string | undefined; label: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; description: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => {
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        key={button.action}
        style={[
          styles.buttonWrapper,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleButtonClick(button.action)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
        >
          <MaterialIcons name={button.icon as any} size={32} color="#6B4EE6" />
          <Text style={styles.buttonText}>{button.label}</Text>
          <Text style={styles.description}>{button.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerRight: () => <Logout />,
          headerStyle: {
            backgroundColor: '#6B4EE6',
          },
          headerTintColor: '#FFFFFF',
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6B4EE6" />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back, Distributor!</Text>
          <Text style={styles.subText}>What would you like to do today?</Text>
        </View>

        <View style={styles.buttonContainer}>
          {buttonData.map(renderButton)}
        </View>
        <Logout/>
      </ScrollView>
    </SafeAreaView>
  );
};

// Button data
const buttonData = [
  { label: 'View Orders', description: 'View all orders', action: 'viewOrders', icon: 'visibility' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  buttonContainer: {
    padding: 15,
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginVertical: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default DistributorDashboard;


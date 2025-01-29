import { Image } from 'expo-image';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export const HomeScreen = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
  <View style={styles.backgroundImageContainer}>
    <Image
      source={require("@/assets/images/Graphic_Elements.svg")}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
    />
    {/* Dark Overlay */}
    <View style={styles.darkOverlay} />
  </View>

  {/* Subtitle */}
  <Text style={styles.subtitle}>ऑर्डर ट्रैकिंग को स्वचालित करना शुरू करें</Text>

  {/* Login Button */}
  <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
    <Text style={styles.loginButtonText}>Start</Text>
  </TouchableOpacity>
</SafeAreaView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fallback background color
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 180,
  },
  backgroundImageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark overlay with 60% opacity
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#D6F171', // Light green background color
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 10,
  },
  loginButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
});


export default HomeScreen;

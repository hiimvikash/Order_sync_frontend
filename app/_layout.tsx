import { AuthProvider, useAuth } from "@/context/authContext";
import { Slot, useRouter, useSegments, Href } from "expo-router";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";

// Define valid role types
type UserRole = "ADMIN" | "SALESPERSON" | "DISTRIBUTOR";

// Define route mapping with proper types using Href
const roleRoutes: Record<UserRole, Href<string>> = {
  "ADMIN": "/(app)/admin/dashboard" as Href<string>,
  "SALESPERSON": "/(app)/salesperson/dashboard" as Href<string>,
  "DISTRIBUTOR": "/(app)/distributor/dashboard" as Href<string>
};

// Define auth routes
const authRoutes = {
  login: "/(auth)/login" as Href<string>,
  index : "/" as Href<string>
};

// Helper function to check if a string is a valid role
const isValidRole = (role: string): role is UserRole => {
  return Object.keys(roleRoutes).includes(role);
};

// Helper function to determine if we're in an auth group
const useProtectedRoute = (user: { role: string } | null) => {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!segments) return;

    const inAuthGroup = segments[0] === "(auth)";
    
    // Use setTimeout to ensure navigation happens after layout is mounted
    setTimeout(() => {
      if (!user && !inAuthGroup) {
        router.replace(authRoutes.index);
      } else if (user && isValidRole(user.role)) {
        const targetRoute = roleRoutes[user.role];
        if (targetRoute && inAuthGroup) {
          router.replace(targetRoute);
        }
      }
    }, 0);
  }, [user, segments]);
};

const InitialLayout = () => {
  const { isLoading, user } = useAuth();
  useProtectedRoute(user);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#9B86EC" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
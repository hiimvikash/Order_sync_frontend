import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
} from 'react-native';
import { styles } from '../styles/styles';
import { ScrollView } from 'react-native-virtualized-view'
interface OrderItem {
    productName: string;
    quantity: number;
    price: number;
    productId: number;
    variantId: number;
}
export const OrderItemsList = React.memo(({ items }: { items: OrderItem[] }) => (
    <ScrollView style={styles.orderDetails}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {items.map((item, index) => (
            <View key={index} style={styles.itemContainer}>
                <Text style={styles.itemText}>Product: {item.productName}</Text>
                <View style={styles.itemDetails}>
                    <Text style={styles.itemText}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemText}>₹{item.price}</Text>
                    <Text style={styles.itemTotal}>₹{(item.quantity * item.price).toLocaleString()}</Text>
                </View>
            </View>
        ))}
    </ScrollView>
));
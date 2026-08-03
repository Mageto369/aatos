import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { rfqApi, RFQ } from '../services/api';

export function RFQScreen() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRFQs = async () => {
    try {
      const response = await rfqApi.getAll();
      setRfqs(response.data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRFQs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadRFQs();
  };

  const renderRFQ = ({ item }: { item: RFQ }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.productName}</Text>
        <View style={[styles.badge, styles[`badge${item.status}`]]}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.details}>
        {item.quantity} {item.unit} · {item.targetPrice} {item.currency}
      </Text>
      <Text style={styles.destination}>Destination: {item.destination}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rfqs}
        renderItem={renderRFQ}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No RFQs yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeopen: {
    backgroundColor: '#E3F2FD',
  },
  badgequoted: {
    backgroundColor: '#FFF3E0',
  },
  badgeclosed: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  destination: {
    fontSize: 14,
    color: '#999',
  },
  empty: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

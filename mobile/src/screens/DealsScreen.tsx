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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { dealsApi, Deal } from '../services/api';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export function DealsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeals = async () => {
    try {
      const response = await dealsApi.getAll();
      setDeals(response.data);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeals();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'in_progress':
        return '#2E7D32';
      case 'pending':
        return '#F9A825';
      case 'completed':
        return '#1565C0';
      case 'disputed':
        return '#C62828';
      default:
        return '#666';
    }
  };

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DealDetail', { dealId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.productName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.value}>
        {item.totalValue.toLocaleString()} {item.currency}
      </Text>
      <Text style={styles.parties}>
        {item.buyerOrgName} ← {item.supplierOrgName}
      </Text>
      <View style={styles.milestoneBar}>
        {item.milestones.map((m, i) => (
          <View
            key={m.id}
            style={[
              styles.milestoneDot,
              { backgroundColor: m.status === 'completed' ? '#2E7D32' : '#ddd' },
            ]}
          />
        ))}
      </View>
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
        data={deals}
        renderItem={renderDeal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No deals yet</Text>
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  parties: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  milestoneBar: {
    flexDirection: 'row',
    gap: 8,
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    flex: 1,
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

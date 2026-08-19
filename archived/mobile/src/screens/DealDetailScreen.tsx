import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/RootNavigator';
import { dealsApi, Deal } from '../services/api';

type DealDetailRouteProp = RouteProp<RootStackParamList, 'DealDetail'>;

export function DealDetailScreen() {
  const route = useRoute<DealDetailRouteProp>();
  const { dealId } = route.params;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDeal = async () => {
    try {
      const response = await dealsApi.getById(dealId);
      setDeal(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load deal details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeal();
  }, [dealId]);

  const updateMilestone = async (milestoneId: string, status: string) => {
    try {
      await dealsApi.updateMilestone(dealId, milestoneId, status);
      loadDeal();
    } catch (error) {
      Alert.alert('Error', 'Failed to update milestone');
    }
  };

  if (loading || !deal) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{deal.productName}</Text>
        <Text style={styles.value}>
          {deal.totalValue.toLocaleString()} {deal.currency}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parties</Text>
        <Text style={styles.label}>Buyer</Text>
        <Text style={styles.valueText}>{deal.buyerOrgName}</Text>
        <Text style={styles.label}>Supplier</Text>
        <Text style={styles.valueText}>{deal.supplierOrgName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Milestones</Text>
        {deal.milestones.map((milestone) => (
          <View key={milestone.id} style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneName}>{milestone.name}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: milestone.status === 'completed' ? '#E8F5E9' : '#FFF3E0' }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: milestone.status === 'completed' ? '#2E7D32' : '#F9A825' }
                ]}>
                  {milestone.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.dueDate}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</Text>
            {milestone.status !== 'completed' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => updateMilestone(milestone.id, 'completed')}
              >
                <Text style={styles.actionButtonText}>Mark Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2E7D32',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '500',
  },
  milestoneCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestoneName: {
    fontSize: 16,
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
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

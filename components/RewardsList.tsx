import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getUserRewards, redeemReward, UserReward } from '@/lib/progress';
import { Gift, Unlock, Template, Badge, Palette, Clock, Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface RewardsListProps {
  filter?: 'all' | 'available' | 'redeemed';
  onSelect?: (reward: UserReward) => void;
  onRedeem?: (reward: UserReward) => void;
}

export default function RewardsList({ filter = 'all', onSelect, onRedeem }: RewardsListProps) {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    loadRewards();
  }, [filter]);

  const loadRewards = async () => {
    try {
      setLoading(true);
      const data = await getUserRewards();
      
      // Filter rewards based on the filter prop
      let filteredData = data;
      if (filter === 'available') {
        filteredData = data.filter(r => !r.redeemed);
      } else if (filter === 'redeemed') {
        filteredData = data.filter(r => r.redeemed);
      }
      
      setRewards(filteredData);
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (reward: UserReward) => {
    if (reward.redeemed) return;
    
    try {
      setRedeeming(reward.id);
      await redeemReward(reward.id);
      
      // Update the local state
      setRewards(prev => 
        prev.map(r => 
          r.id === reward.id ? { ...r, redeemed: true, redeemed_at: new Date().toISOString() } : r
        )
      );
      
      // Call the onRedeem callback if provided
      if (onRedeem) {
        onRedeem(reward);
      }
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setError('Failed to redeem reward');
    } finally {
      setRedeeming(null);
    }
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'recipe':
        return <Unlock size={24} color="#2A9D8F" />;
      case 'planning':
        return <Template size={24} color="#2A9D8F" />;
      case 'profile':
        return <Badge size={24} color="#2A9D8F" />;
      case 'customization':
        return <Palette size={24} color="#2A9D8F" />;
      case 'tool':
        return <Clock size={24} color="#2A9D8F" />;
      default:
        return <Gift size={24} color="#2A9D8F" />;
    }
  };

  const renderReward = ({ item, index }: { item: UserReward, index: number }) => {
    const isRedeeming = redeeming === item.id;
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 100)}>
        <TouchableOpacity
          style={[styles.rewardCard, item.redeemed && styles.redeemedCard]}
          onPress={() => onSelect && onSelect(item)}
          activeOpacity={0.7}
          disabled={isRedeeming}
        >
          <View style={[styles.rewardIcon, item.redeemed && styles.redeemedIcon]}>
            {getIconForCategory(item.reward_type?.category || '')}
          </View>
          <View style={styles.rewardContent}>
            <Text style={styles.rewardTitle}>{item.reward_type?.name}</Text>
            <Text style={styles.rewardDescription}>{item.reward_type?.description}</Text>
            {item.redeemed && (
              <View style={styles.redeemedBadge}>
                <Check size={12} color="#FFFFFF" />
                <Text style={styles.redeemedText}>Redeemed</Text>
              </View>
            )}
          </View>
          {!item.redeemed && (
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={() => handleRedeem(item)}
              disabled={isRedeeming}
            >
              {isRedeeming ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.redeemText}>Redeem</Text>
              )}
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2A9D8F" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRewards}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (rewards.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Gift size={48} color="#ADB5BD" />
        <Text style={styles.emptyTitle}>No rewards yet</Text>
        <Text style={styles.emptyText}>
          {filter === 'available' 
            ? 'Complete achievements to earn rewards' 
            : filter === 'redeemed' 
              ? 'Redeem rewards to see them here'
              : 'Complete achievements to earn rewards'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rewards}
      renderItem={renderReward}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  redeemedCard: {
    backgroundColor: '#F8F9FA',
  },
  rewardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F3F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  redeemedIcon: {
    backgroundColor: '#F0F0F0',
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#264653',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6C757D',
  },
  redeemButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  redeemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  redeemedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ADB5BD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  redeemedText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6C757D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#E76F51',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#264653',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    maxWidth: 300,
  },
});

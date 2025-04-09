import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { X, ShoppingBag, ExternalLink } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface InstacartModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<string | undefined>;
  isLoading: boolean;
}

export function InstacartModal({ visible, onClose, onConfirm, isLoading }: InstacartModalProps) {
  const [instacartUrl, setInstacartUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      const url = await onConfirm();
      setInstacartUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create shopping list');
    }
  };

  const openInstacart = () => {
    if (instacartUrl) {
      console.log('Opening Instacart URL:', instacartUrl);
      Linking.openURL(instacartUrl)
        .then(() => {
          console.log('Successfully opened Instacart URL');
          onClose();
        })
        .catch(err => {
          console.error('Error opening Instacart URL:', err);
          setError(`Failed to open Instacart: ${err.message}`);
        });
    } else {
      console.error('No Instacart URL available');
      setError('No Instacart URL available');
    }
  };

  const resetModal = () => {
    setInstacartUrl(undefined);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={resetModal}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {instacartUrl ? 'Shopping List Created!' : 'Add to Instacart'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={resetModal}
            >
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleConfirm}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : instacartUrl ? (
              <View style={styles.successContainer}>
                <ShoppingBag size={48} color="#2A9D8F" />
                <Text style={styles.successText}>
                  Your shopping list has been created in Instacart! Click below to complete your order.
                </Text>
                <View style={styles.instacartInfo}>
                  <ShoppingBag size={20} color="#FF8200" />
                  <Text style={styles.instacartText}>You'll be redirected to Instacart to review and checkout</Text>
                </View>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.orderButton}
                    onPress={openInstacart}
                  >
                    <Text style={styles.orderButtonText}>Go to Instacart Checkout</Text>
                    <ExternalLink size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={resetModal}
                  >
                    <Text style={styles.viewButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.confirmContainer}>
                <ShoppingBag size={48} color="#2A9D8F" />
                <Text style={styles.confirmText}>
                  We'll create a shopping list with all ingredients from your meal plan and send it directly to Instacart.
                </Text>
                <View style={styles.instacartInfo}>
                  <ShoppingBag size={20} color="#FF8200" />
                  <Text style={styles.instacartText}>Your ingredients will be added to your Instacart cart automatically</Text>
                </View>
                <Text style={styles.confirmSubtext}>
                  You'll be able to review and edit the items before completing your order on Instacart.
                </Text>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Create Order</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  confirmContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: '#2A9D8F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  instacartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  instacartText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  orderButton: {
    backgroundColor: '#2A9D8F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  viewButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E76F51',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2A9D8F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

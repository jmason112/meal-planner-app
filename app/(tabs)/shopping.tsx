import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { ShoppingBag, Check, Trash2, ExternalLink, Trash, AlertCircle } from 'lucide-react-native';
import { getShoppingList, ShoppingItem, removeFromShoppingList, clearShoppingList, toggleItemChecked as toggleItemCheckedApi } from '@/lib/shopping';
import { createShoppingList, ShoppingListEntry } from '@/lib/edamam';
import { InstacartModal } from '@/components/InstacartModal';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

interface GroupedItems {
  [key: string]: ShoppingItem[];
}

export default function Shopping() {
  const navigation = useNavigation();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInstacartModal, setShowInstacartModal] = useState(false);
  const [showClearAllConfirmation, setShowClearAllConfirmation] = useState(false);
  const [isCreatingShoppingList, setIsCreatingShoppingList] = useState(false);

  useEffect(() => {
    loadShoppingList();

    // Set up a focus listener to refresh the shopping list when the tab is focused
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Shopping tab focused, refreshing shopping list');
      loadShoppingList();
    });

    return unsubscribe;
  }, [navigation]);

  const loadShoppingList = async () => {
    try {
      console.log('Loading shopping list...');
      const list = await getShoppingList();
      console.log('Shopping list loaded with', list.length, 'items');

      if (list.length > 0) {
        console.log('Sample item:', JSON.stringify(list[0], null, 2));
      }

      setItems(list);
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.recipe]) {
      acc[item.recipe] = [];
    }
    acc[item.recipe].push(item);
    return acc;
  }, {} as GroupedItems);

  const toggleItemCheck = async (id: string) => {
    try {
      // Call the Supabase function to toggle the item
      await toggleItemCheckedApi(id);
      // Refresh the list
      loadShoppingList();
    } catch (error) {
      console.error('Error toggling item checked status:', error);
    }
  };

  const clearCheckedItems = async () => {
    try {
      // Get IDs of checked items
      const checkedItemIds = items.filter(item => item.checked).map(item => item.id);

      if (checkedItemIds.length > 0) {
        // Remove checked items from the database
        await removeFromShoppingList(checkedItemIds);
        // Refresh the list
        loadShoppingList();
      }
    } catch (error) {
      console.error('Error clearing checked items:', error);
    }
  };

  const showClearAllDialog = () => {
    setShowClearAllConfirmation(true);
  };

  const clearAllItems = async () => {
    try {
      // Clear all items from the database
      await clearShoppingList();
      // Refresh the list
      setItems([]);
      setShowClearAllConfirmation(false);
    } catch (error) {
      console.error('Error clearing all items:', error);
    }
  };

  const handleAddToInstacart = () => {
    setShowInstacartModal(true);
  };

  const createInstacartList = async (): Promise<{ url?: string; sentItems?: ShoppingItem[] }> => {
    if (!items || items.length === 0) {
      throw new Error('No items found in your shopping list');
    }

    try {
      setIsCreatingShoppingList(true);

      // Filter items that have recipe IDs and are not checked
      const itemsWithRecipeIds = items.filter(item => !item.checked && item.recipe_id);
      console.log('Items with recipe IDs:', itemsWithRecipeIds.length);

      if (itemsWithRecipeIds.length === 0) {
        throw new Error('No recipe items found in your shopping list');
      }

      // Get unique recipe IDs
      const recipeIds = [...new Set(
        itemsWithRecipeIds.map(item => item.recipe_id)
      )] as string[];

      console.log('Unique recipe IDs:', recipeIds);

      // Create entries for the shopping list API
      const entries: ShoppingListEntry[] = recipeIds.map(recipeId => {
        // Extract the recipe ID, removing any 'recipe_' prefix if present
        const recipeIdClean = recipeId.replace(/^recipe_/, '');

        return {
          quantity: 1, // Default to 1 serving
          measure: 'http://www.edamam.com/ontologies/edamam.owl#Measure_serving',
          recipe: `http://www.edamam.com/ontologies/edamam.owl#recipe_${recipeIdClean}`
        };
      });

      // Call the API to create a shopping list
      const response = await createShoppingList(entries);

      // Get the shopping cart URL from the response
      const cartUrl = response.shoppingCartUrl ||
                     (response._links?.['shopping-cart']?.href);

      if (!cartUrl) {
        console.warn('No shopping cart URL found in the response');
      }

      // Return both the URL and the items that were sent
      return {
        url: cartUrl,
        sentItems: itemsWithRecipeIds
      };
    } catch (error) {
      console.error('Error creating Instacart shopping list:', error);
      throw error;
    } finally {
      setIsCreatingShoppingList(false);
    }
  };

  const markItemsAsChecked = async (itemIds: string[]) => {
    try {
      console.log('Marking items as checked:', itemIds.length);

      // Mark each item as checked
      for (const id of itemIds) {
        await toggleItemCheckedApi(id);
      }

      // Refresh the shopping list
      await loadShoppingList();

      console.log('Successfully marked items as checked');
    } catch (error) {
      console.error('Error marking items as checked:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading shopping list...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeInDown.delay(200)}
        style={styles.header}
      >
        <Text style={styles.title}>Shopping List</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={clearCheckedItems}
            accessibilityLabel="Clear checked items"
          >
            <Trash2 size={20} color="#2A9D8F" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: '#FEE2E2' }]}
            onPress={showClearAllDialog}
            accessibilityLabel="Clear all items"
          >
            <Trash size={20} color="#E76F51" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleAddToInstacart}
            accessibilityLabel="Order from Instacart"
          >
            <ExternalLink size={20} color="#2A9D8F" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag size={48} color="#2A9D8F" />
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptyText}>
            Add ingredients from recipes to start your shopping list
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {Object.entries(groupedItems).map(([recipeName, recipeItems], index) => (
            <Animated.View
              key={recipeName}
              entering={FadeInDown.delay(300 + index * 100)}

            >
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeName}>{recipeName}</Text>
                <Text style={styles.recipeCount}>
                  {recipeItems.filter(item => !item.checked).length} items remaining
                </Text>
              </View>

              {recipeItems.map((item) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInRight}

                >
                  <TouchableOpacity
                    style={[
                      styles.itemCard,
                      item.checked && styles.itemCardChecked
                    ]}
                    onPress={() => toggleItemCheck(item.id)}
                  >
                    <View style={styles.itemMain}>
                      <View style={[
                        styles.checkbox,
                        item.checked && styles.checkboxChecked
                      ]}>
                        {item.checked && <Check size={16} color="#fff" />}
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={[
                          styles.itemName,
                          item.checked && styles.itemNameChecked
                        ]}>
                          {item.name}
                        </Text>
                        {item.quantity ? (
                          <Text style={styles.itemQuantity}>
                            {item.quantity}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          ))}
        </ScrollView>
      )}

      {items.length > 0 && (
        <TouchableOpacity
          style={styles.groceryButton}
          onPress={handleAddToInstacart}
        >
          <Text style={styles.groceryButtonText}>Order from Instacart</Text>
          <ExternalLink size={20} color="#fff" />
        </TouchableOpacity>
      )}

      <InstacartModal
        visible={showInstacartModal}
        onClose={() => setShowInstacartModal(false)}
        onConfirm={createInstacartList}
        onMarkItemsAsChecked={markItemsAsChecked}
        shoppingItems={items.filter(item => !item.checked)}
        isLoading={isCreatingShoppingList}
      />

      <ConfirmationDialog
        visible={showClearAllConfirmation}
        title="Clear Shopping List"
        message="Are you sure you want to clear all items from your shopping list? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        onConfirm={clearAllItems}
        onCancel={() => setShowClearAllConfirmation(false)}
        destructive={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  recipeHeader: {
    marginBottom: 16,
    marginTop: 24,
  },
  recipeName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 4,
  },
  recipeCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemCardChecked: {
    backgroundColor: '#F8F9FA',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2A9D8F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#2A9D8F',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
    marginBottom: 4,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  itemQuantity: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666',
  },
  groceryButton: {
    margin: 24,
    backgroundColor: '#2A9D8F',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  groceryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },

});


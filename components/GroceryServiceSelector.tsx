import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { generateInstacartUrl, createShoppingList, ShoppingListEntry } from '@/lib/edamam';
import { ShoppingItem, addToShoppingList } from '@/lib/shopping';
import { Linking } from 'react-native';
import { AlertCircle, X } from 'lucide-react-native';

interface Props {
  ingredients: string[];
  shoppingItems?: ShoppingItem[];
  onClose: () => void;
}

const SERVICES = [
  {
    id: 'instacart',
    name: 'Instacart',
    logo: '🥕',
    description: 'Order ingredients directly from Instacart',
    generateUrl: generateInstacartUrl,
    useEdamamIds: true,
    useEdamamApi: true, // Flag to use Edamam API for Instacart
  },
];

export function GroceryServiceSelector({ ingredients, shoppingItems, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleServiceSelect = async (service: typeof SERVICES[0]) => {
    try {
      console.log('Selected service:', service.id);
      console.log('Shopping items available:', shoppingItems?.length || 0);

      // For Instacart with recipe IDs
      if (service.useEdamamApi && service.id === 'instacart' && shoppingItems && shoppingItems.length > 0) {
        // Show loading state
        setLoading(true);
        setError(null);

        try {
          // Get unique recipe IDs from shopping items
          const itemsWithRecipeIds = shoppingItems.filter(item => item.recipe_id);
          console.log('Items with recipe IDs:', itemsWithRecipeIds.length);

          const recipeIds = [...new Set(
            itemsWithRecipeIds.map(item => item.recipe_id)
          )] as string[];

          console.log('Unique recipe IDs:', recipeIds);

          if (recipeIds.length > 0) {
            // Create entries for the shopping list API
            const entries: ShoppingListEntry[] = recipeIds.map(recipeId => ({
              quantity: 1, // Default to 1 serving
              measure: 'http://www.edamam.com/ontologies/edamam.owl#Measure_serving',
              recipe: `http://www.edamam.com/ontologies/edamam.owl#recipe_${recipeId.replace('recipe_', '')}`
            }));

            // Call the API to create a shopping list
            const response = await createShoppingList(entries);

            // Get the shopping cart URL from the response
            const cartUrl = response.shoppingCartUrl ||
                           (response._links?.['shopping-cart']?.href);

            if (cartUrl) {
              // Add items to the local shopping list
              if (shoppingItems && shoppingItems.length > 0) {
                try {
                  console.log('Adding items to local shopping list');
                  await addToShoppingList(shoppingItems);
                  console.log('Successfully added items to local shopping list');
                } catch (err) {
                  console.error('Error adding items to local shopping list:', err);
                }
              }

              setLoading(false);
              await Linking.openURL(cartUrl);
              onClose();
              return;
            } else {
              console.error('No shopping cart URL found in the response');
              setError('No shopping cart URL found in the response');
              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.error('Error creating Instacart shopping list with recipe IDs:', error);
          setError(error instanceof Error ? error.message : 'Failed to create Instacart shopping list');
          setLoading(false);
          return; // Don't fall back to regular URL generation
        }
      }

      // Regular URL generation for other services or as fallback
      const url = service.generateUrl(ingredients);
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        // If app isn't installed, open web version
        const webUrl = url.replace(/^[^:]+:\/\//, 'https://');
        await Linking.openURL(webUrl);
      }

      onClose();
    } catch (error) {
      console.error(`Error opening ${service.name}:`, error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order from Instacart</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityLabel="Close"
        >
          <X size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2A9D8F" />
          <Text style={styles.loadingText}>Creating Instacart shopping list...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#E76F51" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onClose}
          >
            <Text style={styles.retryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        SERVICES.map(service => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceButton}
            onPress={() => handleServiceSelect(service)}
          >
            <Text style={styles.serviceLogo}>{service.logo}</Text>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    maxWidth: 500,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#E76F51',
    textAlign: 'center',
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 0,
    flex: 1,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceLogo: {
    fontSize: 24,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
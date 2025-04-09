import { supabase } from './supabase';

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: string;
  recipe: string; // Recipe name
  recipe_id?: string; // Edamam recipe ID
  checked: boolean;
  created_at: string;
  updated_at: string;
}

// Get the current user's active shopping list
export async function getShoppingList(): Promise<ShoppingItem[]> {
  try {
    console.log('Getting shopping list from Supabase...');

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user found');
      return [];
    }

    // First, let's check if the user has multiple active shopping lists and fix that
    const { data: allLists, error: listsError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (listsError) {
      console.error('Error fetching shopping lists:', listsError);
    } else if (allLists && allLists.length > 1) {
      console.log('Found multiple active shopping lists. Consolidating...');

      // Keep the first list as active and move all items to it
      const primaryListId = allLists[0].id;

      // For each other list, move its items to the primary list
      for (let i = 1; i < allLists.length; i++) {
        const listToMerge = allLists[i].id;

        // Update all items from the other list to the primary list
        const { error: updateError } = await supabase
          .from('shopping_list_items')
          .update({ shopping_list_id: primaryListId })
          .eq('shopping_list_id', listToMerge);

        if (updateError) {
          console.error(`Error moving items from list ${listToMerge}:`, updateError);
        }

        // Set the other list to inactive
        const { error: statusError } = await supabase
          .from('shopping_lists')
          .update({ status: 'inactive' })
          .eq('id', listToMerge);

        if (statusError) {
          console.error(`Error setting list ${listToMerge} to inactive:`, statusError);
        }
      }
    }

    // Get or create the user's active shopping list
    let { data: shoppingList, error: listError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // If no active shopping list exists, create one
    if (listError || !shoppingList) {
      const { data: newList, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name: 'My Shopping List',
          status: 'active'
        })
        .select('id')
        .single();

      if (createError || !newList) {
        console.error('Error creating shopping list:', createError);
        return [];
      }

      shoppingList = newList;
    }

    // Get all items from the shopping list
    const { data: items, error: itemsError } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('shopping_list_id', shoppingList.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('Error fetching shopping list items:', itemsError);
      return [];
    }

    console.log('Retrieved shopping list with', items?.length || 0, 'items');
    return items || [];
  } catch (error) {
    console.error('Error reading shopping list:', error);
    return [];
  }
}

// Add items to the shopping list
export async function addToShoppingList(newItems: Omit<ShoppingItem, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>[]): Promise<void> {
  try {
    console.log('addToShoppingList called with', newItems.length, 'items');

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated user found');
    }

    // First, let's check if the user has multiple active shopping lists and fix that
    const { data: allLists, error: listsError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (listsError) {
      console.error('Error fetching shopping lists:', listsError);
    } else if (allLists && allLists.length > 1) {
      console.log('Found multiple active shopping lists. Consolidating...');

      // Keep the first list as active and move all items to it
      const primaryListId = allLists[0].id;

      // For each other list, move its items to the primary list
      for (let i = 1; i < allLists.length; i++) {
        const listToMerge = allLists[i].id;

        // Update all items from the other list to the primary list
        const { error: updateError } = await supabase
          .from('shopping_list_items')
          .update({ shopping_list_id: primaryListId })
          .eq('shopping_list_id', listToMerge);

        if (updateError) {
          console.error(`Error moving items from list ${listToMerge}:`, updateError);
        }

        // Set the other list to inactive
        const { error: statusError } = await supabase
          .from('shopping_lists')
          .update({ status: 'inactive' })
          .eq('id', listToMerge);

        if (statusError) {
          console.error(`Error setting list ${listToMerge} to inactive:`, statusError);
        }
      }
    }

    // Get or create the user's active shopping list
    let { data: shoppingList, error: listError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    // If no active shopping list exists, create one
    if (listError || !shoppingList) {
      const { data: newList, error: createError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name: 'My Shopping List',
          status: 'active'
        })
        .select('id')
        .single();

      if (createError || !newList) {
        throw new Error(`Error creating shopping list: ${createError?.message}`);
      }

      shoppingList = newList;
    }

    // Get existing items to check for duplicates
    const { data: existingItems, error: existingError } = await supabase
      .from('shopping_list_items')
      .select('name, recipe')
      .eq('shopping_list_id', shoppingList.id);

    if (existingError) {
      throw new Error(`Error fetching existing items: ${existingError.message}`);
    }

    // Create a map of existing items for easy lookup
    const existingItemMap = new Map(
      (existingItems || []).map(item => [`${item.name}-${item.recipe}`, item])
    );

    // Filter out duplicates
    const itemsToAdd = newItems.filter(newItem => {
      const key = `${newItem.name}-${newItem.recipe}`;
      return !existingItemMap.has(key);
    });

    if (itemsToAdd.length === 0) {
      console.log('No new items to add');
      return;
    }

    // Add the new items to the shopping list
    const { error: insertError } = await supabase
      .from('shopping_list_items')
      .insert(
        itemsToAdd.map(item => ({
          shopping_list_id: shoppingList.id,
          name: item.name,
          quantity: item.quantity,
          recipe: item.recipe,
          recipe_id: item.recipe_id,
          checked: item.checked
        }))
      );

    if (insertError) {
      throw new Error(`Error adding items to shopping list: ${insertError.message}`);
    }

    console.log('Successfully added items to shopping list');
  } catch (error) {
    console.error('Error adding to shopping list:', error);
    throw error;
  }
}

// Update a shopping item
export async function updateShoppingItem(itemId: string, updates: Partial<Omit<ShoppingItem, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>>): Promise<void> {
  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .update(updates)
      .eq('id', itemId);

    if (error) {
      throw new Error(`Error updating shopping item: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating shopping item:', error);
    throw error;
  }
}

// Remove items from the shopping list
export async function removeFromShoppingList(itemIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('shopping_list_items')
      .delete()
      .in('id', itemIds);

    if (error) {
      throw new Error(`Error removing items from shopping list: ${error.message}`);
    }
  } catch (error) {
    console.error('Error removing from shopping list:', error);
    throw error;
  }
}

// Clear all items from the shopping list
export async function clearShoppingList(): Promise<void> {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No authenticated user found');
    }

    // Get the user's active shopping list
    const { data: shoppingList, error: listError } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (listError || !shoppingList) {
      console.log('No active shopping list found');
      return;
    }

    // Delete all items from the shopping list
    const { error: deleteError } = await supabase
      .from('shopping_list_items')
      .delete()
      .eq('shopping_list_id', shoppingList.id);

    if (deleteError) {
      throw new Error(`Error clearing shopping list: ${deleteError.message}`);
    }
  } catch (error) {
    console.error('Error clearing shopping list:', error);
    throw error;
  }
}

// Toggle the checked status of a shopping item
export async function toggleItemChecked(itemId: string): Promise<void> {
  try {
    // Get the current checked status
    const { data: item, error: getError } = await supabase
      .from('shopping_list_items')
      .select('checked')
      .eq('id', itemId)
      .single();

    if (getError || !item) {
      throw new Error(`Error getting item: ${getError?.message}`);
    }

    // Toggle the checked status
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({ checked: !item.checked })
      .eq('id', itemId);

    if (updateError) {
      throw new Error(`Error toggling item checked status: ${updateError.message}`);
    }
  } catch (error) {
    console.error('Error toggling item checked status:', error);
    throw error;
  }
}

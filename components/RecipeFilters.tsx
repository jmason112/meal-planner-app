import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Filter, Check } from 'lucide-react-native';
import { RecipeSearchParams } from '@/lib/edamam';

interface RecipeFiltersProps {
  filters: RecipeSearchParams;
  onApplyFilters: (filters: RecipeSearchParams) => void;
}

export function RecipeFilters({ filters, onApplyFilters }: RecipeFiltersProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<RecipeSearchParams>(filters);

  const dietOptions = [
    { value: 'balanced', label: 'Balanced' },
    { value: 'high-fiber', label: 'High Fiber' },
    { value: 'high-protein', label: 'High Protein' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'low-fat', label: 'Low Fat' },
    { value: 'low-sodium', label: 'Low Sodium' },
  ];

  const healthOptions = [
    { value: 'alcohol-free', label: 'Alcohol-Free' },
    { value: 'dairy-free', label: 'Dairy-Free' },
    { value: 'egg-free', label: 'Egg-Free' },
    { value: 'gluten-free', label: 'Gluten-Free' },
    { value: 'keto-friendly', label: 'Keto' },
    { value: 'low-sugar', label: 'Low Sugar' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'peanut-free', label: 'Peanut-Free' },
    { value: 'pescatarian', label: 'Pescatarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
  ];

  const mealTypeOptions = [
    { value: 'Breakfast', label: 'Breakfast' },
    { value: 'Lunch', label: 'Lunch' },
    { value: 'Dinner', label: 'Dinner' },
    { value: 'Snack', label: 'Snack' },
  ];

  const cuisineTypeOptions = [
    { value: 'American', label: 'American' },
    { value: 'Asian', label: 'Asian' },
    { value: 'British', label: 'British' },
    { value: 'Caribbean', label: 'Caribbean' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'French', label: 'French' },
    { value: 'Greek', label: 'Greek' },
    { value: 'Indian', label: 'Indian' },
    { value: 'Italian', label: 'Italian' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Mediterranean', label: 'Mediterranean' },
    { value: 'Mexican', label: 'Mexican' },
    { value: 'Middle Eastern', label: 'Middle Eastern' },
  ];

  const dishTypeOptions = [
    { value: 'Main course', label: 'Main Course' },
    { value: 'Side dish', label: 'Side Dish' },
    { value: 'Soup', label: 'Soup' },
    { value: 'Salad', label: 'Salad' },
    { value: 'Bread', label: 'Bread' },
    { value: 'Desserts', label: 'Desserts' },
    { value: 'Drinks', label: 'Drinks' },
  ];

  const toggleDiet = (diet: string) => {
    setTempFilters(prev => {
      const currentDiets = prev.diet || [];
      if (currentDiets.includes(diet)) {
        return { ...prev, diet: currentDiets.filter(d => d !== diet) };
      } else {
        return { ...prev, diet: [...currentDiets, diet] };
      }
    });
  };

  const toggleHealth = (health: string) => {
    setTempFilters(prev => {
      const currentHealth = prev.health || [];
      if (currentHealth.includes(health)) {
        return { ...prev, health: currentHealth.filter(h => h !== health) };
      } else {
        return { ...prev, health: [...currentHealth, health] };
      }
    });
  };

  const toggleMealType = (mealType: string) => {
    setTempFilters(prev => {
      const currentMealTypes = prev.mealType || [];
      if (currentMealTypes.includes(mealType)) {
        return { ...prev, mealType: currentMealTypes.filter(m => m !== mealType) };
      } else {
        return { ...prev, mealType: [...currentMealTypes, mealType] };
      }
    });
  };

  const toggleCuisineType = (cuisineType: string) => {
    setTempFilters(prev => {
      const currentCuisineTypes = prev.cuisineType || [];
      if (currentCuisineTypes.includes(cuisineType)) {
        return { ...prev, cuisineType: currentCuisineTypes.filter(c => c !== cuisineType) };
      } else {
        return { ...prev, cuisineType: [...currentCuisineTypes, cuisineType] };
      }
    });
  };

  const toggleDishType = (dishType: string) => {
    setTempFilters(prev => {
      const currentDishTypes = prev.dishType || [];
      if (currentDishTypes.includes(dishType)) {
        return { ...prev, dishType: currentDishTypes.filter(d => d !== dishType) };
      } else {
        return { ...prev, dishType: [...currentDishTypes, dishType] };
      }
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(tempFilters);
    setModalVisible(false);
  };

  const handleResetFilters = () => {
    const resetFilters: RecipeSearchParams = {
      query: tempFilters.query,
    };
    setTempFilters(resetFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.diet && filters.diet.length > 0) count += filters.diet.length;
    if (filters.health && filters.health.length > 0) count += filters.health.length;
    if (filters.mealType && filters.mealType.length > 0) count += filters.mealType.length;
    if (filters.cuisineType && filters.cuisineType.length > 0) count += filters.cuisineType.length;
    if (filters.dishType && filters.dishType.length > 0) count += filters.dishType.length;
    return count;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setModalVisible(true)}
      >
        <Filter size={20} color="#264653" />
        <Text style={styles.filterButtonText}>Filters</Text>
        {getActiveFilterCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFilterCount()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color="#264653" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersScrollView}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Diet</Text>
                <View style={styles.filterOptions}>
                  {dietOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        tempFilters.diet?.includes(option.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleDiet(option.value)}
                    >
                      {tempFilters.diet?.includes(option.value) && (
                        <Check size={16} color="#fff" style={styles.checkIcon} />
                      )}
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilters.diet?.includes(option.value) && styles.filterOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Health</Text>
                <View style={styles.filterOptions}>
                  {healthOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        tempFilters.health?.includes(option.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleHealth(option.value)}
                    >
                      {tempFilters.health?.includes(option.value) && (
                        <Check size={16} color="#fff" style={styles.checkIcon} />
                      )}
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilters.health?.includes(option.value) && styles.filterOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Meal Type</Text>
                <View style={styles.filterOptions}>
                  {mealTypeOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        tempFilters.mealType?.includes(option.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleMealType(option.value)}
                    >
                      {tempFilters.mealType?.includes(option.value) && (
                        <Check size={16} color="#fff" style={styles.checkIcon} />
                      )}
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilters.mealType?.includes(option.value) && styles.filterOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Cuisine Type</Text>
                <View style={styles.filterOptions}>
                  {cuisineTypeOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        tempFilters.cuisineType?.includes(option.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleCuisineType(option.value)}
                    >
                      {tempFilters.cuisineType?.includes(option.value) && (
                        <Check size={16} color="#fff" style={styles.checkIcon} />
                      )}
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilters.cuisineType?.includes(option.value) && styles.filterOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Dish Type</Text>
                <View style={styles.filterOptions}>
                  {dishTypeOptions.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterOption,
                        tempFilters.dishType?.includes(option.value) && styles.filterOptionSelected
                      ]}
                      onPress={() => toggleDishType(option.value)}
                    >
                      {tempFilters.dishType?.includes(option.value) && (
                        <Check size={16} color="#fff" style={styles.checkIcon} />
                      )}
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilters.dishType?.includes(option.value) && styles.filterOptionTextSelected
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
    gap: 8,
  },
  filterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
  },
  filterBadge: {
    backgroundColor: '#2A9D8F',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#264653',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersScrollView: {
    flex: 1,
  },
  filterSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#264653',
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: '#2A9D8F',
  },
  filterOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
  },
  filterOptionTextSelected: {
    color: '#fff',
  },
  checkIcon: {
    marginRight: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  resetButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#264653',
  },
  applyButton: {
    backgroundColor: '#2A9D8F',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});

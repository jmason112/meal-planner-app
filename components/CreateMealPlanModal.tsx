import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { X as XIcon, Calendar, ChevronDown, Check } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { createMealPlanFromRecipe } from '@/lib/meal-plans';

interface CreateMealPlanModalProps {
  onClose: () => void;
  recipeId: string;
  recipeData: any;
}

export function CreateMealPlanModal({
  onClose,
  recipeId,
  recipeData
}: CreateMealPlanModalProps) {
  const router = useRouter();
  const [name, setName] = useState(`${recipeData.title} Meal Plan`);
  const [description, setDescription] = useState(`A meal plan featuring ${recipeData.title}`);
  const [category, setCategory] = useState('');
  const [mealType, setMealType] = useState('dinner');
  const [numDays, setNumDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [showMealTypeDropdown, setShowMealTypeDropdown] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [showDaySelector, setShowDaySelector] = useState(true); // Show by default
  const [selectedDays, setSelectedDays] = useState<number[]>([0]); // Default to first day

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' }
  ];

  const dayOptions = [1, 2, 3, 4, 5, 6, 7, 14, 21, 28];

  // Generate an array of day indices based on the number of days
  const getDayIndices = (days: number) => {
    return Array.from({ length: days }, (_, i) => i);
  };

  // Update selected days when numDays changes
  const updateDayOptions = (days: number) => {
    // Reset selected days when number of days changes
    setSelectedDays([0]); // Default to first day
    setShowDaySelector(true);
  };

  // Toggle a day selection
  const toggleDaySelection = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      // Don't allow deselecting the last day
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayIndex));
      }
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  // Select all days
  const selectAllDays = () => {
    setSelectedDays(getDayIndices(numDays));
  };

  // Clear all day selections except the first day
  const clearDaySelections = () => {
    setSelectedDays([0]);
  };

  const handleCreateMealPlan = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for your meal plan');
      return;
    }

    try {
      setLoading(true);

      console.log('Selected days before creating meal plan:', selectedDays);

      // Create the meal plan with the recipe
      const mealPlan = await createMealPlanFromRecipe({
        name,
        description,
        category,
        recipeId,
        recipeData,
        mealType,
        numDays,
        dayIndices: selectedDays
      });

      // Show success message
      Alert.alert(
        'Success',
        'Meal plan created successfully!',
        [
          {
            text: 'View Meal Plan',
            onPress: () => {
              onClose();
              router.push(`/meal-planner/view?id=${mealPlan.id}`);
            }
          },
          {
            text: 'Continue Browsing',
            onPress: () => onClose(),
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error creating meal plan:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create meal plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        entering={FadeIn}
        style={styles.modal}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Meal Plan</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <XIcon size={24} color="#264653" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Meal Plan Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter meal plan name"
              placeholderTextColor="#ADB5BD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor="#ADB5BD"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="E.g., Healthy, Quick, Family"
              placeholderTextColor="#ADB5BD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Meal Type</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowMealTypeDropdown(!showMealTypeDropdown)}
            >
              <Text style={styles.dropdownText}>
                {mealTypes.find(m => m.value === mealType)?.label || 'Select meal type'}
              </Text>
              <ChevronDown size={20} color="#264653" />
            </TouchableOpacity>
            {showMealTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {mealTypes.map(type => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMealType(type.value);
                      setShowMealTypeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type.label}</Text>
                    {mealType === type.value && (
                      <Check size={16} color="#2A9D8F" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of Days</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDaysDropdown(!showDaysDropdown)}
            >
              <Text style={styles.dropdownText}>{numDays} days</Text>
              <ChevronDown size={20} color="#264653" />
            </TouchableOpacity>
            {showDaysDropdown && (
              <View style={styles.dropdownMenu}>
                {dayOptions.map(days => (
                  <TouchableOpacity
                    key={days}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setNumDays(days);
                      setShowDaysDropdown(false);
                      updateDayOptions(days);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{days} days</Text>
                    {numDays === days && (
                      <Check size={16} color="#2A9D8F" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {showDaySelector && (
            <View style={styles.formGroup}>
              <View style={styles.daySelectorHeader}>
                <Text style={styles.label}>Select Days to Add Recipe</Text>
              </View>
              <View style={styles.daySelectorActions}>
                <TouchableOpacity
                  style={styles.selectAllButton}
                  onPress={selectAllDays}
                >
                  <Text style={styles.selectAllButtonText}>Select All Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearDaySelections}
                >
                  <Text style={styles.clearButtonText}>Clear Selection</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.daySelector}>
                {getDayIndices(numDays).map(dayIndex => (
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.dayOption,
                      selectedDays.includes(dayIndex) && styles.dayOptionSelected
                    ]}
                    onPress={() => toggleDaySelection(dayIndex)}
                  >
                    <Text style={[
                      styles.dayOptionText,
                      selectedDays.includes(dayIndex) && styles.dayOptionTextSelected
                    ]}>
                      Day {dayIndex + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.recipePreview}>
            <Text style={styles.previewTitle}>Recipe to Include:</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewRecipeTitle}>{recipeData.title}</Text>
              <View style={styles.previewMeta}>
                <Calendar size={14} color="#666" />
                <Text style={styles.previewMetaText}>
                  {selectedDays.length === 1
                    ? `Will be added to Day ${selectedDays[0] + 1}`
                    : `Will be added to ${selectedDays.length} days`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateMealPlan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Meal Plan</Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#264653',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
    maxHeight: '70%',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#264653',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#264653',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dropdownText: {
    fontSize: 16,
    color: '#264653',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#264653',
  },
  recipePreview: {
    marginTop: 16,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#264653',
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  previewRecipeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#264653',
    marginBottom: 4,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewMetaText: {
    fontSize: 14,
    color: '#6C757D',
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6C757D',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  daySelectorHeader: {
    marginBottom: 8,
  },
  daySelectorActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  selectAllButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2A9D8F',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  dayOption: {
    width: '22%', // Approximately 4 per row with gap
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOptionSelected: {
    backgroundColor: '#2A9D8F',
    borderColor: '#2A9D8F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#264653',
    textAlign: 'center',
  },
  dayOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Switch
} from 'react-native';
import { X as XIcon, Save, Tag as TagIcon, Calendar, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { saveMealPlan, type SaveMealPlanParams, getCurrentMealPlan } from '@/lib/meal-plans';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SaveMealPlanModalProps {
  recipes: {
    recipe_id: string;
    recipe_data: any;
    day_index: number;
    meal_type: string;
  }[];
  onClose: () => void;
  onSave: () => void;
}

const CATEGORIES = [
  'Weekly',
  'Low-Carb',
  'Vegetarian',
  'High-Protein',
  'Budget-Friendly',
  'Family',
  'Quick & Easy'
];

export function SaveMealPlanModal({ recipes, onClose, onSave }: SaveMealPlanModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCurrentPlan, setHasCurrentPlan] = useState(false);
  const [makeCurrentPlan, setMakeCurrentPlan] = useState(true);
  const [replaceCurrent, setReplaceCurrent] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6); // Default to 7 days
    return date;
  });

  useEffect(() => {
    checkForCurrentPlan();
  }, []);

  const checkForCurrentPlan = async () => {
    try {
      const currentPlan = await getCurrentMealPlan();
      setHasCurrentPlan(!!currentPlan);

      // If there's a current plan, default to not replacing it
      if (currentPlan) {
        setMakeCurrentPlan(false);
        setReplaceCurrent(false);
      }
    } catch (error) {
      console.error('Error checking for current plan:', error);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);

      // If end date is before start date, adjust it
      if (endDate < selectedDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(selectedDate.getDate() + 6); // Default to 7 days
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      // Ensure end date is not before start date
      if (selectedDate >= startDate) {
        // Ensure end date is not more than 31 days after start date
        const maxEndDate = new Date(startDate);
        maxEndDate.setDate(startDate.getDate() + 30);

        if (selectedDate <= maxEndDate) {
          setEndDate(selectedDate);
        } else {
          setEndDate(maxEndDate);
          setError('Meal plans cannot exceed 31 days');
        }
      } else {
        setError('End date must be after start date');
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!name.trim()) {
        throw new Error('Please enter a name for your meal plan');
      }

      // Calculate the duration in days
      const durationInDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Validate the duration
      if (durationInDays < 1) {
        throw new Error('Meal plan must be at least 1 day long');
      }

      if (durationInDays > 31) {
        throw new Error('Meal plan cannot exceed 31 days');
      }

      const mealPlanData: SaveMealPlanParams = {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        tags: tags.length > 0 ? tags : undefined,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_current: makeCurrentPlan,
        replace_current: replaceCurrent,
        recipes: recipes.map(recipe => ({
          ...recipe,
          notes: ''
        }))
      };

      await saveMealPlan(mealPlanData);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal plan');
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
          <Text style={styles.title}>Save Meal Plan</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <XIcon size={24} color="#264653" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter meal plan name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date Range</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Calendar size={16} color="#2A9D8F" />
                <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
              <Text style={styles.dateRangeSeparator}>to</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Calendar size={16} color="#2A9D8F" />
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
            </View>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
                minimumDate={startDate}
              />
            )}
          </View>

          {hasCurrentPlan && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Meal Plan</Text>
              <View style={styles.switchContainer}>
                <View style={styles.switchRow}>
                  <Switch
                    value={makeCurrentPlan}
                    onValueChange={setMakeCurrentPlan}
                    trackColor={{ false: '#E9ECEF', true: '#2A9D8F' }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={styles.switchLabel}>Make this my current meal plan</Text>
                </View>
                {makeCurrentPlan && (
                  <View style={styles.infoContainer}>
                    <AlertCircle size={16} color="#F4A261" />
                    <Text style={styles.infoText}>This will replace your current active meal plan</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipSelected
                  ]}
                  onPress={() => setCategory(cat === category ? null : cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextSelected
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagsContainer}>
              {tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <TagIcon size={16} color="#2A9D8F" />
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(tag)}
                    style={styles.removeTag}
                  >
                    <XIcon size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add a tag"
                placeholderTextColor="#666"
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddTag}
              >
                <Text style={styles.addTagButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Meal Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F9F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
    marginLeft: 8,
  },
  dateRangeSeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#ADB5BD',
    marginHorizontal: 8,
  },
  switchContainer: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
    marginLeft: 12,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F1',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#E76F51',
    marginLeft: 8,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#264653',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    padding: 24,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#DC2626',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#264653',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#2A9D8F',
  },
  categoryChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  categoryChipTextSelected: {
    color: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 8,
  },
  tagText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#264653',
  },
  removeTag: {
    padding: 2,
  },
  addTagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#264653',
  },
  addTagButton: {
    backgroundColor: '#2A9D8F',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addTagButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  saveButton: {
    backgroundColor: '#2A9D8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
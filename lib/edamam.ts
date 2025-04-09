import { Platform } from 'react-native';

const APP_ID = process.env.EXPO_PUBLIC_EDAMAM_APP_ID;
const APP_KEY = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY;

export interface Recipe {
  uri: string;
  label: string;
  image: string;
  images?: {
    THUMBNAIL?: { url: string; width: number; height: number };
    SMALL?: { url: string; width: number; height: number };
    REGULAR?: { url: string; width: number; height: number };
    LARGE?: { url: string; width: number; height: number };
  };
  source: string;
  url: string;
  shareAs?: string;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  cautions?: string[];
  ingredientLines: string[];
  ingredients: {
    text: string;
    quantity: number;
    measure: string;
    food: string;
    weight: number;
    foodId?: string;
    uri?: string;
  }[];
  calories: number;
  totalTime: number;
  totalWeight?: number;
  cuisineType?: string[];
  mealType?: string[];
  dishType?: string[];
  totalNutrients?: Record<string, { label: string; quantity: number; unit: string }>;
  totalDaily?: Record<string, { label: string; quantity: number; unit: string }>;
  digest?: Array<{ label: string; tag: string; schemaOrgTag?: string; total: number; hasRDI: boolean; daily: number; unit: string }>;
}

export interface MealPlanRequest {
  size: number;
  plan: {
    accept: {
      all: {
        health?: string[];
        diet?: string[];
      }[];
    };
    fit: {
      ENERC_KCAL: {
        min?: number;
        max?: number;
      };
      'SUGAR.added'?: {
        max: number;
      };
    };
    sections: Record<string, {
      accept: {
        all: {
          dish?: string[];
          meal?: string[];
        }[];
      };
      fit: {
        ENERC_KCAL: {
          min?: number;
          max?: number;
        };
      };
    }>;
  };
}

export interface MealPlanResponse {
  status: string;
  selection: {
    sections: {
      [key: string]: {
        assigned?: string;
        sections?: {
          [key: string]: {
            assigned: string;
            _links: {
              self: {
                title: string;
                href: string;
              };
            };
          };
        };
        _links?: {
          self: {
            title: string;
            href: string;
          };
        };
      };
    };
  }[];
}

export async function generateMealPlan(request: MealPlanRequest): Promise<MealPlanResponse> {
  if (!APP_ID || !APP_KEY) {
    throw new Error('Edamam API credentials are not configured');
  }

  // Create Basic Auth token
  const authToken = btoa(`${APP_ID}:${APP_KEY}`);

  // Construct the URL with the app_id in the path
  const baseUrl = `https://api.edamam.com/api/meal-planner/v1/${APP_ID}/select`;
  const url = new URL(baseUrl);

  // Add required query parameters
  url.searchParams.append('type', 'public');

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`,
        'accept': 'application/json',
        'Edamam-Account-User': 'mdotflow'
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }
      throw new Error(`Failed to generate meal plan: ${errorMessage}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: Expected an object');
    }

    // Ensure selection exists and is an array
    if (!data.selection) {
      // If no selection, create empty days based on request size
      data.selection = Array(request.size).fill({ sections: {} });
    } else if (!Array.isArray(data.selection)) {
      // If selection is not an array but exists, wrap it
      data.selection = [data.selection];
    }

    // Transform response to match expected format
    const transformedSelection = data.selection.map(day => {
      // Ensure sections exists
      const sections = day.sections || {};

      // Transform sections
      const transformedSections = Object.entries(sections).reduce((acc, [key, value]: [string, any]) => {
        // Handle both direct assignments and nested sections
        if (value && typeof value === 'object') {
          if (value.assigned) {
            acc[key] = {
              assigned: value.assigned,
              _links: value._links || {}
            };
          } else if (value.sections) {
            acc[key] = {
              sections: value.sections
            };
          }
        }
        return acc;
      }, {} as any);

      return {
        sections: transformedSections
      };
    });

    return {
      status: data.status || 'success',
      selection: transformedSelection
    };
  } catch (error) {
    console.error('Error in generateMealPlan:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while generating the meal plan');
  }
}

export async function getRecipeDetails(recipeId: string): Promise<Recipe> {
  if (!APP_ID || !APP_KEY) {
    throw new Error('Edamam API credentials are not configured');
  }

  const baseUrl = `https://api.edamam.com/api/recipes/v2/${recipeId}`;
  const url = new URL(baseUrl);

  url.searchParams.append('type', 'public');
  url.searchParams.append('app_id', APP_ID);
  url.searchParams.append('app_key', APP_KEY);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'accept': 'application/json',
        'Edamam-Account-User': 'mdotflow'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }
      throw new Error(`Failed to fetch recipe details: ${errorMessage}`);
    }

    const data = await response.json();

    if (!data || !data.recipe) {
      throw new Error('Invalid recipe response format from Edamam API');
    }

    return data.recipe;
  } catch (error) {
    console.error('Error fetching recipe details:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching recipe details');
  }
}

export interface ShoppingListEntry {
  quantity: number;
  measure: string;
  recipe: string;
}

export interface ShoppingListResponse {
  entries: {
    foodId: string;
    food: string;
    quantities: {
      quantity: number;
      measure: string;
      qualifiers?: string[];
    }[];
  }[];
  shoppingCartUrl?: string;
  _links?: {
    'shopping-cart'?: {
      href: string;
      title: string;
    };
  };
}

export async function createShoppingList(entries: ShoppingListEntry[]): Promise<ShoppingListResponse> {
  if (!APP_ID || !APP_KEY) {
    throw new Error('Edamam API credentials are not configured');
  }

  // Create Basic Auth token
  const authToken = btoa(`${APP_ID}:${APP_KEY}`);

  // Construct the URL with the app_id in the path
  const baseUrl = `https://api.edamam.com/api/meal-planner/v1/${APP_ID}/shopping-list`;
  const url = new URL(baseUrl);

  // Add required query parameters
  url.searchParams.append('type', 'public');
  url.searchParams.append('type', 'edamam-generic');
  url.searchParams.append('shopping-cart', 'true');
  url.searchParams.append('beta', 'true');

  console.log('Shopping list API URL:', url.toString());

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authToken}`,
        'accept': 'application/json',
        'Edamam-Account-User': 'mdotflow'
      },
      body: JSON.stringify({ entries }),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }
      throw new Error(`Failed to create shopping list: ${errorMessage}`);
    }

    const data = await response.json();

    console.log('Raw API response:', JSON.stringify(data, null, 2));

    // Validate response structure
    if (!data || typeof data !== 'object' || !Array.isArray(data.entries)) {
      throw new Error('Invalid response format: Expected an object with entries array');
    }

    // Check for shopping cart URL
    if (data.shoppingCartUrl) {
      console.log('Found shoppingCartUrl:', data.shoppingCartUrl);
    } else if (data._links && data._links['shopping-cart'] && data._links['shopping-cart'].href) {
      console.log('Found _links["shopping-cart"].href:', data._links['shopping-cart'].href);
      // Add the URL to the response in a consistent location
      data.shoppingCartUrl = data._links['shopping-cart'].href;
    } else {
      console.warn('No shopping cart URL found in response');
    }

    return data;
  } catch (error) {
    console.error('Error in createShoppingList:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while creating the shopping list');
  }
}

export function generateInstacartUrl(ingredients: string[]): string {
  // Instacart deep linking
  const baseUrl = Platform.select({
    web: 'https://www.instacart.com/store/partner_recipes/items',
    ios: 'instacart://store/partner_recipes/items',
    android: 'instacart://store/partner_recipes/items',
    default: 'https://www.instacart.com/store/partner_recipes/items',
  });

  const params = new URLSearchParams();
  ingredients.forEach(item => params.append('items[]', item));

  return `${baseUrl}?${params.toString()}`;
}

export interface RecipeSearchParams {
  query?: string;
  diet?: string[];
  health?: string[];
  cuisineType?: string[];
  mealType?: string[];
  dishType?: string[];
  calories?: string;
  time?: string;
  excluded?: string[];
  from?: number;
  to?: number;
  random?: boolean;
}

export interface RecipeSearchResponse {
  from: number;
  to: number;
  count: number;
  _links: {
    self: {
      href: string;
      title?: string;
    };
    next?: {
      href: string;
      title?: string;
    };
  };
  hits: Array<{
    recipe: Recipe;
    _links: {
      self: {
        href: string;
        title?: string;
      };
    };
  }>;
}

export async function searchRecipes(params: RecipeSearchParams): Promise<RecipeSearchResponse> {
  if (!APP_ID || !APP_KEY) {
    throw new Error('Edamam API credentials are not configured');
  }

  try {
    // Construct the URL
    const url = new URL('https://api.edamam.com/api/recipes/v2');

    // Add required parameters
    url.searchParams.append('type', 'public');
    url.searchParams.append('app_id', APP_ID);
    url.searchParams.append('app_key', APP_KEY);
    url.searchParams.append('beta', 'true');

    // Add optional parameters
    if (params.query) {
      url.searchParams.append('q', params.query);
    }

    if (params.diet && params.diet.length > 0) {
      params.diet.forEach(diet => url.searchParams.append('diet', diet));
    }

    if (params.health && params.health.length > 0) {
      params.health.forEach(health => url.searchParams.append('health', health));
    }

    if (params.cuisineType && params.cuisineType.length > 0) {
      params.cuisineType.forEach(cuisine => url.searchParams.append('cuisineType', cuisine));
    }

    if (params.mealType && params.mealType.length > 0) {
      params.mealType.forEach(meal => url.searchParams.append('mealType', meal));
    }

    if (params.dishType && params.dishType.length > 0) {
      params.dishType.forEach(dish => url.searchParams.append('dishType', dish));
    }

    if (params.calories) {
      url.searchParams.append('calories', params.calories);
    }

    if (params.time) {
      url.searchParams.append('time', params.time);
    }

    if (params.excluded && params.excluded.length > 0) {
      params.excluded.forEach(excluded => url.searchParams.append('excluded', excluded));
    }

    if (params.random) {
      url.searchParams.append('random', 'true');
    }

    // Add pagination parameters
    if (params.from !== undefined) {
      url.searchParams.append('from', params.from.toString());
    }

    if (params.to !== undefined) {
      url.searchParams.append('to', params.to.toString());
    }

    // Make the request
    const response = await fetch(url.toString(), {
      headers: {
        'accept': 'application/json',
        'Accept-Language': 'en',
        'Edamam-Account-User': 'mdotflow'
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += `: ${JSON.stringify(errorData)}`;
      } catch {
        errorMessage += ` - ${response.statusText}`;
      }
      throw new Error(`Failed to search recipes: ${errorMessage}`);
    }

    const data = await response.json();
    return data as RecipeSearchResponse;
  } catch (error) {
    console.error('Error searching recipes:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while searching recipes');
  }
}

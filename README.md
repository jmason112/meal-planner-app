# SmartMealSaver

A comprehensive meal planning application built with React Native and Expo, designed to simplify meal planning, recipe discovery, and grocery shopping.

## Features

### Meal Planning
- **AI-Powered Meal Plans**: Generate personalized meal plans based on dietary preferences, restrictions, and nutritional goals
- **Customizable Plans**: Create, edit, and manage meal plans with recipes organized by days and meal types
- **Current & Previous Plans**: System for tracking current active meal plan and archiving previous plans
- **Multi-day Selection**: Add recipes to multiple days at once when building meal plans

### Recipe Discovery
- **Recipe Search**: Search for recipes with advanced filtering options (dietary restrictions, cuisine types, prep time, etc.)
- **Recipe Categories**: Browse recipes by categories like quick meals, healthy options, vegetarian, etc.
- **Recipe Details**: View comprehensive recipe information including ingredients, nutritional facts, and cooking instructions

### Shopping Lists
- **Automatic List Generation**: Create shopping lists from meal plans with a single tap
- **Instacart Integration**: Send shopping lists directly to Instacart for convenient grocery ordering
- **List Management**: Check off items, clear completed items, and manage your shopping list

### User Experience
- **Modern UI**: Clean, intuitive interface with smooth animations and transitions
- **Progress Tracking**: Track your meal planning and cooking progress
- **Personalization**: Customize the app based on your preferences and dietary needs
- **Reminders**: Set up notifications for meal planning, shopping, and cooking

## Technology Stack

- **Frontend**: React Native, Expo
- **State Management**: React Context API
- **Backend & Authentication**: Supabase
- **API Integration**: Edamam API for recipe search and meal planning
- **UI Components**: Custom components with Reanimated for animations
- **Navigation**: Expo Router

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### One-Click Setup

1. Clone the repository
```bash
git clone https://github.com/jmason112/meal-planner-app.git
cd meal-planner-app
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Copy the `.env.example` file to a new file named `.env` and update the values:
```bash
cp .env.example .env
```

Then edit the `.env` file with your actual credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_EDAMAM_APP_ID=your_edamam_app_id
EXPO_PUBLIC_EDAMAM_APP_KEY=your_edamam_app_key
```

You'll need to create accounts on [Supabase](https://supabase.com/) and [Edamam](https://developer.edamam.com/) to get these credentials.

4. Start the development server
```bash
npm start
```

5. Run on specific platforms
```bash
# For iOS
npm run ios

# For Android
npm run android

# For web
npm run web
```

### Testing

Run the test suite to ensure everything is working correctly:

```bash
npm test
```

## Project Structure

- `/app`: Main application screens organized by route groups
  - `/(auth)`: Authentication screens
  - `/(onboarding)`: User onboarding flow
  - `/(tabs)`: Main app tabs (Home, Recipes, Meal Plan, Shopping, Profile)
- `/components`: Reusable UI components
- `/lib`: Utility functions and API integrations
- `/assets`: Images and other static assets
- `/hooks`: Custom React hooks
- `/supabase`: Supabase migrations and configuration

## Database Schema

### Meal Plans
- `meal_plans`: Stores meal plan metadata (name, description, dates, etc.)
- `meal_plan_recipes`: Links recipes to meal plans with day and meal type information

### Shopping Lists
- `shopping_lists`: Stores shopping list metadata
- `shopping_list_items`: Stores individual shopping list items with recipe references

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Edamam API](https://developer.edamam.com/) for recipe and nutrition data
- [Supabase](https://supabase.io/) for backend services
- [Expo](https://expo.dev/) for the React Native development framework

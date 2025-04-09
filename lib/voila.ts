import { Platform } from 'react-native';

export function generateVoilaUrl(ingredients: string[]): string {
  const baseUrl = Platform.select({
    web: 'https://voila.ca/products/search',
    ios: 'voila://products/search',
    android: 'voila://products/search',
    default: 'https://voila.ca/products/search',
  });

  const params = new URLSearchParams({
    terms: ingredients.join(',')
  });

  return `${baseUrl}?${params.toString()}`;
}
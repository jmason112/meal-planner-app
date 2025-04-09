import { Platform } from 'react-native';

export function generateSaveOnFoodsUrl(ingredients: string[]): string {
  const baseUrl = Platform.select({
    web: 'https://shop.saveonfoods.com/store/results',
    ios: 'saveonfoods://store/results',
    android: 'saveonfoods://store/results',
    default: 'https://shop.saveonfoods.com/store/results',
  });

  const params = new URLSearchParams({
    q: ingredients.join(' ')
  });

  return `${baseUrl}?${params.toString()}`;
}
import { Platform } from 'react-native';

export function generatePCExpressUrl(ingredients: string[]): string {
  const baseUrl = Platform.select({
    web: 'https://www.pcexpress.ca/search',
    ios: 'pcexpress://search',
    android: 'pcexpress://search',
    default: 'https://www.pcexpress.ca/search',
  });

  // PC Express accepts comma-separated search terms
  const params = new URLSearchParams({
    query: ingredients.join(',')
  });

  return `${baseUrl}?${params.toString()}`;
}
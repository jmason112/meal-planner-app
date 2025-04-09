import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// This is a simple test to verify that the testing setup works
describe('Testing setup', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <View>
        <Text>Hello, Testing!</Text>
      </View>
    );
    
    expect(getByText('Hello, Testing!')).toBeTruthy();
  });
});

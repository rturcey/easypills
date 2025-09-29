// frontend/components/shared/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, CommonStyles } from '@/constants/theme';

interface LoadingScreenProps {
  text?: string;
}

export default function LoadingScreen({ text = 'Chargement...' }: LoadingScreenProps) {
  return (
    <SafeAreaView style={CommonStyles.container} edges={['top']}>
      <View style={CommonStyles.centerContent}>
        <ActivityIndicator size="large" color={Colors.primary.blue} />
        <Text style={CommonStyles.loadingText}>{text}</Text>
      </View>
    </SafeAreaView>
  );
}

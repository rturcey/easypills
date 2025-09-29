// frontend/components/shared/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, CommonStyles } from '@/constants/theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
}

export default function Header({ title, onBack, rightComponent }: HeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={CommonStyles.header}>
      <TouchableOpacity style={CommonStyles.backButton} onPress={handleBack}>
        <Ionicons name="chevron-back" size={28} color={Colors.primary.blue} />
      </TouchableOpacity>
      <Text style={CommonStyles.headerTitle}>{title}</Text>
      <View style={{ width: 52 }}>{rightComponent}</View>
    </View>
  );
}

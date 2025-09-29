// frontend/components/form/FormInput.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, CommonStyles } from '@/constants/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
}

export default function FormInput({ label, required, ...props }: FormInputProps) {
  return (
    <View style={styles.container}>
      <Text style={CommonStyles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={CommonStyles.input}
        placeholderTextColor={Colors.text.light}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  required: {
    color: Colors.status.error,
  },
});

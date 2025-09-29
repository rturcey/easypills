// Créer le fichier: frontend/components/shared/Toast.tsx

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    onHide: () => void;
}

export default function Toast({
                                  visible,
                                  message,
                                  type = 'success',
                                  duration = 3000,
                                  onHide
                              }: ToastProps) {
    const opacity = React.useRef(new Animated.Value(0)).current;
    const translateY = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Apparition
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();

            // Disparition automatique
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => onHide());
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';
    const iconColor = type === 'success' ? Colors.status.success : type === 'error' ? Colors.status.error : Colors.primary.blue;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.toast}>
                <Ionicons name={iconName} size={24} color={iconColor} />
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: Spacing.lg,
        right: Spacing.lg,
        zIndex: 9999,
    },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
        ...Shadow.large,
    },
    message: {
        flex: 1,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.text.primary,
    },
});
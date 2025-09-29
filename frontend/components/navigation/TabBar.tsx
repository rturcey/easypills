// components/navigation/TabBar.tsx - Version avec safe area
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Shadow } from '@/constants/theme';

interface TabBarProps {
    currentTab?: 'today' | 'history' | 'manage';
}

export default function TabBar({ currentTab }: TabBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    const tabs = [
        {
            name: "Aujourd'hui",
            icon: 'calendar-outline',
            iconActive: 'calendar',
            path: '/today',
            id: 'today',
        },
        {
            name: 'Historique',
            icon: 'bar-chart-outline',
            iconActive: 'bar-chart',
            path: '/history',
            id: 'history',
        },
        {
            name: 'Médicaments',
            icon: 'medkit-outline',
            iconActive: 'medkit',
            path: '/manage-medications',
            id: 'manage',
        },
    ];

    return (
        <>
            {/* Conteneur avec le fond qui s'étend jusqu'en bas */}
            <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                {/* Barre de navigation */}
                <View style={styles.tabBar}>
                    {tabs.map((tab) => {
                        const isActive = currentTab ? currentTab === tab.id : pathname === tab.path;
                        return (
                            <TouchableOpacity
                                key={tab.path}
                                style={styles.tabButton}
                                onPress={() => router.push(tab.path as any)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                                    <Ionicons
                                        name={(isActive ? tab.iconActive : tab.icon) as any}
                                        size={24}
                                        color={isActive ? Colors.primary.blue : Colors.text.light}
                                    />
                                </View>
                                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                                    {tab.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: Colors.border.light,
        ...Shadow.medium,
    },
    tabBar: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 8,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 6,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerActive: {
        backgroundColor: Colors.primary.blue + '15',
    },
    tabText: {
        fontSize: FontSize.xs,
        color: Colors.text.light,
        fontWeight: FontWeight.medium,
        textAlign: 'center',
    },
    tabTextActive: {
        color: Colors.primary.blue,
        fontWeight: FontWeight.bold,
    },
});
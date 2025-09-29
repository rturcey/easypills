// Dans frontend/app/_layout.tsx
// AJOUTER ces routes dans le Stack :
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { generateTodaySchedule } from '@/services/storage';
import { initializeNotifications } from '@/utils/notifications';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                // Prépare le planning du jour au démarrage
                await generateTodaySchedule();

                // Initialise les notifications
                await initializeNotifications();
            } finally {
                if (mounted) setReady(true);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    if (!ready) {
        return (
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F8FAFC'
            }}>
                <ActivityIndicator size="large" color="#2563EB"/>
            </View>
        );
    }
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {/* Écrans principaux */}
            <Stack.Screen name="index"/>
            <Stack.Screen name="today"/>
            <Stack.Screen name="history"/>
            <Stack.Screen name="manage-medications"/>
            <Stack.Screen name="settings"/>

            {/* Gestion médicaments */}
            <Stack.Screen name="add-medication"/>
            <Stack.Screen name="edit-medication"/>
            <Stack.Screen name="medication-details"/>

            {/* AJOUTER CES 2 ROUTES ⬇️ */}
            <Stack.Screen
                name="scan-prescription"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />
            <Stack.Screen
                name="scan-barcode"
                options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                }}
            />

            {/* Premium */}
            <Stack.Screen
                name="premium"
                options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                }}
            />

            {/* Test OCR (dev) */}
            <Stack.Screen name="test"/>

            {/* Reminder (modal plein écran) */}
            <Stack.Screen
                name="reminder"
                options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                }}
            />
        </Stack>
    );
}
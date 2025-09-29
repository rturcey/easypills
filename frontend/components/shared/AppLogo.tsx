// frontend/components/shared/AppLogo.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export default function AppLogo({ size = 'medium' }: AppLogoProps) {
  // Calcul des dimensions proportionnelles à l'original (48x48)
  const baseDimension = size === 'large' ? 120 : size === 'medium' ? 80 : 48;
  const scale = baseDimension / 48; // Facteur d'échelle par rapport à l'original

  const squareSize = 22 * scale;
  const gap = 2 * scale;
  const pillWidth = 28 * scale;
  const pillHeight = 16 * scale;
  const pillTop = 16 * scale;
  const pillLeft = 10 * scale;
  const pillBorder = 2 * scale;
  const squareRadius = 8 * scale;
  const pillRadius = 20 * scale;

  return (
      <View style={[styles.container, { width: baseDimension, height: baseDimension }]}>
        {/* Grille de 4 carrés - TOUS de la même couleur turquoise */}
        <View style={[styles.grid, { width: baseDimension, height: baseDimension, gap }]}>
          <View style={[styles.square, {
            width: squareSize,
            height: squareSize,
            backgroundColor: '#5DAFA7',
            borderRadius: squareRadius
          }]} />
          <View style={[styles.square, {
            width: squareSize,
            height: squareSize,
            backgroundColor: '#5DAFA7',
            borderRadius: squareRadius
          }]} />
          <View style={[styles.square, {
            width: squareSize,
            height: squareSize,
            backgroundColor: '#5DAFA7',
            borderRadius: squareRadius
          }]} />
          <View style={[styles.square, {
            width: squareSize,
            height: squareSize,
            backgroundColor: '#5DAFA7',
            borderRadius: squareRadius
          }]} />
        </View>

        {/* Pill (gélule) avec bordure blanche */}
        <View style={[
          styles.pill,
          {
            width: pillWidth,
            height: pillHeight,
            borderRadius: pillRadius,
            top: pillTop,
            left: pillLeft,
            borderWidth: pillBorder,
          }
        ]}>
          <View style={[styles.pillHalf, { backgroundColor: '#F5A623' }]} />
          <View style={[styles.pillHalf, { backgroundColor: '#2563EB' }]} />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  grid: {
    position: 'absolute',
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Pas de fond, pas de padding, pas de borderRadius sur la grille
  },
  square: {
    // Dimensions et couleur appliquées inline
  },
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    transform: [{ rotate: '45deg' }],
    borderColor: '#FFF',
    backgroundColor: '#FFF',
    overflow: 'hidden',
    // Pas d'ombre, uniquement bordure blanche
  },
  pillHalf: {
    flex: 1,
  },
});
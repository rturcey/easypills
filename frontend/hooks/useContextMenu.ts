// frontend/hooks/useContextMenu.ts
// ✅ NOUVEAU: Hook pour factoriser la logique des menus contextuels
import { useState, useCallback, useRef, useEffect } from 'react';
import { BackHandler } from 'react-native';

interface UseContextMenuOptions {
  onClose?: () => void;
  closeOnBackPress?: boolean;
}

export function useContextMenu(options: UseContextMenuOptions = {}) {
  const { onClose, closeOnBackPress = true } = options;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(false);

  // Ouvrir le menu
  const openMenu = useCallback(() => {
    setShowMenu(true);
    menuRef.current = true;
  }, []);

  // Fermer le menu
  const closeMenu = useCallback(() => {
    setShowMenu(false);
    menuRef.current = false;
    onClose?.();
  }, [onClose]);

  // Toggle le menu
  const toggleMenu = useCallback(() => {
    if (showMenu) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [showMenu, openMenu, closeMenu]);

  // Gérer le bouton retour Android
  useEffect(() => {
    if (!closeOnBackPress) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menuRef.current) {
        closeMenu();
        return true; // Empêcher le comportement par défaut
      }
      return false;
    });

    return () => backHandler.remove();
  }, [closeMenu, closeOnBackPress]);

  return {
    showMenu,
    openMenu,
    closeMenu,
    toggleMenu,
  };
}

/**
 * useAuth Hook
 * Manages authentication state and Firebase auth integration
 */

import { useState, useEffect } from 'react';
import { authService } from '../firebase';
import { STORAGE_KEYS, TIMEOUTS } from '../config'; // ✅ Unified import

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAppLocked, setIsAppLocked] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if app unlock session is still valid
  const checkUnlockSession = () => {
    const unlockTimestamp = localStorage.getItem(STORAGE_KEYS.UNLOCK_TIMESTAMP);
    if (!unlockTimestamp) return false;
    
    const now = Date.now();
    const unlocked = parseInt(unlockTimestamp, 10);
    const elapsed = now - unlocked;
    
    return elapsed < TIMEOUTS.UNLOCK_SESSION;
  };

  // Set app unlock timestamp
  const unlockApp = () => {
    localStorage.setItem(STORAGE_KEYS.UNLOCK_TIMESTAMP, Date.now().toString());
    setIsAppLocked(false);
  };

  // Lock the app
  const lockApp = () => {
    localStorage.removeItem(STORAGE_KEYS.UNLOCK_TIMESTAMP);
    setIsAppLocked(true);
  };

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      console.log('🔐 Auth state changed:', authUser?.email || 'No user');
      setUser(authUser);
      setIsCheckingAuth(false);
      
      if (authUser && checkUnlockSession()) {
        setIsAppLocked(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const result = await authService.signInWithEmailAndPassword(email, password);
      unlockApp();
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await authService.signOut();
      lockApp();
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    isAppLocked,
    isCheckingAuth,
    unlockApp,
    lockApp,
    signIn,
    signOut,
    checkUnlockSession
  };
};

export default useAuth;

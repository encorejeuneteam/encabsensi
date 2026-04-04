/**
 * Notification Service
 * Centralized notification handling for in-app and browser notifications
 */

/**
 * Request browser notification permission
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('⚠️ Browser does not support notifications');
    return 'denied';
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  return Notification.permission;
};

/**
 * Show browser notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} options - Additional options
 */
export const showBrowserNotification = (title, body, options = {}) => {
  if (!('Notification' in window)) {
    console.log('⚠️ Browser does not support notifications');
    return;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('⚠️ Notification permission not granted');
    return;
  }
  
  try {
    const notification = new Notification(title, {
      body,
      icon: options.icon || '/logo192.png',
      badge: options.badge || '/logo192.png',
      tag: options.tag || 'attendance-notification',
      requireInteraction: options.requireInteraction ?? true,
      silent: options.silent ?? false,
      ...options
    });
    
    // Auto close after 10 seconds if not requireInteraction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }
    
    // Handle click
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (options.onClick) options.onClick();
    };
    
    return notification;
  } catch (error) {
    console.error('❌ Error showing browser notification:', error);
  }
};

/**
 * Play sound notification
 * @param {Object} options - Sound options
 */
export const playSoundNotification = (options = {}) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = options.frequency || 800;
    oscillator.type = options.type || 'sine';
    
    gainNode.gain.setValueAtTime(options.volume || 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, 
      audioContext.currentTime + (options.duration || 0.5)
    );
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (options.duration || 0.5));
  } catch (error) {
    console.log('🔇 Sound notification not supported:', error);
  }
};

/**
 * Show comprehensive notification (sound + browser + in-app)
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Function} addNotificationCallback - In-app notification callback
 * @param {Object} options - Additional options
 */
export const showComprehensiveNotification = (
  title, 
  message, 
  addNotificationCallback, 
  options = {}
) => {
  // Play sound
  if (options.playSound !== false) {
    playSoundNotification(options.soundOptions);
  }
  
  // Show browser notification
  if (options.showBrowser !== false) {
    showBrowserNotification(title, message, options.browserOptions);
  }
  
  // Show in-app notification
  if (addNotificationCallback) {
    addNotificationCallback(
      `${title}: ${message}`, 
      options.notificationType || 'info'
    );
  }
};

/**
 * Create notification manager
 * @param {Function} addNotificationCallback - In-app notification callback
 * @returns {Object} Notification manager object
 */
export const createNotificationManager = (addNotificationCallback) => {
  return {
    success: (message, options = {}) => {
      addNotificationCallback(message, 'success');
      if (options.showBrowser) {
        showBrowserNotification('✅ Success', message, options);
      }
    },
    error: (message, options = {}) => {
      addNotificationCallback(message, 'error');
      if (options.showBrowser) {
        showBrowserNotification('❌ Error', message, options);
      }
      if (options.playSound) {
        playSoundNotification({ frequency: 400, duration: 0.3 });
      }
    },
    warning: (message, options = {}) => {
      addNotificationCallback(message, 'warning');
      if (options.showBrowser) {
        showBrowserNotification('⚠️ Warning', message, options);
      }
    },
    info: (message, options = {}) => {
      addNotificationCallback(message, 'info');
      if (options.showBrowser) {
        showBrowserNotification('ℹ️ Info', message, options);
      }
    },
    comprehensive: (title, message, options = {}) => {
      showComprehensiveNotification(
        title, 
        message, 
        addNotificationCallback, 
        options
      );
    }
  };
};

export default {
  requestNotificationPermission,
  showBrowserNotification,
  playSoundNotification,
  showComprehensiveNotification,
  createNotificationManager
};

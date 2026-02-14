/**
 * Unified Constants & Configuration
 * 
 * Single source of truth for all application constants.
 * Consolidates config/constants.js and utils/constants.js
 * 
 * @module config
 */

// ============================================================================
// EMPLOYEE & TASK DATA
// ============================================================================

/**
 * Initial employee data structure
 * @constant {Array<Object>}
 */
export const INITIAL_EMPLOYEES = [
  {
    id: 1,
    name: 'Desta',
    baseSalary: 8000000,
    status: 'belum',
    lateHours: 0,
    checkInTime: null,
    workTasks: [],
    shift: null,
    checkedIn: false,
    isAdmin: true,
    breakTime: null,
    breakDuration: 0,
    shiftEndAdjustment: 0,
    overtime: false,
    shifts: [],
    breakHistory: [],
    hasBreakToday: false,
    izinTime: null,
    izinHistory: [],
    completedTasksHistory: [],
    isBackup: true
  },
  {
    id: 2,
    name: 'Ariel',
    baseSalary: 7000000,
    status: 'belum',
    lateHours: 0,
    checkInTime: null,
    workTasks: [],
    shift: null,
    checkedIn: false,
    isAdmin: false,
    breakTime: null,
    breakDuration: 0,
    shiftEndAdjustment: 0,
    overtime: false,
    shifts: [],
    breakHistory: [],
    hasBreakToday: false,
    shiftEndTime: null,
    izinTime: null,
    izinHistory: [],
    completedTasksHistory: []
  },
  {
    id: 3,
    name: 'Robert',
    baseSalary: 6500000,
    status: 'belum',
    lateHours: 0,
    checkInTime: null,
    workTasks: [],
    shift: null,
    checkedIn: false,
    isAdmin: false,
    breakTime: null,
    breakDuration: 0,
    shiftEndAdjustment: 0,
    overtime: false,
    shifts: [],
    breakHistory: [],
    hasBreakToday: false,
    shiftEndTime: null,
    izinTime: null,
    izinHistory: [],
    completedTasksHistory: []
  }
];


/**
 * Month names in Indonesian
 * @constant {Array<string>}
 */
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Day names in Indonesian
 * @constant {Array<string>}
 */
export const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

// ============================================================================
// ORDER CONSTANTS
// ============================================================================

/**
 * Order status types
 * @constant {Object}
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESS: 'process',
  COMPLETED: 'completed'
};

/**
 * Order priority levels
 * @constant {Object}
 */
export const ORDER_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Order platforms
 * @constant {Object}
 */
export const ORDER_PLATFORMS = {
  WA: 'wa',
  TELEGRAM: 'tele',
  SHOPEE_MEDIA: 'shopee_media',
  SHOPEE_ACC: 'shopee_acc',
  SHOPEE_BLACKPACKET: 'shopee_blackpacket',
  SHOPEE_BLACKVAULT: 'shopee_blackvault',
  SHOPEE_DIGITALFIX: 'shopee_digitalfix',
  SHOPEE_HIDDENREACH: 'shopee_hiddenreach',
  SHOPEE_QUICKAUTH: 'shopee_quickauth',
  SHOPEE_SHADOWBOOST: 'shopee_shadowboost',
  SHOPEE_UNDERGROUND: 'shopee_underground'
};

/**
 * Platform display configuration
 * @constant {Object}
 */
export const PLATFORM_CONFIG = {
  wa: {
    label: 'WhatsApp',
    color: 'from-blue-600 to-blue-500',
    icon: 'MessageSquare'
  },
  tele: {
    label: 'Telegram',
    color: 'from-blue-600 to-blue-500',
    icon: 'MessageSquare'
  },
  shopee_media: {
    label: 'Shopee Media Booster',
    color: 'from-blue-700 to-blue-500',
    icon: 'ShoppingCart'
  },
  shopee_acc: {
    label: 'Shopee AccStorageCom',
    color: 'from-blue-700 to-blue-500',
    icon: 'ShoppingCart'
  },
  shopee_blackpacket: {
    label: 'Shopee BlackPacket',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  },
  shopee_blackvault: {
    label: 'Shopee Black Vault',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  },
  shopee_digitalfix: {
    label: 'Shopee Digital Fix',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  },
  shopee_hiddenreach: {
    label: 'Shopee HiddenReach',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  },
  shopee_quickauth: {
    label: 'Shopee QuickAuth',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  },
  shopee_shadowboost: {
    label: 'Shopee ShadowBoost',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  },
  shopee_underground: {
    label: 'Shopee Underground',
    color: 'from-orange-600 to-orange-400',
    icon: 'ShoppingCart'
  }
};

/**
 * Priority display configuration
 * @constant {Object}
 */
export const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    color: 'bg-slate-800/60 text-slate-200 border border-white/10',
    icon: '●'
  },
  medium: {
    label: 'Medium',
    color: 'bg-blue-900/35 text-blue-200 border border-blue-500/20',
    icon: '●●'
  },
  high: {
    label: 'High',
    color: 'bg-blue-800/45 text-blue-100 border border-blue-400/25',
    icon: '●●●'
  },
  urgent: {
    label: 'Urgent',
    color: 'bg-blue-700/55 text-white border border-blue-300/30',
    icon: '🔥'
  }
};

/**
 * Status display configuration
 * @constant {Object}
 */
export const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'bg-slate-800/60 text-slate-200 border-slate-700'
  },
  process: {
    label: 'Diproses',
    color: 'bg-blue-900/35 text-blue-200 border-blue-500/25'
  },
  completed: {
    label: 'Selesai',
    color: 'bg-blue-800/35 text-blue-100 border-blue-400/25'
  }
};

// ============================================================================
// SHIFT CONFIGURATION
// ============================================================================

/**
 * Shift time configuration
 * @constant {Object}
 */
export const SHIFT_CONFIG = {
  pagi: {
    start: 9,
    end: 17,
    maxCheckIn: 10,
    name: 'Shift Pagi',
    emoji: '🌅',
    color: 'from-blue-600 to-blue-500'
  },
  malam: {
    start: 17,
    end: 1,
    maxCheckIn: 18,
    name: 'Shift Malam',
    emoji: '🌙',
    color: 'from-blue-700 to-blue-500'
  }
};

// ============================================================================
// ATTENDANCE CONSTANTS
// ============================================================================

/**
 * Attendance status types
 * @constant {Object}
 */
export const ATTENDANCE_STATUS = {
  HADIR: 'hadir',
  TELAT: 'telat',
  LIBUR: 'libur',
  IZIN: 'izin',
  SAKIT: 'sakit',
  ALPHA: 'alpha',
  LEMBUR: 'lembur'
};

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

/**
 * Application theme configurations
 * @constant {Object}
 */
export const APP_THEMES = {
  dark: {
    name: 'Midnight',
    icon: 'Moon',
    bg: 'from-slate-950 via-slate-900 to-blue-950',
    card: 'bg-slate-900/60 text-white backdrop-blur-md !border-0',
    nav: 'bg-slate-950/60 backdrop-blur-md',
    navActive: 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg',
    navInactive: 'text-slate-200 hover:bg-white/5',
    badge: 'bg-slate-800/60 !border-0',
    text: 'text-white',
    subtext: 'text-slate-300',
    input: 'bg-slate-950/40 text-white',
    header: 'from-blue-700 to-slate-900',
    accent: 'bg-gradient-to-r from-blue-700 to-blue-500',
    accentHover: 'hover:from-blue-600 hover:to-blue-500',
    accentHex: '#3b82f6',
    accentText: 'text-blue-300',
    accentTextStrong: 'text-blue-200',
    accentTextHover: 'hover:text-blue-300',
    accentSoftBg: 'bg-blue-950/40',
    accentSoftBorder: 'border-transparent',
    accentDot: 'bg-blue-500',
    accentDotMuted: 'bg-blue-400',
    accentDotSoft: 'bg-blue-300',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primarySoftBg: 'bg-blue-950/40',
    primarySoftHover: 'hover:bg-blue-900/40',
    primarySoftText: 'text-blue-200',
    primarySoftBorder: 'border-transparent',
    focusBorder: 'focus:border-blue-500/40',
    focusRing: 'focus:ring-blue-500/30',
    ringAccent: 'ring-0',
    accentFill: 'fill-blue-300',
    borderColor: 'border-white/10',
    muted: 'bg-slate-800/50',
    mutedText: 'text-slate-400',
    progressTrack: 'bg-white/10',
    shadow: 'shadow-xl'
  },
  neo: {
    name: 'Neo-Brutal',
    icon: 'Palette',
    bg: 'from-yellow-200 via-fuchsia-200 to-cyan-200',
    card: 'bg-white text-slate-900 border-2 border-black',
    nav: 'bg-white',
    navActive: 'bg-black text-white border-2 border-black',
    navInactive: 'text-slate-900 hover:bg-black/5 border-2 border-transparent',
    badge: 'bg-white text-slate-900 border-2 border-black',
    text: 'text-slate-900',
    subtext: 'text-slate-700',
    input: 'bg-white text-slate-900',
    header: 'from-black via-fuchsia-600 to-cyan-500',
    accent: 'bg-fuchsia-600',
    accentHover: 'hover:bg-fuchsia-500',
    accentHex: '#c026d3',
    accentText: 'text-fuchsia-700',
    accentTextStrong: 'text-fuchsia-800',
    accentTextHover: 'hover:text-fuchsia-800',
    accentSoftBg: 'bg-fuchsia-100',
    accentSoftBorder: 'border-black',
    accentDot: 'bg-fuchsia-600',
    accentDotMuted: 'bg-fuchsia-500',
    accentDotSoft: 'bg-fuchsia-400',
    primary: 'bg-black',
    primaryHover: 'hover:bg-slate-900',
    primarySoftBg: 'bg-white',
    primarySoftHover: 'hover:bg-black/5',
    primarySoftText: 'text-slate-900',
    primarySoftBorder: 'border-black',
    focusBorder: 'focus:border-black',
    focusRing: 'focus:ring-black',
    ringAccent: 'ring-black',
    accentFill: 'fill-fuchsia-600',
    borderColor: 'border-black',
    muted: 'bg-slate-200',
    mutedText: 'text-slate-500',
    progressTrack: 'bg-black/10',
    shadow: 'shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
  },
  light: {
    name: 'Carbon',
    icon: 'Sun',
    bg: 'from-slate-950 via-slate-900 to-slate-800',
    card: 'bg-slate-900/55 text-white backdrop-blur-md !border-0',
    nav: 'bg-slate-950/60 backdrop-blur-md',
    navActive: 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg',
    navInactive: 'text-slate-200 hover:bg-white/5',
    badge: 'bg-slate-800/55 !border-0',
    text: 'text-white',
    subtext: 'text-slate-300',
    input: 'bg-slate-950/40 text-white',
    header: 'from-blue-600 to-slate-900',
    accent: 'bg-gradient-to-r from-blue-600 to-blue-500',
    accentHover: 'hover:from-blue-500 hover:to-blue-400',
    accentHex: '#3b82f6',
    accentText: 'text-blue-300',
    accentTextStrong: 'text-blue-200',
    accentTextHover: 'hover:text-blue-300',
    accentSoftBg: 'bg-blue-950/35',
    accentSoftBorder: 'border-transparent',
    accentDot: 'bg-blue-500',
    accentDotMuted: 'bg-blue-400',
    accentDotSoft: 'bg-blue-300',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primarySoftBg: 'bg-blue-950/35',
    primarySoftHover: 'hover:bg-blue-900/35',
    primarySoftText: 'text-blue-200',
    primarySoftBorder: 'border-transparent',
    focusBorder: 'focus:border-blue-500/40',
    focusRing: 'focus:ring-blue-500/30',
    accentFill: 'fill-blue-300',
    borderColor: 'border-white/10',
    muted: 'bg-slate-800/50',
    mutedText: 'text-slate-400',
    progressTrack: 'bg-white/10',
    shadow: 'shadow-xl'
  },
  classic: {
    name: 'Original',
    icon: 'Palette',
    bg: 'from-slate-950 via-slate-900 to-emerald-950',
    card: 'bg-slate-900/60 text-white backdrop-blur-md !border-0',
    nav: 'bg-slate-950/60 backdrop-blur-md',
    navActive: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg',
    navInactive: 'text-slate-200 hover:bg-white/5',
    badge: 'bg-slate-800/60 !border-0',
    text: 'text-white',
    subtext: 'text-slate-300',
    input: 'bg-slate-950/40 text-white',
    header: 'from-emerald-600 to-slate-900',
    accent: 'bg-gradient-to-r from-emerald-600 to-teal-500',
    accentHover: 'hover:from-emerald-500 hover:to-teal-400',
    accentHex: '#10b981',
    accentText: 'text-emerald-300',
    accentTextStrong: 'text-emerald-200',
    accentTextHover: 'hover:text-emerald-300',
    accentSoftBg: 'bg-emerald-950/40',
    accentSoftBorder: 'border-transparent',
    accentDot: 'bg-emerald-500',
    accentDotMuted: 'bg-emerald-400',
    accentDotSoft: 'bg-emerald-300',
    primary: 'bg-emerald-600',
    primaryHover: 'hover:bg-emerald-700',
    primarySoftBg: 'bg-emerald-950/40',
    primarySoftHover: 'hover:bg-emerald-900/35',
    primarySoftText: 'text-emerald-200',
    primarySoftBorder: 'border-transparent',
    focusBorder: 'focus:border-emerald-500/40',
    focusRing: 'focus:ring-emerald-500/30',
    accentFill: 'fill-emerald-300',
    borderColor: 'border-white/10',
    muted: 'bg-slate-800/50',
    mutedText: 'text-slate-400',
    progressTrack: 'bg-white/10',
    shadow: 'shadow-xl'
  },
  ocean: {
    hidden: true,
    name: 'Navy',
    icon: 'Palette',
    bg: 'from-slate-950 via-blue-950 to-slate-900',
    card: 'bg-slate-900/55 text-white backdrop-blur-md !border-0',
    nav: 'bg-slate-950/60 backdrop-blur-md',
    navActive: 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg',
    navInactive: 'text-slate-200 hover:bg-white/5',
    badge: 'bg-blue-950/25 !border-0',
    text: 'text-white',
    subtext: 'text-slate-300',
    input: 'bg-slate-950/40 text-white',
    header: 'from-blue-700 to-slate-900',
    accent: 'bg-gradient-to-r from-blue-700 to-blue-500',
    accentHover: 'hover:from-blue-600 hover:to-blue-500',
    accentHex: '#3b82f6',
    accentText: 'text-blue-300',
    accentTextStrong: 'text-blue-200',
    accentTextHover: 'hover:text-blue-300',
    accentSoftBg: 'bg-blue-950/40',
    accentSoftBorder: 'border-transparent',
    accentDot: 'bg-blue-500',
    accentDotMuted: 'bg-blue-400',
    accentDotSoft: 'bg-blue-300',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primarySoftBg: 'bg-blue-950/40',
    primarySoftHover: 'hover:bg-blue-900/40',
    primarySoftText: 'text-blue-200',
    primarySoftBorder: 'border-transparent',
    focusBorder: 'focus:border-blue-500/40',
    focusRing: 'focus:ring-blue-500/30',
    accentFill: 'fill-blue-300',
    borderColor: 'border-white/10',
    muted: 'bg-slate-800/50',
    mutedText: 'text-slate-400',
    progressTrack: 'bg-white/10',
    shadow: 'shadow-xl'
  },
  sunset: {
    hidden: true,
    name: 'Obsidian',
    icon: 'Palette',
    bg: 'from-black via-slate-950 to-blue-950',
    card: 'bg-slate-900/60 text-white backdrop-blur-md !border-0',
    nav: 'bg-slate-950/60 backdrop-blur-md',
    navActive: 'bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg',
    navInactive: 'text-slate-200 hover:bg-white/5',
    badge: 'bg-slate-800/60 !border-0',
    text: 'text-white',
    subtext: 'text-slate-300',
    input: 'bg-slate-950/40 text-white',
    header: 'from-blue-700 to-slate-900',
    accent: 'bg-gradient-to-r from-blue-700 to-blue-500',
    accentHover: 'hover:from-blue-600 hover:to-blue-500',
    accentHex: '#3b82f6',
    accentText: 'text-blue-300',
    accentTextStrong: 'text-blue-200',
    accentTextHover: 'hover:text-blue-300',
    accentSoftBg: 'bg-blue-950/40',
    accentSoftBorder: 'border-transparent',
    accentDot: 'bg-blue-500',
    accentDotMuted: 'bg-blue-400',
    accentDotSoft: 'bg-blue-300',
    primary: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    primarySoftBg: 'bg-blue-950/40',
    primarySoftHover: 'hover:bg-blue-900/40',
    primarySoftText: 'text-blue-200',
    primarySoftBorder: 'border-transparent',
    focusBorder: 'focus:border-blue-500/40',
    focusRing: 'focus:ring-blue-500/30',
    accentFill: 'fill-blue-300',
    borderColor: 'border-white/10',
    muted: 'bg-slate-800/50',
    mutedText: 'text-slate-400',
    progressTrack: 'bg-white/10',
    shadow: 'shadow-xl'
  }
};

// ============================================================================
// APP CONFIGURATION
// ============================================================================

/**
 * Application configuration values
 * @constant {Object}
 */
export const APP_CONFIG = {
  /** Auto-save delay in milliseconds */
  AUTO_SAVE_DELAY: 500,
  /** Notification duration in milliseconds */
  NOTIFICATION_DURATION: 5000,
  /** Session check interval in milliseconds */
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000,
  /** Attendance check interval in milliseconds */
  ATTENDANCE_CHECK_INTERVAL: 60000,
  /** Pause reminder check interval in milliseconds */
  PAUSE_REMINDER_CHECK_INTERVAL: 60000
};

/**
 * Timeout configurations
 * @constant {Object}
 */
export const TIMEOUTS = {
  /** Unlock session timeout (24 hours) */
  UNLOCK_SESSION: 24 * 60 * 60 * 1000,
  /** Admin session timeout (12 hours) */
  ADMIN_SESSION: 12 * 60 * 60 * 1000
};

/**
 * Local storage key names
 * @constant {Object}
 */
export const STORAGE_KEYS = {
  SHIFT_SCHEDULE_WEEK: 'shiftScheduleWeek',
  THEME: 'theme',
  LAST_ACTIVE_PAGE: 'lastActivePage'
};

/**
 * Validation rules for form inputs
 * @constant {Object}
 */
export const VALIDATION_RULES = {
  ORDER: {
    USERNAME_MIN_LENGTH: 2,
    USERNAME_MAX_LENGTH: 100,
    DESCRIPTION_MIN_LENGTH: 5,
    DESCRIPTION_MAX_LENGTH: 1000
  },
  EMPLOYEE: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Default export - all constants in one object
 */
export default {
  // Employee & Task Data
  INITIAL_EMPLOYEES,

  MONTH_NAMES,
  DAY_NAMES,

  // Order Constants
  ORDER_STATUS,
  ORDER_PRIORITIES,
  ORDER_PLATFORMS,
  PLATFORM_CONFIG,
  PRIORITY_CONFIG,
  STATUS_CONFIG,

  // Shift Configuration
  SHIFT_CONFIG,

  // Attendance
  ATTENDANCE_STATUS,

  // Theme
  APP_THEMES,

  // App Config
  APP_CONFIG,
  TIMEOUTS,
  STORAGE_KEYS,
  VALIDATION_RULES
};

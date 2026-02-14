import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell, X, Upload, Plus, CheckCircle, Trash2, Clock, Trophy,
  Lock, Home, ShoppingCart, BarChart3, CalendarDays, Shield, Sparkles,
  Coffee, EyeOff, Eye, Calendar, Pause, Moon, Sun, Palette
} from 'lucide-react';
import { dbService, authService } from './firebase';

// Hooks
import { useOrders } from './hooks/useOrders';

// Components
import { OrderanPage } from './components/Orderan/OrderanPage';
import { LeaderboardPage } from './components/Leaderboard/LeaderboardPage';
import { DashboardPage } from './components/Dashboard/DashboardPage';
import { StatisticsPage } from './components/Statistics/StatisticsPage';
import { ShiftSchedulePage } from './components/ShiftSchedule/ShiftSchedulePage';
import { AdminPanel } from './components/Admin/AdminPanel';
import { MbakPage } from './components/Mbak/MbakPage';

// Config & Utils (✅ Unified imports from single source)
import {
  INITIAL_EMPLOYEES,
  MONTH_NAMES,
  SHIFT_CONFIG,
  APP_THEMES,
  STORAGE_KEYS
} from './config';
import { generateYearlyAttendance } from './utils/attendanceHelpers';

// Icon mapping for theme buttons
const THEME_ICONS = {
  'Moon': Moon,
  'Sun': Sun,
  'Palette': Palette
};

const AttendanceSystem = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved && APP_THEMES[saved] ? saved : 'dark';
    } catch (e) {
      return 'dark';
    }
  });
  const [isAppLocked, setIsAppLocked] = useState(true); // App locked by default
  const [appEmail, setAppEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Check if already authenticated
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCalendar, setEditingCalendar] = useState(null); // {empName, month, day}
  const [adminTab, setAdminTab] = useState('employees'); // employees, calendar, tasks, attendance
  // newCleaningTask removed - cleaning tasks feature no longer exists
  const [isProcessing, setIsProcessing] = useState(false); // ✅ Prevent double-click on all buttons
  const isProcessingRef = useRef(false); // ✅ Ref for Firebase listener to access latest value
  const isSyncingFromFirebase = useRef(false); // Flag to prevent infinite loop
  const hasLoadedInitialData = useRef(false); // Flag to prevent saving before data loaded
  const [shouldLoadOrders, setShouldLoadOrders] = useState(false); // ✅ State to trigger orders load
  const needsImmediateSave = useRef(false); // ✅ Flag to trigger immediate save for critical actions

  // ✅ NEW: Comprehensive save tracking system
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false); // Visual feedback for saves
  const [currentAction, setCurrentAction] = useState(null); // Track current action being performed
  const activeSaveOperations = useRef(0); // Counter for active save operations
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [mbakTasks, setMbakTasks] = useState([]);

  // ✅ Use centralized theme configuration
  const currentTheme = APP_THEMES[theme] || APP_THEMES.dark;

  // ✅ PERSIST: theme preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // ✅ NEW: Action logger with visual feedback
  const logAction = (actionName, details = '') => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const logMessage = `[${timestamp}] 🔄 ${actionName}${details ? ': ' + details : ''}`;
    console.log(logMessage);
    setCurrentAction(actionName);

    // Show in-app notification
    addNotification(`⏳ ${actionName}...`, 'info', `action-${Date.now()}`);
  };

  // ✅ NEW: Success logger
  const logSuccess = (actionName, details = '') => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const logMessage = `[${timestamp}] ✅ ${actionName} berhasil${details ? ': ' + details : ''}`;
    console.log(logMessage);
    setCurrentAction(null);

    addNotification(`✅ ${actionName} berhasil!`, 'success', `success-${Date.now()}`);
  };

  // ✅ NEW: Track save operations
  const startSaveOperation = (operationName) => {
    activeSaveOperations.current += 1;
    setIsSavingToFirebase(true);
    if (!currentAction) {
      setCurrentAction(operationName);
    }
    console.log(`💾 [SAVE START] ${operationName} - Active operations: ${activeSaveOperations.current}`);
  };

  const endSaveOperation = (operationName) => {
    activeSaveOperations.current = Math.max(0, activeSaveOperations.current - 1);
    console.log(`💾 [SAVE END] ${operationName} - Active operations: ${activeSaveOperations.current}`);

    if (activeSaveOperations.current === 0) {
      setIsSavingToFirebase(false);
      setCurrentAction(null);
    }
  };

  // ✅ Use utility function for attendance generation
  const [yearlyAttendance, setYearlyAttendance] = useState(() => generateYearlyAttendance(currentYear));

  const [attentions, setAttentions] = useState([]);
  const [newAttentionText, setNewAttentionText] = useState('');
  const [newAttentionImage, setNewAttentionImage] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showAttentionSection, setShowAttentionSection] = useState(false);

  // Shift Schedule State
  const [shiftScheduleData, setShiftScheduleData] = useState([]);
  const [shiftScheduleMonth, setShiftScheduleMonth] = useState(new Date().getMonth());
  const [shiftScheduleYear, setShiftScheduleYear] = useState(new Date().getFullYear());
  const [shiftScheduleWeek, setShiftScheduleWeek] = useState(() => {
    // ✅ PERSIST: Load last viewed week from localStorage
    const saved = localStorage.getItem('shiftScheduleWeek');
    return saved ? parseInt(saved, 10) : 0;
  }); // Current week view (0-4)

  // ✅ PERSIST: Initialize ref with saved week
  const getSavedWeek = () => {
    const saved = localStorage.getItem('shiftScheduleWeek');
    return saved ? parseInt(saved, 10) : 0;
  };
  const currentWeekRef = useRef(getSavedWeek()); // Keep track of current week to prevent reset

  // ✅ PERSIST: Track current view to prevent Firebase from overwriting manual navigation
  const viewShiftScheduleRef = useRef({ month: new Date().getMonth(), year: new Date().getFullYear() });

  // Sync ref with state
  useEffect(() => {
    viewShiftScheduleRef.current = { month: shiftScheduleMonth, year: shiftScheduleYear };
  }, [shiftScheduleMonth, shiftScheduleYear]); // This effect must be separate to update ref

  // UI states for Orderan page (kept in App for now for shared access)
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [izinModal, setIzinModal] = useState(null);
  const [izinReason, setIzinReason] = useState('');
  const [productivityData, setProductivityData] = useState([]);

  // ✅ Define addNotification function EARLY (before ordersHook)
  const addNotification = (message, type = 'info', id = null) => {
    const notif = {
      id: id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: new Date().toISOString()
    };

    setNotifications(prev => {
      const recentDuplicate = prev.find(n =>
        n.message === message &&
        (Date.now() - new Date(n.timestamp).getTime()) < 5000
      );
      if (recentDuplicate) return prev;
      return [...prev, notif];
    });

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
    }, 10000);
  };


  // Deteksi shift berdasarkan jam
  const detectShift = () => {
    const hour = new Date().getHours();
    // Pagi: 09:00 - 17:00
    // Malam: 17:00 - 01:00
    return (hour >= 9 && hour < 17) ? 'pagi' : 'malam';
  };

  // Initialize employees tanpa task
  const initializeEmployees = () => {
    return [
      {
        id: 1, name: 'Desta', baseSalary: 8000000, status: 'belum', lateHours: 0,
        checkInTime: null, workTasks: [], shift: null,
        checkedIn: false, isAdmin: true, breakTime: null, breakDuration: 0,
        shiftEndAdjustment: 0, overtime: false, shifts: [], breakHistory: [],
        hasBreakToday: false, shiftEndTime: null, izinTime: null, izinHistory: [],
        completedTasksHistory: [], // Permanent storage
        isBackup: true
      },
      {
        id: 2, name: 'Ariel', baseSalary: 7000000, status: 'belum', lateHours: 0,
        checkInTime: null, workTasks: [], shift: null,
        checkedIn: false, isAdmin: false, breakTime: null, breakDuration: 0,
        shiftEndAdjustment: 0, overtime: false, shifts: [], breakHistory: [],
        hasBreakToday: false, shiftEndTime: null, izinTime: null, izinHistory: [],
        completedTasksHistory: [] // Permanent storage
      },
      {
        id: 3, name: 'Robert', baseSalary: 6500000, status: 'belum', lateHours: 0,
        checkInTime: null, workTasks: [], shift: null,
        checkedIn: false, isAdmin: false, breakTime: null, breakDuration: 0,
        shiftEndAdjustment: 0, overtime: false, shifts: [], breakHistory: [],
        hasBreakToday: false, shiftEndTime: null, izinTime: null, izinHistory: [],
        completedTasksHistory: [] // Permanent storage
      }
    ];
  };

  // Initialize with default - Firebase will sync
  const [employees, setEmployees] = useState(initializeEmployees());

  // ✅ Initialize ordersHook EARLY (right after employees state)
  const ordersHook = useOrders(addNotification, employees, isSyncingFromFirebase, { startSaveOperation, endSaveOperation });

  // ✅ CRITICAL FIX for Realtime Orders: Use a Ref to hold the latest setOrders function
  // This prevents stale closures in the useEffect listener from using an old version of the hook
  const setOrdersRef = useRef(ordersHook.setOrders);
  useEffect(() => {
    setOrdersRef.current = ordersHook.setOrders;
  }, [ordersHook.setOrders]);

  // Check-in employee dengan sistem absen otomatis
  const checkInEmployee = async (empId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    logAction('Check In', empName);

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const currentShift = detectShift();
      const shiftConfig = SHIFT_CONFIG[currentShift];

      // Get current date info for calendar update
      const currentDay = now.getDate();
      const currentMonthIndex = now.getMonth();
      const currentYearValue = now.getFullYear();

      // ✅ CRITICAL FIX: Calculate updated array FIRST
      const updated = employees.map((emp, empIndex) => {
        if (emp.id === empId) {
          // Check if already checked in this shift
          const alreadyInShift = emp.shifts.some(s => s.shift === currentShift && s.date === new Date().toDateString());

          // Check for overtime (2nd shift in same day)
          const todayShifts = emp.shifts.filter(s => s.date === new Date().toDateString());
          const isOvertime = todayShifts.length > 0;

          // Determine status based on check-in time
          let status = 'hadir';
          let lateHours = 0;
          let maxCheckInHour = shiftConfig.maxCheckIn;

          // BACKUP EMPLOYEE LOGIC: No late/overtime penalty, always 'hadir'
          if (emp.isBackup) {
            status = 'hadir';
            lateHours = 0;
          } else {
            // OVERTIME LOGIC: Check if employee had break in first shift
            if (isOvertime) {
              const firstShiftToday = todayShifts[0];
              const hadBreak = emp.breakHistory.some(b => b.date === new Date().toDateString());

              // If had break in shift 1, give +1 hour tolerance for shift 2
              if (hadBreak) {
                maxCheckInHour = shiftConfig.maxCheckIn + 1; // 17:00 + 1 = 18:00
              } else {
                maxCheckInHour = shiftConfig.maxCheckIn; // 17:00 (no tolerance)
              }
            }

            // Special handling for night shift (crosses midnight)
            // Only count as late if more than 1 minute late
            if (currentShift === 'malam') {
              // Night shift: 17:00-01:00
              if (hour >= 0 && hour < shiftConfig.end) {
                // After midnight (00:00-01:00) - definitely late
                const totalLateMinutes = (24 - maxCheckInHour) * 60 + hour * 60 + minute;
                if (totalLateMinutes > 1) {
                  status = 'telat';
                  lateHours = Math.ceil(totalLateMinutes / 60);
                }
              } else if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
                // Same day but after maxCheckIn
                const totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
                if (totalLateMinutes > 1) {
                  status = 'telat';
                  lateHours = Math.ceil(totalLateMinutes / 60);
                }
              }
            } else {
              // Day shift: normal calculation
              if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
                const totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
                if (totalLateMinutes > 1) {
                  status = 'telat';
                  lateHours = Math.ceil(totalLateMinutes / 60);
                }
              }
            }
          }

          const newShift = {
            shift: currentShift,
            checkInTime: timeStr,
            date: new Date().toDateString(),
            status: isOvertime ? 'lembur' : status,
            lateHours: lateHours,
            isOvertime: isOvertime
          };

          // Initialize empty tasks but carry over basic properties
          // Reset cleaningTasks if new shift starts (only if not overtime)
          const newWorkTasks = (emp.workTasks || []).map(t => ({
            ...t,
            startTime: null,
            endTime: null,
            completed: false, // Reset completed for manual toggle tasks
            paused: false,
            pauseStartTime: null,
            pauseHistory: []
          }));

          return {
            ...emp,
            checkedIn: true,
            checkInTime: timeStr,
            shift: currentShift,
            status: isOvertime ? 'lembur' : status,
            lateHours: lateHours,
            overtime: isOvertime,
            shifts: [...emp.shifts, newShift],
            workTasks: newWorkTasks,
            hasBreakToday: false,
            overtime: isOvertime
          };
        }
        return emp;
      });

      setEmployees(updated);

      // Update attendance record for the day (one record per day)
      const emp = updated.find(e => e.id === empId);
      if (emp) {
        const isOvertime = emp.shifts.filter(s => s.date === new Date().toDateString()).length > 1;

        // Only update main calendar status if NOT overtime
        if (!isOvertime) {
          let calendarStatus = emp.status;
          let lateHours = emp.lateHours;
          let maxCheckInHour = shiftConfig.maxCheckIn;

          if (currentShift === 'malam') {
            if (hour >= 0 && hour < shiftConfig.end) {
              // After midnight (e.g. 00:30)
              const totalLateMinutes = (24 - maxCheckInHour) * 60 + hour * 60 + minute;
              if (totalLateMinutes > 1) {
                calendarStatus = 'telat';
                lateHours = Math.ceil(totalLateMinutes / 60);
              }
            } else if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
              // Same day but after maxCheckIn
              const totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
              if (totalLateMinutes > 1) {
                calendarStatus = 'telat';
                lateHours = Math.ceil(totalLateMinutes / 60);
              }
            }
          } else {
            // Day shift: normal calculation
            if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
              const totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
              if (totalLateMinutes > 1) {
                calendarStatus = 'telat';
                lateHours = Math.ceil(totalLateMinutes / 60);
              }
            }
          }

          // Update calendar with start shift time
          console.log(`📅 Updating calendar for ${emp.name}:`, {
            month: currentMonthIndex,
            day: currentDay,
            status: calendarStatus,
            shift: currentShift,
            time: timeStr
          });

          setYearlyAttendance(prev => ({
            ...prev,
            [emp.name]: {
              ...prev[emp.name],
              [currentMonthIndex]: {
                ...prev[emp.name]?.[currentMonthIndex],
                [currentDay]: {
                  status: calendarStatus,
                  lateHours: lateHours,
                  startShift: timeStr,
                  shift: currentShift
                }
              }
            }
          }));

          console.log('✅ Calendar updated successfully');

          // ✅ CRITICAL: Trigger immediate save for calendar data
          // Employee is saved via saveEmployeeSingle below, yearlyAttendance via auto-save effect
          needsImmediateSave.current = true;
        } else {
          // Overtime: Update calendar to show 'lembur' status
          // Keep the base status (hadir/telat) from shift 1
          const currentDayData = yearlyAttendance[emp.name]?.[currentMonthIndex]?.[currentDay];
          const baseStatus = currentDayData?.status || 'hadir';
          const baseLateHours = currentDayData?.lateHours || 0;

          // Calculate late hours for shift 2 (overtime shift)
          let overtimeLateHours = 0;
          let maxCheckInHour = shiftConfig.maxCheckIn;

          // Check if had break in shift 1 for tolerance
          const hadBreak = emp.breakHistory?.some(b => b.date === new Date().toDateString());
          if (hadBreak) {
            maxCheckInHour = shiftConfig.maxCheckIn + 1;
          }

          // Calculate late hours for overtime shift
          // Only count as late if more than 1 minute late
          if (currentShift === 'malam') {
            if (hour >= 0 && hour < shiftConfig.end) {
              const totalLateMinutes = (24 - maxCheckInHour) * 60 + hour * 60 + minute;
              if (totalLateMinutes > 1) {
                overtimeLateHours = Math.ceil(totalLateMinutes / 60);
              }
            } else if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
              const totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
              if (totalLateMinutes > 1) {
                overtimeLateHours = Math.ceil(totalLateMinutes / 60);
              }
            }
          } else {
            if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
              const totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
              if (totalLateMinutes > 1) {
                overtimeLateHours = Math.ceil(totalLateMinutes / 60);
              }
            }
          }

          console.log(`📅 Updating calendar OVERTIME for ${emp.name}:`, {
            month: currentMonthIndex,
            day: currentDay,
            status: 'lembur',
            baseStatus: baseStatus,
            shift: currentShift,
            time: timeStr
          });

          setYearlyAttendance(prev => ({
            ...prev,
            [emp.name]: {
              ...prev[emp.name],
              [currentMonthIndex]: {
                ...prev[emp.name]?.[currentMonthIndex],
                [currentDay]: {
                  ...prev[emp.name]?.[currentMonthIndex]?.[currentDay],
                  status: 'lembur',
                  overtimeBaseStatus: baseStatus, // Save original status
                  lateHours: baseLateHours + overtimeLateHours, // Accumulate late hours
                  overtimeShift: currentShift,
                  overtimeCheckIn: timeStr
                }
              }
            }
          }));

          console.log('✅ Calendar updated successfully (overtime)');

          // ✅ CRITICAL: Trigger immediate save for calendar data
          // Employee is saved via saveEmployeeSingle below, yearlyAttendance via auto-save effect
          needsImmediateSave.current = true;
        }

        if (isOvertime) {
          addNotification(`⚡ ${emp.name} LEMBUR - Check-in shift ${currentShift} ke-2 (${timeStr})`, 'warning');
        } else {
          addNotification(`✅ ${emp.name} check-in shift ${currentShift} (${timeStr})`, 'success');
        }
      }

      // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
      startSaveOperation('Check In');
      const empToSave = updated.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      endSaveOperation('Check In');

      logSuccess('Check In', empName);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const [newTask, setNewTask] = useState({});
  // ✅ REMOVED DUPLICATES: currentTime, notifications, productivityData, izinModal, izinReason moved to top (lines 93-97)
  const [draggedTask, setDraggedTask] = useState(null);
  const [isLiveSync, setIsLiveSync] = useState(false); // ✅ Track real-time sync status
  const [lastSyncTime, setLastSyncTime] = useState(null); // ✅ Track last sync time
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('today');
  const [leaderboardTaskType, setLeaderboardTaskType] = useState('all'); // all, cleaning, work
  const [expandedLeaderboard, setExpandedLeaderboard] = useState(null); // employee ID to show task details
  const [statisticsTab, setStatisticsTab] = useState('history');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [pauseModal, setPauseModal] = useState(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseAllModal, setPauseAllModal] = useState(null); // For Pause All feature - stores empId
  const [pauseAllReason, setPauseAllReason] = useState(''); // Reason for pausing all tasks
  const [checkedInEmployees, setCheckedInEmployees] = useState([]);
  const [showCheckInModal, setShowCheckInModal] = useState(true);
  const [pauseReminders, setPauseReminders] = useState([]);
  const [orderReminders, setOrderReminders] = useState([]); // 🔔 Order processing reminders
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [taskBreakModal, setTaskBreakModal] = useState(null);
  const [taskBreakProgress, setTaskBreakProgress] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [showClearPassword, setShowClearPassword] = useState(false);

  // Fungsi istirahat (maksimal 1x per shift)
  const startBreak = async (empId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const emp = employees.find(e => e.id === empId);

    // Check if already took break today
    if (emp?.hasBreakToday) {
      addNotification(`⚠️ ${emp.name} sudah istirahat hari ini (maksimal 1x per shift)`, 'warning');
      return;
    }

    logAction('Mulai Istirahat', emp?.name);

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // ✅ CRITICAL FIX: Calculate updated array first
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          return {
            ...e,
            breakTime: timeStr,
            breakDuration: 1 // 1 jam istirahat
          };
        }
        return e;
      });

      // Update React state
      setEmployees(updatedEmployees);

      // Add reminder popup
      addPauseReminder(empId, 'break', 'Istirahat 1 jam');

      addNotification(`☕ ${emp?.name} mulai istirahat (${timeStr}) - Harus kembali dalam 1 jam`, 'warning');

      // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
      startSaveOperation('Mulai Istirahat');
      const empToSave = updatedEmployees.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      endSaveOperation('Mulai Istirahat');

      logSuccess('Mulai Istirahat', emp?.name);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const endBreak = async (empId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    logAction('Selesai Istirahat', empName);

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // ✅ CRITICAL FIX: Calculate updated array first
      const updatedEmployees = employees.map(emp => {
        if (emp.id === empId && emp.breakTime) {
          const [breakHour, breakMin] = emp.breakTime.split(':').map(Number);
          const breakStart = new Date();
          breakStart.setHours(breakHour, breakMin, 0);

          const diffMinutes = Math.floor((now - breakStart) / 1000 / 60);
          const isLate = diffMinutes > 60;

          // Create break record
          const breakRecord = {
            startTime: emp.breakTime,
            endTime: timeStr,
            duration: diffMinutes,
            isLate: isLate,
            lateDuration: isLate ? Math.ceil((diffMinutes - 60) / 60) : 0,
            date: now.toISOString(), // ISO for filtering
            dateDisplay: now.toLocaleString('id-ID'), // Locale for display
            shift: emp.shift
          };

          if (isLate) {
            const lateDuration = Math.ceil((diffMinutes - 60) / 60);
            addNotification(`⚠️ ${emp.name} telat kembali dari istirahat ${lateDuration} jam`, 'warning');

            return {
              ...emp,
              breakTime: null,
              hasBreakToday: true,
              shiftEndAdjustment: emp.shiftEndAdjustment + 1,
              status: 'telat',
              lateHours: emp.lateHours + lateDuration,
              breakHistory: [...emp.breakHistory, breakRecord]
            };
          }

          addNotification(`✅ ${emp.name} kembali dari istirahat (${timeStr})`, 'success');

          return {
            ...emp,
            breakTime: null,
            hasBreakToday: true,
            shiftEndAdjustment: emp.shiftEndAdjustment + 1,
            breakHistory: [...emp.breakHistory, breakRecord]
          };
        }
        return emp;
      });

      // Update React state
      setEmployees(updatedEmployees);

      // Update calendar with break activity
      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) {
        updateCalendarWithActivity(emp.name, 'break', now.toISOString());
      }

      // Dismiss break reminder
      dismissAllReminders(empId);

      // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
      startSaveOperation('Selesai Istirahat');
      const empToSave = updatedEmployees.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      endSaveOperation('Selesai Istirahat');

      logSuccess('Selesai Istirahat', empName);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  // Fungsi End Shift
  const endShift = async (empId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    logAction('Selesai Shift', empName);

    setIsProcessing(true);
    isProcessingRef.current = true;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDate();
    const currentMonthIndex = now.getMonth();

    const foundEmp = employees.find(e => e.id === empId);
    console.log(`🔍 Employee found: ${foundEmp?.name}, checkedIn: ${foundEmp?.checkedIn}`);

    // ✅ CRITICAL FIX: Calculate updated employees array FIRST
    const updatedEmployees = employees.map(emp => {
      if (emp.id === empId && emp.checkedIn) {
        // Save work tasks to history (cleaning tasks feature removed)
        const allWorkTasks = (emp.workTasks || []).map(t => ({
          ...t,
          taskType: 'work',
          endShiftTime: timeStr,
          shiftDate: now.toDateString(),
          completedAtDisplay: t.completedAtDisplay || t.completedAt || timeStr
        }));

        // Merge with existing history (remove duplicates)
        const newHistory = [
          ...(emp.completedTasksHistory || []),
          ...allWorkTasks.filter(newTask =>
            !(emp.completedTasksHistory || []).some(h => h.id === newTask.id && h.shiftDate === newTask.shiftDate)
          )
        ];

        // Update shift record with end time
        const updatedShifts = (emp.shifts || []).map((s, idx) => {
          if (idx === emp.shifts.length - 1) {
            return { ...s, endTime: timeStr };
          }
          return s;
        });

        console.log(`📊 ${emp.name} end shift: ${allWorkTasks.length} tasks archived (shiftDate: ${now.toDateString()})`);

        // Update employee data
        const updatedEmployee = {
          ...emp,
          checkedIn: false, // ✅ CRITICAL: Set to false
          shiftEndTime: timeStr,
          shift: null,
          breakTime: null,
          hasBreakToday: false,
          shifts: updatedShifts,
          workTasks: [],
          completedTasksHistory: newHistory
        };

        console.log(`✅ ${emp.name} updated: checkedIn=${updatedEmployee.checkedIn}, tasks cleared, history=${updatedEmployee.completedTasksHistory.length}`);

        return updatedEmployee;
      }
      return emp;
    });

    // Update calendar with end shift time
    setYearlyAttendance(prevAttendance => ({
      ...prevAttendance,
      [foundEmp?.name]: {
        ...prevAttendance[foundEmp?.name],
        [currentMonthIndex]: {
          ...prevAttendance[foundEmp?.name]?.[currentMonthIndex],
          [currentDay]: {
            ...prevAttendance[foundEmp?.name]?.[currentMonthIndex]?.[currentDay],
            endShift: timeStr
          }
        }
      }
    }));

    // ✅ Update React state with new array
    setEmployees(updatedEmployees);

    addNotification(`🏁 ${foundEmp?.name} selesai shift (${timeStr})`, 'success');

    // ✅ CRITICAL FIX: Save the UPDATED employee directly (Transaction)
    startSaveOperation('Selesai Shift');
    try {
      const empToSave = updatedEmployees.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      console.log('✅ Single save to Firebase completed');
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error);
    }
    endSaveOperation('Selesai Shift');

    // ✅ VERIFICATION: Check what was actually saved to Firebase
    try {
      const savedData = await dbService.getEmployees();
      const savedEmp = savedData?.data?.find(e => e.id === empId);
      console.log(`🔍 VERIFICATION: Firebase has ${savedEmp?.name || 'UNKNOWN'} (id=${empId}) checkedIn=${savedEmp?.checkedIn}, history=${savedEmp?.completedTasksHistory?.length}`);

      if (savedEmp?.checkedIn === false) {
        console.log(`✅ VERIFIED: Firebase correctly saved ${savedEmp.name} checkedIn=false`);
      } else {
        console.error(`❌ VERIFICATION FAILED: Firebase has ${savedEmp?.name || 'UNKNOWN'} checkedIn=${savedEmp?.checkedIn} (expected: false)`);

        // Also log what Firebase has for ALL employees
        console.log('🔍 All employees in Firebase:', savedData?.data?.map(e => `${e.name}: checkedIn=${e.checkedIn}`));
      }
    } catch (error) {
      console.error(`❌ Verification error:`, error);
    }

    logSuccess('Selesai Shift', foundEmp?.name);
    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  // Fungsi Izin
  const startIzin = (empId) => {
    setIzinModal(empId);
  };

  const confirmIzin = async () => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    if (!izinReason.trim()) {
      alert('Harap berikan alasan izin!');
      return;
    }

    const empId = izinModal;
    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    logAction('Izin', `${empName} - ${izinReason}`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    const now = new Date();
    const hour = now.getHours();
    const timeStr = `${hour.toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // ✅ CRITICAL FIX: Calculate updated array first
    const updatedEmployees = employees.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          izinTime: timeStr,
          izinReason: izinReason
        };
      }
      return emp;
    });

    const emp = updatedEmployees.find(e => e.id === empId);

    // Update React state
    setEmployees(updatedEmployees);

    // DO NOT update calendar - izin is just a temporary break, not a full day off
    // Calendar should keep the check-in status (hadir/telat)

    // Add reminder popup
    addPauseReminder(empId, 'izin', izinReason);

    addNotification(`📋 ${emp?.name} izin: ${izinReason} (${timeStr})`, 'warning');
    setIzinModal(null);
    setIzinReason('');

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Izin');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Izin');

    logSuccess('Izin', empName);
    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  const endIzin = async (empId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    logAction('Selesai Izin', empName);

    setIsProcessing(true);
    isProcessingRef.current = true;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // ✅ CRITICAL FIX: Calculate updated array first
    const updatedEmployees = employees.map(emp => {
      if (emp.id === empId && emp.izinTime) {
        const [izinHour, izinMin] = emp.izinTime.split(':').map(Number);
        const izinStart = new Date();
        izinStart.setHours(izinHour, izinMin, 0);

        const diffMinutes = Math.floor((now - izinStart) / 1000 / 60);

        // Create izin record
        const izinRecord = {
          startTime: emp.izinTime,
          endTime: timeStr,
          duration: diffMinutes,
          reason: emp.izinReason,
          date: now.toISOString(), // ISO for filtering
          dateDisplay: now.toLocaleString('id-ID'), // Locale for display
          shift: emp.shift
        };

        return {
          ...emp,
          izinTime: null,
          izinReason: null,
          izinHistory: [...emp.izinHistory, izinRecord]
        };
      }
      return emp;
    });

    const emp = updatedEmployees.find(e => e.id === empId);

    // Update React state
    setEmployees(updatedEmployees);

    // Update calendar with izin activity
    if (emp) {
      updateCalendarWithActivity(emp.name, 'izin', now.toISOString());
    }

    // Dismiss izin reminder
    dismissAllReminders(empId);

    addNotification(`✅ ${emp?.name} selesai izin (${timeStr})`, 'success');

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Selesai Izin');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Selesai Izin');

    logSuccess('Selesai Izin', empName);
    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  // Fungsi Pause Reminder
  const addPauseReminder = (empId, type, reason = '') => {
    const emp = employees.find(e => e.id === empId);
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const reminder = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      empId: empId,
      empName: emp?.name,
      type: type, // 'break', 'izin', 'task'
      reason: reason,
      startTime: timeStr,
      timestamp: now.getTime()
    };

    setPauseReminders(prev => [...prev, reminder]);
  };

  const dismissReminder = (reminderId) => {
    setPauseReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const dismissAllReminders = (empId) => {
    setPauseReminders(prev => prev.filter(r => r.empId !== empId));
  };

  // 🔔 Order Reminder Functions
  const addOrderReminder = (orderId, orderData) => {
    console.log('🔔 ADD ORDER REMINDER CALLED:', orderId, orderData.username);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const reminder = {
      id: `order-${orderId}-${Date.now()}`,
      orderId: orderId,
      username: orderData.username,
      description: orderData.description,
      platform: orderData.platform,
      priority: orderData.priority,
      startTime: timeStr,
      timestamp: now.getTime()
    };

    console.log('📌 Creating reminder:', reminder);

    setOrderReminders(prev => {
      // Remove existing reminder for same order (if any)
      const filtered = prev.filter(r => r.orderId !== orderId);
      const newReminders = [...filtered, reminder];
      console.log('📌 Order reminders updated:', newReminders.length);
      return newReminders;
    });
  };

  const dismissOrderReminder = (reminderId) => {
    setOrderReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  const dismissOrderReminderByOrderId = (orderId) => {
    setOrderReminders(prev => prev.filter(r => r.orderId !== orderId));
  };

  // Notification sound function
  const playNotificationSound = (type = 'success') => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      // Success sound: C-E-G chord (happy sound)
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    } else if (type === 'warning') {
      // Warning sound: descending tone
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
    }

    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editingCell && !e.target.closest('.edit-modal') && !e.target.closest('.calendar-cell')) {
        setEditingCell(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editingCell]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+N: Add new task (focus first empty input)
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        const firstInput = document.querySelector('input[type="text"][placeholder*="Task"]');
        if (firstInput) firstInput.focus();
      }
      // Ctrl+D: Go to Dashboard
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setActivePage('dashboard');
      }
      // Ctrl+L: Go to Leaderboard
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        setActivePage('leaderboard');
      }
      // Ctrl+S: Go to Statistics
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setActivePage('statistics');
      }
      // Ctrl+T: Toggle theme
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        const themes = Object.keys(APP_THEMES).filter(t => !APP_THEMES[t]?.hidden);
        const currentIndex = themes.indexOf(theme);
        setTheme(themes[(currentIndex + 1) % themes.length] || 'dark');
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [theme]);

  // Auto-check attendance status setiap menit
  useEffect(() => {
    const checkAttendanceStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      const currentDay = now.getDate();
      const currentMonthIndex = now.getMonth();
      const currentShift = detectShift();
      const shiftConfig = SHIFT_CONFIG[currentShift];

      setEmployees(prev => {
        let hasChanges = false;
        const updated = prev.map(emp => {
          // Skip if already checked in
          if (emp.checkedIn) return emp;

          // Calculate hours from shift start (handle midnight crossing for night shift)
          let hoursFromShiftStart;
          if (currentShift === 'malam') {
            // Night shift: 17:00-01:00
            if (hour >= 0 && hour < shiftConfig.end) {
              // After midnight (00:00-01:00)
              hoursFromShiftStart = (24 - shiftConfig.start) + hour;
            } else {
              // Before midnight (17:00-23:59)
              hoursFromShiftStart = hour - shiftConfig.start;
            }
          } else {
            // Day shift: simple calculation
            hoursFromShiftStart = hour - shiftConfig.start;
          }

          // Mark as libur if 3+ hours past shift start and not checked in
          if (hoursFromShiftStart >= 3 && emp.status === 'belum') {
            hasChanges = true;
            // Update calendar to 'libur'
            setYearlyAttendance(prevAttendance => ({
              ...prevAttendance,
              [emp.name]: {
                ...prevAttendance[emp.name],
                [currentMonthIndex]: {
                  ...prevAttendance[emp.name]?.[currentMonthIndex],
                  [currentDay]: {
                    status: 'libur',
                    lateHours: 0,
                    shift: currentShift
                  }
                }
              }
            }));

            return {
              ...emp,
              status: 'libur'
            };
          }

          return emp;
        });

        // Only return updated if there are actual changes
        return hasChanges ? updated : prev;
      });
    };

    const interval = setInterval(checkAttendanceStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []); // Empty dependency - runs once and uses interval

  // Update pause reminders every minute for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setPauseReminders(prev => [...prev]); // Force re-render to update elapsed time
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Update order reminders every minute for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderReminders(prev => [...prev]); // Force re-render to update elapsed time
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Debug: Log when orderReminders state changes (DEV only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 ORDER REMINDERS STATE CHANGED:', orderReminders.length, 'reminders');
      if (orderReminders.length > 0) {
        console.log('📌 Active reminders:', orderReminders);
      }
    }
  }, [orderReminders]);

  // Check app unlock status and Firebase Auth on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Function to check session expiry
        const checkSessionExpiry = async () => {
          const isUnlocked = sessionStorage.getItem('appUnlocked');
          const unlockExpiry = sessionStorage.getItem('appUnlockExpiry');

          if (isUnlocked === 'true' && unlockExpiry) {
            const expiryTime = parseInt(unlockExpiry);
            if (Date.now() < expiryTime) {
              // Session still valid - load data from Firebase
              console.log('✅ App unlock session valid - loading data...');

              try {
                const initialData = await dbService.loadInitialData();

                if (initialData) {
                  // Set data from Firebase
                  if (initialData.employees) {
                    console.log('✅ Restoring employees:', initialData.employees.length);

                    // ✅ DEBUG: Log checkedIn status from Firebase
                    initialData.employees.forEach(emp => {
                      console.log(`📥 Firebase Load: ${emp.name} - checkedIn=${emp.checkedIn}, history=${emp.completedTasksHistory?.length || 0}`);
                    });

                    // ✅ CRITICAL FIX: Merge with existing local state if any
                    setEmployees(prevEmployees => {
                      // Hydrate and merge Firebase data with static config
                      return initialData.employees.map(firebaseEmp => {
                        const localEmp = prevEmployees?.find(e => e.id === firebaseEmp.id);
                        const staticEmp = INITIAL_EMPLOYEES.find(e => e.id === firebaseEmp.id) || {};

                        // Merge completedTasksHistory from both sources
                        const localHistory = localEmp?.completedTasksHistory || [];
                        const firebaseHistory = (firebaseEmp.completedTasksHistory || []).map(task => {
                          // ✅ MIGRATION: Fix old tasks missing shiftDate
                          if (!task.shiftDate && task.completedAt) {
                            try {
                              task.shiftDate = new Date(task.completedAt).toDateString();
                            } catch (e) { }
                          }
                          return task;
                        });

                        const allHistory = [...localHistory, ...firebaseHistory];
                        const mergedHistory = allHistory.filter((task, index, self) =>
                          index === self.findIndex((t) => t.id === task.id && t.shiftDate === task.shiftDate)
                        );

                        return {
                          ...staticEmp,   // Hydrate with static config (isBackup, etc.)
                          ...firebaseEmp, // Use data from Firebase
                          completedTasksHistory: mergedHistory,
                          isBackup: staticEmp.isBackup || false,
                          isAdmin: firebaseEmp.isAdmin !== undefined ? firebaseEmp.isAdmin : staticEmp.isAdmin
                        };
                      });
                    });
                  }
                  if (initialData.yearlyAttendance) {
                    console.log('✅ Restoring yearly attendance');
                    setYearlyAttendance(initialData.yearlyAttendance);
                  }
                  if (initialData.productivityData) {
                    console.log('✅ Restoring productivity data:', initialData.productivityData.length);
                    setProductivityData(initialData.productivityData);
                  }
                  if (initialData.attentions) {
                    console.log('✅ Restoring attentions:', initialData.attentions.length);
                    setAttentions(initialData.attentions);
                  }
                  if (initialData.currentPeriod) {
                    console.log('✅ Restoring current period');
                    setCurrentMonth(initialData.currentPeriod.currentMonth);
                    setCurrentYear(initialData.currentPeriod.currentYear);
                  }
                  if (initialData.shiftSchedule) {
                    // Support both old format (scheduleData) and new format (data)
                    const scheduleArray = initialData.shiftSchedule.data || initialData.shiftSchedule.scheduleData;

                    console.log('✅ Restoring shift schedule:', {
                      hasData: !!scheduleArray,
                      dataLength: scheduleArray?.length || 0
                    });

                    if (scheduleArray && Array.isArray(scheduleArray)) {
                      setShiftScheduleData(scheduleArray);
                      setShiftScheduleMonth(initialData.shiftSchedule.month || new Date().getMonth());
                      setShiftScheduleYear(initialData.shiftSchedule.year || new Date().getFullYear());
                      // ✅ PERSIST: Keep saved week on initial load (don't reset to 0)
                      // setShiftScheduleWeek(0); // REMOVED - now uses localStorage
                    }
                  }
                  // Mark that initial data has been loaded
                  hasLoadedInitialData.current = true;
                  console.log('✅ Initial data loaded - saves now enabled');

                  // ✅ Request browser notification permission
                  if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        console.log('✅ Browser notification permission granted');
                      } else {
                        console.log('⚠️ Browser notification permission denied');
                      }
                    });
                  }

                  // ✅ Trigger orders load (will be handled by useEffect after ordersHook is ready)
                  setShouldLoadOrders(true);

                  // Run migration after data loaded
                  setTimeout(() => {
                    migrateCompletedTasksToHistory();
                  }, 1000); // Wait 1 second for state to settle
                }
              } catch (error) {
                console.error('❌ Error loading initial data:', error);
              }

              setIsAppLocked(false);
              return true;
            } else {
              // Session expired
              console.log('⏰ App unlock session expired');
              sessionStorage.removeItem('appUnlocked');
              sessionStorage.removeItem('appUnlockExpiry');
              setIsAppLocked(true);
              addNotification('⏰ Session expired. Please login again.', 'warning');
              return false;
            }
          }
          return false;
        };

        // Check session on mount
        await checkSessionExpiry();

        // Check session every 5 minutes
        const sessionCheckInterval = setInterval(() => {
          checkSessionExpiry();
        }, 5 * 60 * 1000); // 5 minutes

        // Check Firebase Auth for admin status (only if app unlocked)
        const unsubscribe = authService.onAuthStateChange((user) => {
          if (user) {
            console.log('✅ User authenticated:', user.email);
            // Check if user is admin - ONLY josepratama157@gmail.com
            if (user.email === 'josepratama157@gmail.com') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } else {
            console.log('❌ No user authenticated');
            setIsAdmin(false);
          }
        });

        setIsCheckingAuth(false);
        return { unsubscribe, sessionCheckInterval };
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
        setIsCheckingAuth(false);
        return { unsubscribe: null, sessionCheckInterval: null };
      }
    };

    const cleanup = checkAuthStatus();
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(({ unsubscribe, sessionCheckInterval }) => {
          if (unsubscribe) unsubscribe();
          if (sessionCheckInterval) clearInterval(sessionCheckInterval);
        });
      }
    };
  }, []);

  // Setup Firebase realtime listeners (only when app is unlocked)
  useEffect(() => {
    // Don't setup listeners if app is locked
    if (isAppLocked || isCheckingAuth) {
      console.log('⏸️ Skipping Firebase listeners - app locked or checking auth');
      return;
    }

    console.log('🔥 Setting up Firebase realtime listeners...');

    try {
      // Listen to employees changes
      const unsubscribeEmployees = dbService.onEmployeesChange((data) => {
        // ✅ CRITICAL FIX: Skip Firebase sync while processing user action
        if (isProcessingRef.current) {
          console.log('⏸️ Skipping Firebase sync - user action in progress');
          return;
        }

        if (data && Array.isArray(data)) {
          // ✅ MIGRATION: Fix old tasks missing shiftDate
          const migratedData = data.map(emp => ({
            ...emp,
            completedTasksHistory: (emp.completedTasksHistory || []).map(task => {
              if (!task.shiftDate && task.completedAt) {
                try {
                  task.shiftDate = new Date(task.completedAt).toDateString();
                } catch (e) {
                  // Leave undefined if parsing fails
                }
              }
              return task;
            })
          }));

          // ✅ Log received data
          const historyCount = migratedData.reduce((sum, emp) => sum + (emp.completedTasksHistory?.length || 0), 0);
          console.log('📥 Firebase sync:', migratedData.length, 'employees,', historyCount, 'history tasks');

          // ✅ REALTIME: Update sync status and show visual indicator
          setIsLiveSync(true);
          setLastSyncTime(new Date());
          setTimeout(() => setIsLiveSync(false), 2000); // Show indicator for 2 seconds

          isSyncingFromFirebase.current = true;

          // ✅ AUTO-RESET: Reset sync flag after processing
          setTimeout(() => {
            isSyncingFromFirebase.current = false;
          }, 100);

          // ✅ CRITICAL FIX: Smart sync - protect active shifts but allow end shift sync
          setEmployees(prevEmployees => {
            return migratedData.map((firebaseEmp, idx) => {
              const localEmp = prevEmployees.find(e => e.id === firebaseEmp.id);
              const staticEmp = INITIAL_EMPLOYEES.find(e => e.id === firebaseEmp.id) || {};

              if (localEmp) {
                // 🔒 SMART PROTECTION: Only protect if local is checked in AND Firebase is also checked in
                // This allows end shift to sync properly (Firebase checkedIn: false will be accepted)
                const localIsCheckedIn = localEmp.checkedIn === true;
                const firebaseIsCheckedIn = firebaseEmp.checkedIn === true;

                if (process.env.NODE_ENV === 'development') {
                  console.log(`🔍 SYNC CHECK: ${localEmp.name} - Local checkedIn: ${localIsCheckedIn}, Firebase checkedIn: ${firebaseIsCheckedIn}`);
                }

                // Case 1: Local checked in, Firebase also checked in
                // → Protect local data BUT merge task completion status
                if (localIsCheckedIn && firebaseIsCheckedIn) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(`🔒 PROTECTED: ${localEmp.name} is checked in - preserving local shift data`);
                  }

                  // ✅ CRITICAL FIX: Merge task completion status from both sources
                  // ✅ FIX BUG: Don't restore tasks that were ended (moved to history)
                  const mergeTaskCompletions = (localTasks, firebaseTasks, completedHistory) => {
                    // Build set of task IDs that are in history (ended tasks)
                    const historyIds = new Set((completedHistory || []).map(t => t.id));

                    // Filter Firebase tasks - remove any that are in history
                    const filteredFirebaseTasks = (firebaseTasks || []).filter(ft => !historyIds.has(ft.id));

                    if (!localTasks || localTasks.length === 0) {
                      return filteredFirebaseTasks;
                    }

                    // Create map of local task IDs for quick lookup
                    const localTaskIds = new Set(localTasks.map(t => t.id));

                    // Merge: if task is completed in EITHER local or Firebase, mark as completed
                    const mergedTasks = localTasks
                      .filter(localTask => filteredFirebaseTasks.some(ft => ft.id === localTask.id)) // ✅ CRITICAL: Remove if deleted in Firebase
                      .map(localTask => {
                        const firebaseTask = filteredFirebaseTasks.find(ft => ft.id === localTask.id);
                        if (firebaseTask) {
                          // If completed in either source, mark as completed
                          const isCompleted = localTask.completed || firebaseTask.completed;

                          // ✅ CRITICAL FIX: Preserve pause state from local (more recent than Firebase)
                          const preservePauseState = localTask.paused || localTask.pauseStartTime || (localTask.pauseHistory && localTask.pauseHistory.length > 0);

                          return {
                            ...firebaseTask,
                            ...localTask,
                            completed: isCompleted,
                            progress: isCompleted ? 100 : Math.max(localTask.progress || 0, firebaseTask.progress || 0),
                            completedAt: isCompleted ? (localTask.completedAt || firebaseTask.completedAt) : null,
                            paused: preservePauseState ? localTask.paused : firebaseTask.paused,
                            pauseStartTime: preservePauseState ? localTask.pauseStartTime : firebaseTask.pauseStartTime,
                            pauseHistory: preservePauseState ? localTask.pauseHistory : firebaseTask.pauseHistory
                          };
                        }
                        return localTask;
                      });

                    // ✅ CRITICAL: Add Firebase tasks that don't exist locally (but not in history)
                    const newFirebaseTasks = filteredFirebaseTasks.filter(ft => !localTaskIds.has(ft.id));

                    return [...mergedTasks, ...newFirebaseTasks];
                  };

                  // Cleaning tasks feature removed - only merge work tasks
                  const mergedWorkTasks = mergeTaskCompletions(localEmp.workTasks, firebaseEmp.workTasks, localEmp.completedTasksHistory);

                  // ✅ CRITICAL: Also merge completedTasksHistory (union, no duplicates)
                  const localHistory = localEmp.completedTasksHistory || [];
                  const firebaseHistory = firebaseEmp.completedTasksHistory || [];
                  const allHistoryTasks = [...localHistory, ...firebaseHistory];
                  const mergedHistory = allHistoryTasks.filter((task, index, self) =>
                    index === self.findIndex((t) => t.id === task.id && t.completedAt === task.completedAt)
                  );

                  if (process.env.NODE_ENV === 'development') {
                    console.log(`🔄 MERGE: ${localEmp.name} - Work: ${localEmp.workTasks?.length || 0}→${mergedWorkTasks.length}, History: ${localHistory.length}→${mergedHistory.length}`);
                  }

                  return {
                    ...staticEmp,   // Hydrate with static config (isBackup, etc.)
                    ...localEmp,    // Keep core local shift data (checkedIn, etc.)

                    // ✅ Merge task completions from both sources
                    workTasks: mergedWorkTasks,
                    completedTasksHistory: mergedHistory,

                    // ✅ SYNC REFINEMENT: Allow these fields to sync from Firebase even while local is checked in
                    // This ensures admin changes from other PCs appear immediately
                    lateHours: firebaseEmp.lateHours !== undefined ? firebaseEmp.lateHours : localEmp.lateHours,
                    checkInTime: firebaseEmp.checkInTime || localEmp.checkInTime,
                    shift: firebaseEmp.shift || localEmp.shift,
                    shiftEndTime: firebaseEmp.shiftEndTime || localEmp.shiftEndTime,
                    status: firebaseEmp.status || localEmp.status,
                    overtime: firebaseEmp.overtime !== undefined ? firebaseEmp.overtime : localEmp.overtime,
                    baseSalary: firebaseEmp.baseSalary || localEmp.baseSalary || staticEmp.baseSalary,
                    izinTime: firebaseEmp.izinTime || localEmp.izinTime,
                    adminTab: firebaseEmp.adminTab || localEmp.adminTab,
                    shiftEndAdjustment: firebaseEmp.shiftEndAdjustment !== undefined ? firebaseEmp.shiftEndAdjustment : localEmp.shiftEndAdjustment,

                    // Core props
                    isBackup: staticEmp.isBackup || false,
                    isAdmin: firebaseEmp.isAdmin !== undefined ? firebaseEmp.isAdmin : (localEmp.isAdmin !== undefined ? localEmp.isAdmin : staticEmp.isAdmin)
                  };
                }

                // Case 2: Local checked in, Firebase NOT checked in
                // → Someone ended shift in another browser, ACCEPT Firebase update
                // ✅ CRITICAL FIX: Smart merge completedTasksHistory from BOTH sources
                else if (localIsCheckedIn && !firebaseIsCheckedIn) {
                  console.log(`✅ SYNC: ${localEmp.name} ended shift in another browser - syncing`);

                  // Smart merge completedTasksHistory (union of both, no duplicates)
                  const localHistory = localEmp.completedTasksHistory || [];
                  const firebaseHistory = firebaseEmp.completedTasksHistory || [];

                  // Combine and remove duplicates based on task ID
                  const allHistoryTasks = [...localHistory, ...firebaseHistory];
                  const mergedHistory = allHistoryTasks.filter((task, index, self) =>
                    index === self.findIndex((t) => t.id === task.id && t.shiftDate === task.shiftDate)
                  );

                  if (process.env.NODE_ENV === 'development') {
                    console.log(`🔄 MERGE HISTORY (Case 2): ${localEmp.name} - Local: ${localHistory.length}, Firebase: ${firebaseHistory.length}, Merged: ${mergedHistory.length}`);
                  }

                  return {
                    ...staticEmp,
                    ...firebaseEmp,
                    // ✅ CRITICAL: Preserve ALL completed tasks from both sources
                    completedTasksHistory: mergedHistory,
                    isBackup: staticEmp.isBackup || false
                  };
                }

                // Case 3: Local NOT checked in, Firebase checked in
                // → Someone started shift in another browser, ACCEPT Firebase update
                // ✅ CRITICAL FIX: ALWAYS preserve completedTasksHistory from BOTH sources
                else if (!localIsCheckedIn && firebaseIsCheckedIn) {
                  console.log(`✅ SYNC: ${localEmp.name} started shift in another browser - syncing`);

                  // Smart merge completedTasksHistory (union of both, no duplicates)
                  const localHistory = localEmp.completedTasksHistory || [];
                  const firebaseHistory = firebaseEmp.completedTasksHistory || [];

                  // Combine and remove duplicates based on task ID
                  const allHistoryTasks = [...localHistory, ...firebaseHistory];
                  const mergedHistory = allHistoryTasks.filter((task, index, self) =>
                    index === self.findIndex((t) => t.id === task.id && t.shiftDate === task.shiftDate)
                  );

                  if (process.env.NODE_ENV === 'development') {
                    console.log(`🔄 MERGE HISTORY: ${localEmp.name} - Local: ${localHistory.length}, Firebase: ${firebaseHistory.length}, Merged: ${mergedHistory.length}`);
                  }

                  return {
                    ...staticEmp,
                    ...firebaseEmp,
                    // ✅ CRITICAL: Preserve ALL completed tasks from both sources
                    completedTasksHistory: mergedHistory,
                    isBackup: staticEmp.isBackup || false
                  };
                }

                // Case 4: Both NOT checked in - do smart merge with task completion
                else {
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`🔄 CASE 4: ${localEmp.name} - Both not checked in, merging data`);
                  }

                  // Cleaning tasks feature removed - only track work tasks
                  const hasLocalWorkTasks = localEmp.workTasks && localEmp.workTasks.length > 0;
                  const hasFirebaseWorkTasks = firebaseEmp.workTasks && firebaseEmp.workTasks.length > 0;

                  // ✅ CRITICAL FIX: Merge task completion even when not checked in
                  const mergeTaskCompletions = (localTasks, firebaseTasks) => {
                    if (!localTasks || localTasks.length === 0) return firebaseTasks || [];

                    // Merge: if task is completed in EITHER local or Firebase, mark as completed
                    return firebaseTasks.map(firebaseTask => {
                      const localTask = localTasks.find(lt => lt.id === firebaseTask.id);
                      if (localTask) {
                        const isCompleted = localTask.completed || firebaseTask.completed;
                        return {
                          ...firebaseTask,
                          completed: isCompleted,
                          progress: isCompleted ? 100 : Math.max(localTask.progress || 0, firebaseTask.progress || 0),
                          completedAt: isCompleted ? (localTask.completedAt || firebaseTask.completedAt) : null
                        };
                      }
                      return firebaseTask;
                    });
                  };

                  // ✅ CRITICAL FIX: Smart merge completedTasksHistory from BOTH sources
                  const localHistory = localEmp.completedTasksHistory || [];
                  const firebaseHistory = firebaseEmp.completedTasksHistory || [];

                  // Combine and remove duplicates based on task ID and shiftDate
                  const allHistoryTasks = [...localHistory, ...firebaseHistory];
                  const mergedHistory = allHistoryTasks.filter((task, index, self) =>
                    index === self.findIndex((t) => t.id === task.id && t.shiftDate === task.shiftDate)
                  );

                  console.log(`🔄 MERGE HISTORY (Case 4): ${localEmp.name} - Local: ${localHistory.length}, Firebase: ${firebaseHistory.length}, Merged: ${mergedHistory.length}`);

                  return {
                    ...staticEmp,
                    ...firebaseEmp,
                    workTasks: firebaseEmp.workTasks
                      ? mergeTaskCompletions(localEmp.workTasks, firebaseEmp.workTasks)
                      : (localEmp.workTasks || []),
                    // ✅ CRITICAL: Always merge history from BOTH sources (never overwrite)
                    completedTasksHistory: mergedHistory,
                    isBackup: staticEmp.isBackup || false
                  };
                }
              }

              // No local employee found - return Firebase data
              // ✅ Ensure completedTasksHistory is always an array
              return {
                ...staticEmp,
                ...firebaseEmp,
                completedTasksHistory: firebaseEmp.completedTasksHistory || [],
                isBackup: staticEmp.isBackup || false
              };
            });
          });

          setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
        } else {
          console.warn('⚠️ No employees data from Firebase or invalid format');
        }
      });

      // Listen to attentions changes
      const unsubscribeAttentions = dbService.onAttentionsChange((data) => {
        if (data && Array.isArray(data)) {
          console.log('📥 RECEIVED FROM FIREBASE - ATTENTIONS:', {
            count: data.length,
            active: data.filter(a => !a.completed).length,
            timestamp: new Date().toLocaleTimeString()
          });

          // ✅ REALTIME: Update sync indicator
          setIsLiveSync(true);
          setLastSyncTime(new Date());
          setTimeout(() => setIsLiveSync(false), 2000);

          isSyncingFromFirebase.current = true;

          // ✅ SMART MERGE: Merge readBy arrays to prevent overwrite
          setAttentions(prevAttentions => {
            return data.map(firebaseAtt => {
              const localAtt = prevAttentions.find(a => a.id === firebaseAtt.id);

              if (localAtt) {
                // Merge readBy arrays (union of both)
                const localReadBy = localAtt.readBy || [];
                const firebaseReadBy = firebaseAtt.readBy || [];

                // Combine both arrays and remove duplicates
                const mergedReadBy = [...new Set([...localReadBy, ...firebaseReadBy])];

                // Check if all employees have read
                // Note: Using employees from closure is acceptable since employee names rarely change
                // If you need fresh data, consider using a ref or passing employee count
                const allEmployeeNames = employees.map(e => e.name);
                const allRead = allEmployeeNames.every(name => mergedReadBy.includes(name));

                console.log(`🔄 MERGE ATTENTION: ${firebaseAtt.id} - Local: ${localReadBy.length}, Firebase: ${firebaseReadBy.length}, Merged: ${mergedReadBy.length}`);

                return {
                  ...firebaseAtt,
                  readBy: mergedReadBy,
                  completed: allRead || firebaseAtt.completed // Auto complete when all read
                };
              }

              return firebaseAtt;
            });
          });

          setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
        }
      });

      // Listen to yearly attendance changes
      const unsubscribeYearlyAttendance = dbService.onYearlyAttendanceChange((data) => {
        if (data && typeof data === 'object') {
          console.log('📥 Received yearly attendance from Firebase');
          isSyncingFromFirebase.current = true;
          setYearlyAttendance(data);
          setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
        } else {
          console.warn('⚠️ No yearly attendance data from Firebase');
        }
      });

      // Listen to productivity data changes
      const unsubscribeProductivityData = dbService.onProductivityDataChange((data) => {
        if (data && Array.isArray(data)) {
          isSyncingFromFirebase.current = true;
          setProductivityData(data);
          setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
        }
      });

      // Listen to current period changes
      const unsubscribeCurrentPeriod = dbService.onCurrentPeriodChange((month, year) => {
        isSyncingFromFirebase.current = true;
        if (month !== undefined) setCurrentMonth(month);
        if (year !== undefined) setCurrentYear(year);
        setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
      });

      // shiftTasks listener removed - cleaning tasks feature no longer exists
      const unsubscribeShiftTasks = () => { }; // Dummy to avoid breaking cleanup logic if not careful

      // Listen to shift schedule changes
      const unsubscribeShiftSchedule = dbService.onShiftScheduleChange((data) => {
        if (data && typeof data === 'object') {
          // Support both old format (scheduleData) and new format (data)
          const scheduleArray = data.data || data.scheduleData;

          if (scheduleArray && Array.isArray(scheduleArray)) {
            console.log('🔄 Firebase shift schedule update:', { dataLength: scheduleArray.length, month: data.month, year: data.year });
            isSyncingFromFirebase.current = true;

            // ✅ CRITICAL FIX: Only update if the received data matches the User's current view
            // This prevents "jumping back" to the saved month when user is browsing other months
            const currentView = viewShiftScheduleRef.current;
            const isSameMonth = currentView.month === (data.month || new Date().getMonth());
            const isSameYear = currentView.year === (data.year || new Date().getFullYear());

            if (isSameMonth && isSameYear) {
              console.log('✅ Syncing shift schedule (View matches DB)');
              setShiftScheduleData(scheduleArray);
              setShiftScheduleMonth(data.month || new Date().getMonth());
              setShiftScheduleYear(data.year || new Date().getFullYear());
            } else {
              console.log(`⏸️ Skipping shift schedule sync: View (${currentView.month + 1}/${currentView.year}) != DB (${(data.month || 0) + 1}/${data.year})`);
              // We do NOT update the data, because the data from DB belongs to a different month
              // and would show incorrect shifts for the currently viewed dates.
            }

            setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
          } else {
            console.warn('⚠️ Invalid shift schedule data from Firebase:', data);
          }
        }
      });

      // 🔔 Listen to orders changes for real-time updates
      const unsubscribeOrders = dbService.onOrdersChange((data) => {
        if (data && Array.isArray(data)) {
          console.log('📦 ORDERS LISTENER TRIGGERED:', {
            count: data.length,
            timestamp: new Date().toISOString(),
            orders: data.map(o => ({ id: o.id, username: o.username, status: o.status }))
          });

          // Get current orders from hook BEFORE updating (for comparison)
          const currentOrders = ordersHook?.orders || [];

          // Detect status changes for notifications BEFORE updating state
          data.forEach(newOrder => {
            const oldOrder = currentOrders.find(o => o.id === newOrder.id);

            // If status changed to completed - dismiss reminder
            if (newOrder.status === 'completed' && oldOrder && oldOrder.status !== 'completed') {
              console.log('✅ Order completed, dismissing reminder:', newOrder.id);
              dismissOrderReminderByOrderId(newOrder.id);
            }

            // If status changed from non-process to process
            if (newOrder.status === 'process' && oldOrder && oldOrder.status !== 'process') {
              console.log('🔔 ORDER STATUS CHANGED TO PROCESS:', newOrder.id, newOrder.username);

              // Play sound notification
              try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
              } catch (e) {
                console.log('🔇 Sound notification not supported');
              }

              // Show popup notification to ALL users (in-app)
              addNotification(`🚀 ORDER BARU DIPROSES: ${newOrder.username} - ${newOrder.description}`, 'info');

              // 🔔 Show browser notification (works even when tab is inactive)
              showBrowserNotification(
                '🚀 ORDER BARU DIPROSES!',
                `${newOrder.username} - ${newOrder.description}\nPlatform: ${newOrder.platform.toUpperCase()}`
              );

              // 🔔 Add order reminder popup (like izin reminder)
              addOrderReminder(newOrder.id, newOrder);
            }
          });

          // ✅ Update orders state from Firebase AFTER notifications processed
          isSyncingFromFirebase.current = true;
          // Use Ref to ensure we always call the latest setter function
          setOrdersRef.current(data);
          setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
        }
      });

      // Listen to Mbak Tasks changes
      const unsubscribeMbak = dbService.onMbakTasksChange((data) => {
        if (data && Array.isArray(data)) {
          console.log('📥 RECEIVED FROM FIREBASE - MBAK TASKS:', {
            count: data.length,
            timestamp: new Date().toLocaleTimeString()
          });
          isSyncingFromFirebase.current = true;
          setMbakTasks(data);
          setTimeout(() => { isSyncingFromFirebase.current = false; }, 100);
        } else {
          console.warn('⚠️ No mbak tasks data from Firebase or invalid format');
        }
      });

      console.log('✅ Firebase realtime listeners active (including orders notifications)!');

      // Cleanup listeners on unmount
      return () => {
        unsubscribeEmployees();
        unsubscribeAttentions();
        unsubscribeYearlyAttendance();
        unsubscribeProductivityData();
        unsubscribeCurrentPeriod();
        // unsubscribeShiftTasks removed
        unsubscribeShiftSchedule();
        unsubscribeOrders();
        unsubscribeMbak(); // Add mbak tasks unsubscribe
        console.log('🔥 Firebase listeners cleaned up');
      };
    } catch (error) {
      console.error('❌ Error setting up Firebase listeners:', error);
      addNotification('⚠️ Error connecting to database. Please refresh the page.', 'error');
    }
  }, [isAppLocked, isCheckingAuth]); // Re-run when lock status changes

  // ✅ CRITICAL FIX: Immediate save helper for user actions (no debounce)
  const saveImmediately = async () => {
    // Skip save if conditions not met
    if (isAppLocked || isCheckingAuth || !hasLoadedInitialData.current || isSyncingFromFirebase.current) {
      console.log('⏸️ Skipping immediate save - conditions not met');
      return;
    }

    try {
      console.log('⚡ IMMEDIATE SAVE TO FIREBASE:', {
        timestamp: new Date().toLocaleTimeString(),
        trigger: 'user_action'
      });

      // Save to Firebase immediately (no debounce)
      await Promise.all([
        // dbService.saveEmployees(employees), // ✅ Disabled to prevent overwriting concurrent changes (processed individually)
        dbService.saveAttentions(attentions),
        dbService.saveYearlyAttendance(yearlyAttendance),
        dbService.saveProductivityData(productivityData),
        dbService.saveCurrentPeriod(currentMonth, currentYear),
        dbService.saveMbakTasks(mbakTasks) // Save mbak tasks
        // ✅ Orders saved directly in useOrders hook - DO NOT save here
      ]);

      console.log('✅ IMMEDIATE SAVE COMPLETED at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error in immediate save:', error);
      addNotification('⚠️ Gagal menyimpan data. Coba lagi.', 'error');
    }
  };

  // ✅ NEW: Save SINGLE employee to Firebase (Transaction - Safe for concurrency)
  const saveEmployeeSingle = async (updatedEmployee) => {
    if (isAppLocked || isCheckingAuth || !hasLoadedInitialData.current || isSyncingFromFirebase.current) {
      console.log('⏸️ Skipping single save - conditions not met');
      return;
    }

    try {
      console.log(`⚡ SINGLE SAVE (${updatedEmployee.name}):`, new Date().toLocaleTimeString());
      await dbService.updateEmployeeTransaction(updatedEmployee);
      console.log('✅ SINGLE SAVE COMPLETED');
    } catch (error) {
      console.error('❌ Error in single save:', error);
      addNotification('⚠️ Gagal menyimpan data karyawan. Coba lagi.', 'error');
    }
  };

  // ✅ NEW: Save with fresh employees data (avoids state closure bug)
  const saveEmployeesDirectly = async (updatedEmployees) => {
    if (isAppLocked || isCheckingAuth || !hasLoadedInitialData.current || isSyncingFromFirebase.current) {
      console.log('⏸️ Skipping save - conditions not met');
      return;
    }

    try {
      console.log('⚡ DIRECT SAVE TO FIREBASE:', new Date().toLocaleTimeString());

      await Promise.all([
        dbService.saveEmployees(updatedEmployees),  // ✅ Use passed data, not state
        dbService.saveAttentions(attentions),
        dbService.saveYearlyAttendance(yearlyAttendance),
        dbService.saveProductivityData(productivityData),
        dbService.saveCurrentPeriod(currentMonth, currentYear),
        dbService.saveMbakTasks(mbakTasks) // Save mbak tasks
        // ✅ Orders saved directly in useOrders hook - DO NOT save here
      ]);

      console.log('✅ DIRECT SAVE COMPLETED at', new Date().toLocaleTimeString());
    } catch (error) {
      console.error('❌ Error in direct save:', error);
      addNotification('⚠️ Gagal menyimpan data. Coba lagi.', 'error');
    }
  };

  // Save data to Firebase whenever it changes (with debounce and loop prevention)
  useEffect(() => {
    // Skip save if app is locked or checking auth
    if (isAppLocked || isCheckingAuth) {
      console.log('⏸️ Skipping save - app locked or checking auth');
      return;
    }

    // CRITICAL: Skip save if initial data hasn't been loaded yet
    // This prevents overwriting Firebase data with default empty state
    if (!hasLoadedInitialData.current) {
      console.log('⏸️ Skipping save - initial data not loaded yet (preventing data loss)');
      return;
    }

    // Skip save if data is being synced from Firebase (prevent infinite loop)
    if (isSyncingFromFirebase.current) {
      console.log('⏭️ Skipping save - data from Firebase listener');
      return;
    }

    // ✅ CRITICAL FIX: Check if immediate save is needed (skip debounce)
    const shouldSaveImmediately = needsImmediateSave.current;
    if (shouldSaveImmediately) {
      needsImmediateSave.current = false; // Reset flag
      console.log('⚡ IMMEDIATE SAVE triggered - skipping debounce');
    }

    // Debounce save to prevent too many writes (unless immediate save needed)
    const autoSaveOperationName = 'Auto Save';
    let autoSaveFinished = false;
    startSaveOperation(autoSaveOperationName);

    const timeoutId = setTimeout(async () => {
      try {
        // ✅ CRITICAL: Log data to verify integrity
        const historyCount = employees.reduce((sum, emp) => sum + (emp.completedTasksHistory?.length || 0), 0);

        console.log('💾 Saving to Firebase:', {
          employees: employees.length,
          historyTasks: historyCount,
          attentions: attentions.length,
          yearlyAttendanceKeys: Object.keys(yearlyAttendance).length,
          mbakTasks: mbakTasks.length // Log mbak tasks
        });

        // Save to Firebase Firestore ONLY (single source of truth)
        await Promise.all([
          // dbService.saveEmployees(employees), // ✅ Disabled to prevent overwriting concurrent changes (processed individually)
          dbService.saveAttentions(attentions),
          dbService.saveYearlyAttendance(yearlyAttendance),
          dbService.saveProductivityData(productivityData),
          dbService.saveCurrentPeriod(currentMonth, currentYear),
          dbService.saveMbakTasks(mbakTasks) // Save mbak tasks
          // ✅ Orders saved directly in useOrders hook - DO NOT save here
        ]);

        console.log('✅ Save complete at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('❌ Error saving data to Firebase:', error);
        addNotification('⚠️ Gagal menyimpan data. Coba refresh halaman.', 'error');
      } finally {
        autoSaveFinished = true;
        endSaveOperation(autoSaveOperationName);
      }
    }, shouldSaveImmediately ? 0 : 500); // ✅ 0ms for immediate save, 500ms for debounce

    return () => {
      clearTimeout(timeoutId);
      if (!autoSaveFinished) {
        endSaveOperation(autoSaveOperationName);
      }
    };
  }, [employees, attentions, yearlyAttendance, productivityData, currentMonth, currentYear, mbakTasks, isAppLocked, isCheckingAuth]); // shiftTasks removed

  // Save shift schedule data to Firebase
  useEffect(() => {
    if (isAppLocked || isCheckingAuth || !hasLoadedInitialData.current || isSyncingFromFirebase.current) {
      return;
    }

    // ✅ OPTIMIZATION: Week is just UI preference (saved to localStorage), only save actual data changes
    const shiftScheduleOperationName = 'Simpan Jadwal Shift';
    let shiftScheduleFinished = false;
    startSaveOperation(shiftScheduleOperationName);

    const timeoutId = setTimeout(() => {
      const shiftScheduleToSave = {
        scheduleData: shiftScheduleData,
        month: shiftScheduleMonth,
        year: shiftScheduleYear
        // ✅ Don't include week - it's UI state only (localStorage)
      };

      console.log('💾 Shift schedule save:', shiftScheduleData.length, 'days');

      dbService.saveShiftSchedule(shiftScheduleToSave)
        .catch(err => console.error('❌ Error saving shift schedule:', err))
        .finally(() => {
          shiftScheduleFinished = true;
          endSaveOperation(shiftScheduleOperationName);
        });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (!shiftScheduleFinished) {
        endSaveOperation(shiftScheduleOperationName);
      }
    };
  }, [shiftScheduleData, shiftScheduleMonth, shiftScheduleYear, isAppLocked, isCheckingAuth]); // ✅ Removed shiftScheduleWeek from deps

  // ✅ MOVED: These useEffects moved to AFTER ordersHook initialization (see below)


  // ✅ Enhanced: Prevent data loss and page refresh during save operations
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Prevent refresh if:
      // 1. Currently saving to Firebase
      // 2. Currently processing an action
      // 3. Has active save operations
      if (isSavingToFirebase || isProcessing || activeSaveOperations.current > 0) {
        const message = '⚠️ Data sedang disimpan ke Firebase! Jangan refresh halaman sekarang.';
        e.preventDefault();
        e.returnValue = message;
        console.warn('🚫 PREVENTED PAGE REFRESH - Save in progress!');
        return message;
      }

      // Additional check for unsaved orders
      if (!isSyncingFromFirebase.current && ordersHook?.orders && ordersHook.orders.length > 0) {
        const message = '⚠️ Ada data yang belum tersimpan. Yakin ingin keluar?';
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSavingToFirebase, isProcessing, ordersHook?.orders]);

  // ✅ AUTO-SAVE ORDERS: Periodic backup every 5 minutes
  useEffect(() => {
    if (isAppLocked || isCheckingAuth || !ordersHook?.orders || !hasLoadedInitialData.current) {
      return;
    }

    const interval = setInterval(async () => {
      if (ordersHook.orders.length > 0 && !isSyncingFromFirebase.current) {
        startSaveOperation('Auto Save Orders');
        try {
          await dbService.saveOrders(ordersHook.orders);
          console.log('💾 AUTO-SAVE ORDERS (periodic backup):', {
            count: ordersHook.orders.length,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Auto-save orders error:', error);
        } finally {
          endSaveOperation('Auto Save Orders');
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [ordersHook?.orders, isAppLocked, isCheckingAuth]);

  // Migration: Move old completed tasks to history (helper function)
  const migrateCompletedTasksToHistory = () => {
    let hasMigrated = false;

    setEmployees(prev => {
      const updated = prev.map(emp => {
        // Find completed work tasks (cleaning tasks feature removed)
        const completedWork = emp.workTasks.filter(t => t.completed).map(t => ({
          ...t,
          taskType: 'work' // ✅ Add taskType marker
        }));

        const completedInCurrent = [...completedWork];

        // Keep old history data as-is - don't modify to preserve user data
        const fixedHistory = emp.completedTasksHistory;

        if (completedInCurrent.length > 0 || fixedHistory.length !== emp.completedTasksHistory.length) {
          hasMigrated = true;
          console.log(`🔄 Migrating ${completedInCurrent.length} completed tasks for ${emp.name} to history`);

          return {
            ...emp,
            // Add to history (avoid duplicates)
            completedTasksHistory: [
              ...fixedHistory,
              ...completedInCurrent.filter(ct =>
                !fixedHistory.some(h => h.id === ct.id)
              )
            ],
            // Remove from current lists (cleaning tasks removed)
            workTasks: emp.workTasks.filter(t => !t.completed)
          };
        }

        return { ...emp, completedTasksHistory: fixedHistory };
      });

      if (hasMigrated) {
        addNotification('✅ Data history task berhasil dipulihkan!', 'success');
      }

      return updated;
    });
  };

  // Smart Notifications - Check for long running tasks
  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      // Use callback to get latest employees state
      setEmployees(prev => {
        prev.forEach(emp => {
          // Cleaning tasks feature removed - only check work tasks
          [...emp.workTasks].forEach(task => {
            if (task.startTime && !task.endTime) {
              const [h, m, s = 0] = task.startTime.split(':').map(Number);
              const start = new Date();
              start.setHours(h, m, s, 0);
              const diff = Math.floor((now - start) / 1000 / 60); // minutes

              // Notify if task running > 60 minutes (only once per hour)
              if (diff > 60 && diff % 60 === 0) {
                addNotification(`⚠️ Task "${task.task}" dari ${emp.name} sudah berjalan ${Math.floor(diff / 60)} jam`, 'warning');
              }
            }
          });
        });
        return prev; // Don't modify state
      });
    };

    const interval = setInterval(checkTasks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []); // Empty dependency

  // 🔔 Helper function to show browser notification
  const showBrowserNotification = (title, body, icon = '🚀') => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: body,
          icon: '/logo192.png', // Use your app logo
          badge: '/logo192.png',
          tag: 'order-notification', // Prevent duplicate notifications
          requireInteraction: true, // Keep notification visible until user interacts
          silent: false // Play sound
        });

        // Auto-close after 10 seconds
        setTimeout(() => notification.close(), 10000);

        // Focus window when notification is clicked
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log('✅ Browser notification shown');
      } catch (error) {
        console.error('❌ Error showing browser notification:', error);
      }
    } else {
      console.log('⚠️ Browser notifications not available or permission not granted');
    }
  };

  // ✅ Load orders ONCE after ordersHook is ready AND initial data loaded
  useEffect(() => {
    if (!shouldLoadOrders || isAppLocked || isCheckingAuth) {
      return;
    }

    // Load orders from Firebase (one-time read, NO listener)
    const loadOrders = async () => {
      try {
        const data = await dbService.loadInitialData();
        console.log('🔍 Raw data from Firebase:', data);
        if (data?.orders && Array.isArray(data.orders)) {
          console.log(`📦 Orders loaded: ${data.orders.length} orders`);
          console.log('📦 Order details:', data.orders);
          ordersHook.setOrders(data.orders);
        } else {
          console.log('📦 No orders found in Firebase - data:', data);
        }

        // ✅ CRITICAL: Reset flag to prevent loop
        setShouldLoadOrders(false);
      } catch (error) {
        console.error('❌ Error loading orders:', error);
      }
    };

    loadOrders();
  }, [shouldLoadOrders, isAppLocked, isCheckingAuth]); // ✅ Remove ordersHook from deps!

  // ✅ Orders management:
  // - NO Firebase realtime listener (prevents infinite loop)
  // - Loaded ONCE on app start (above)
  // - Saved directly in hook functions (addOrder, updateOrder, etc.)

  const priorityColors = {
    urgent: { bg: 'bg-blue-950/25', border: 'border-blue-500/25', text: 'text-blue-200', badge: 'bg-blue-600' },
    high: { bg: 'bg-blue-950/20', border: 'border-blue-500/20', text: 'text-blue-200', badge: 'bg-blue-600' },
    normal: { bg: 'bg-slate-900/50', border: 'border-white/10', text: 'text-slate-200', badge: 'bg-blue-600' },
    low: { bg: 'bg-slate-900/40', border: 'border-white/10', text: 'text-slate-300', badge: 'bg-slate-500' }
  };

  const statusConfig = {
    hadir: { bg: 'bg-emerald-600', calendarBg: 'bg-emerald-600', label: 'Hadir', pillClass: 'bg-emerald-950/25 text-emerald-200' },
    telat: { bg: 'bg-amber-600', calendarBg: 'bg-amber-600', label: 'Telat', pillClass: 'bg-amber-950/25 text-amber-200' },
    lembur: { bg: 'bg-sky-600', calendarBg: 'bg-sky-600', label: 'Lembur', pillClass: 'bg-sky-950/25 text-sky-200' },
    izin: { bg: 'bg-violet-600', calendarBg: 'bg-violet-600', label: 'Izin', pillClass: 'bg-violet-950/25 text-violet-200' },
    libur: { bg: 'bg-slate-600', calendarBg: 'bg-slate-600', label: 'Libur', pillClass: 'bg-slate-900/45 text-slate-200' },
    sakit: { bg: 'bg-rose-600', calendarBg: 'bg-rose-600', label: 'Sakit', pillClass: 'bg-rose-950/25 text-rose-200' },
    alpha: { bg: 'bg-red-700', calendarBg: 'bg-red-700', label: 'Alpha', pillClass: 'bg-red-950/25 text-red-200' }
  };

  const calculateElapsedTime = (startTime) => {
    if (!startTime) return null;
    try {
      const [hours, minutes, seconds = 0] = startTime.split(':').map(Number);
      const now = new Date();
      const start = new Date();
      start.setHours(hours, minutes, seconds, 0);
      let diff = Math.floor((now - start) / 1000);
      if (diff < 0) diff += 24 * 3600;
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } catch (e) {
      return '00:00:00';
    }
  };

  const updateStatus = (employeeId, newStatus) => {
    setEmployees(prev => {
      const emp = prev.find(e => e.id === employeeId);
      if (!emp) return prev;
      const today = new Date();
      setYearlyAttendance(ya => ({
        ...ya,
        [emp.name]: {
          ...ya[emp.name],
          [today.getMonth()]: {
            ...ya[emp.name][today.getMonth()],
            [today.getDate()]: { status: newStatus, lateHours: newStatus === 'telat' ? (emp.lateHours || 0) : 0 }
          }
        }
      }));
      return prev.map(e => e.id === employeeId ? { ...e, status: newStatus } : e);
    });
  };

  const updateLateHours = (employeeId, hours) => {
    setEmployees(prev => {
      const emp = prev.find(e => e.id === employeeId);
      if (!emp) return prev;
      const today = new Date();
      setYearlyAttendance(ya => ({
        ...ya,
        [emp.name]: {
          ...ya[emp.name],
          [today.getMonth()]: {
            ...ya[emp.name][today.getMonth()],
            [today.getDate()]: { ...ya[emp.name][today.getMonth()][today.getDate()], lateHours: hours }
          }
        }
      }));
      return prev.map(e => e.id === employeeId ? { ...e, lateHours: hours } : e);
    });
  };

  const toggleTask = async (empId, type, taskId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    const taskName = employees.find(e => e.id === empId)?.[type === 'cleaning' ? 'cleaningTasks' : 'workTasks']?.find(t => t.id === taskId)?.task || 'Task';
    const isCurrentlyCompleted = employees.find(e => e.id === empId)?.[type === 'cleaning' ? 'cleaningTasks' : 'workTasks']?.find(t => t.id === taskId)?.completed || false;

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      // ✅ CRITICAL FIX: Calculate updated array FIRST to save explicitly
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          return {
            ...e,
            [list]: e[list].map(t => {
              if (t.id === taskId) {
                const nowCompleted = !t.completed;
                const completedTime = nowCompleted ? new Date().toLocaleString('id-ID') : null;
                return {
                  ...t,
                  completed: nowCompleted,
                  progress: nowCompleted ? 100 : t.progress,
                  completedAt: completedTime,
                  completedAtDisplay: completedTime
                };
              }
              return t;
            })
          };
        }
        return e;
      });

      setEmployees(updatedEmployees);

      // Side effect for productivity
      const emp = updatedEmployees.find(e => e.id === empId);
      const task = emp?.[type === 'cleaning' ? 'cleaningTasks' : 'workTasks']?.find(t => t.id === taskId);

      if (task && task.completed) {
        trackProductivity(empId, type);
        addNotification(`✅ ${emp.name} menyelesaikan task: ${task.task}`, 'success');
        logAction('Selesai Task', `${emp.name} - ${task.task}`);
      }

      // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
      startSaveOperation('Toggle Task');
      if (emp) await saveEmployeeSingle(emp);
      endSaveOperation('Toggle Task');

      if (!isCurrentlyCompleted) {
        logSuccess('Selesai Task', `${empName} - ${taskName}`);
      }
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const updateProgress = async (empId, type, taskId, progress) => {
    // Wrap in isProcessingRef to prevent sync interruptions during slider updates
    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          return { ...e, [list]: e[list].map(t => t.id === taskId ? { ...t, progress: parseInt(progress) || 0 } : t) };
        }
        return e;
      });

      setEmployees(updatedEmployees);

      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) await saveEmployeeSingle(emp);
    } finally {
      // Small delay to allow Firebase sync to propagate
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const startTask = async (empId, type, taskId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    const taskName = employees.find(e => e.id === empId)?.[type === 'cleaning' ? 'cleaningTasks' : 'workTasks']?.find(t => t.id === taskId)?.task || 'Task';
    logAction('Mulai Pekerjaan', `${empName} - ${taskName}`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          return {
            ...e,
            [list]: e[list].map(t => {
              if (t.id === taskId) {
                return {
                  ...t,
                  startTime: timeStr,
                  endTime: null,
                  duration: null,
                  paused: false,
                  pauseHistory: []
                };
              }
              return t;
            })
          };
        }
        return e;
      });

      const empNameFinal = updatedEmployees.find(e => e.id === empId)?.name;
      setEmployees(updatedEmployees);

      addNotification(`▶️ ${empNameFinal} mulai task`, 'info');

      startSaveOperation('Mulai Pekerjaan');
      const empToSave = updatedEmployees.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      endSaveOperation('Mulai Pekerjaan');

      logSuccess('Mulai Pekerjaan', `${empNameFinal} - ${taskName}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const pauseTask = (empId, type, taskId) => {
    setPauseModal({ empId, type, taskId });
  };

  const confirmPause = async () => {
    if (!pauseReason.trim()) {
      alert('Harap berikan alasan pause!');
      return;
    }

    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const { empId, type, taskId } = pauseModal;
    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    logAction('Pause Pekerjaan', `${empName} - ${pauseReason}`);

    setIsProcessing(true);
    isProcessingRef.current = true;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // ✅ CRITICAL FIX: Calculate updated array first
    const updatedEmployees = employees.map(e => {
      if (e.id === empId) {
        const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
        return {
          ...e,
          [list]: e[list].map(t => {
            if (t.id === taskId) {
              const pauseHistory = t.pauseHistory || [];
              return {
                ...t,
                paused: true,
                pauseStartTime: timeStr,
                pauseHistory: [...pauseHistory, { startTime: timeStr, endTime: null, reason: pauseReason }]
              };
            }
            return t;
          })
        };
      }
      return e;
    });

    const emp = updatedEmployees.find(e => e.id === empId);

    // Update React state
    setEmployees(updatedEmployees);

    // Add reminder popup
    addPauseReminder(empId, 'task', pauseReason);

    addNotification(`⏸️ ${emp?.name} pause task: ${pauseReason}`, 'warning');
    setPauseModal(null);
    setPauseReason('');

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Pause Pekerjaan');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Pause Pekerjaan');

    logSuccess('Pause Pekerjaan', empName);

    // ✅ CRITICAL FIX: Keep processing flag true for a moment to ensure Firebase write completes
    // before listener processes incoming updates
    setTimeout(() => {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }, 500); // 500ms delay to ensure Firebase write propagates
  };

  // Pause All Tasks - opens modal to enter reason
  const pauseAllTasks = (empId) => {
    setPauseAllModal(empId);
  };

  // Confirm Pause All - pauses all running tasks for an employee
  const confirmPauseAll = async () => {
    if (!pauseAllReason.trim()) {
      alert('Harap berikan alasan pause!');
      return;
    }

    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empId = pauseAllModal;
    const emp = employees.find(e => e.id === empId);
    const empName = emp?.name || 'Unknown';

    // Find all running tasks (tasks that have startTime and are not completed and not already paused)
    const runningTasks = emp?.workTasks?.filter(t =>
      t.startTime && !t.completed && !t.paused
    ) || [];

    if (runningTasks.length === 0) {
      alert('Tidak ada task yang sedang berjalan untuk di-pause.');
      setPauseAllModal(null);
      setPauseAllReason('');
      return;
    }

    logAction('Pause Semua Task', `${empName} - ${pauseAllReason} (${runningTasks.length} tasks)`);

    setIsProcessing(true);
    isProcessingRef.current = true;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Update all running tasks to paused state
    const updatedEmployees = employees.map(e => {
      if (e.id === empId) {
        return {
          ...e,
          workTasks: e.workTasks.map(t => {
            if (t.startTime && !t.completed && !t.paused) {
              const pauseHistory = t.pauseHistory || [];
              return {
                ...t,
                paused: true,
                pauseStartTime: timeStr,
                pauseHistory: [...pauseHistory, { startTime: timeStr, endTime: null, reason: pauseAllReason }]
              };
            }
            return t;
          })
        };
      }
      return e;
    });

    // Update React state
    setEmployees(updatedEmployees);

    // Add reminder popup
    addPauseReminder(empId, 'task', `Pause All: ${pauseAllReason}`);

    addNotification(`⏸️ ${empName} pause ${runningTasks.length} task: ${pauseAllReason}`, 'warning');
    setPauseAllModal(null);
    setPauseAllReason('');

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Pause Semua Task');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Pause Semua Task');

    logSuccess('Pause Semua Task', `${empName} (${runningTasks.length} tasks)`);

    // ✅ CRITICAL FIX: Keep processing flag true for a moment to ensure Firebase write completes
    setTimeout(() => {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }, 500);
  };

  // Resume All Tasks - resumes all paused tasks for an employee
  const resumeAllTasks = async (empId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const emp = employees.find(e => e.id === empId);
    const empName = emp?.name || 'Unknown';

    // Find all paused tasks
    const pausedTasks = emp?.workTasks?.filter(t => t.paused && !t.completed) || [];

    if (pausedTasks.length === 0) {
      alert('Tidak ada task yang di-pause untuk di-resume.');
      return;
    }

    logAction('Resume Semua Task', `${empName} (${pausedTasks.length} tasks)`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    // Dismiss all pause reminders for this employee
    dismissAllReminders(empId);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // Update all paused tasks to resume state
    const updatedEmployees = employees.map(e => {
      if (e.id === empId) {
        return {
          ...e,
          workTasks: e.workTasks.map(t => {
            if (t.paused && !t.completed) {
              // Update last pause history with end time
              const pauseHistory = t.pauseHistory || [];
              const updatedHistory = pauseHistory.map((p, idx) =>
                idx === pauseHistory.length - 1 && !p.endTime ? { ...p, endTime: timeStr } : p
              );

              return {
                ...t,
                paused: false,
                pauseStartTime: null,
                pauseHistory: updatedHistory
              };
            }
            return t;
          })
        };
      }
      return e;
    });

    // Update React state
    setEmployees(updatedEmployees);

    addNotification(`▶️ ${empName} melanjutkan ${pausedTasks.length} task`, 'info');

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Resume Semua Task');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Resume Semua Task');

    logSuccess('Resume Semua Task', `${empName} (${pausedTasks.length} tasks)`);

    // ✅ CRITICAL FIX: Keep processing flag true for a moment to ensure Firebase write completes
    setTimeout(() => {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }, 500);
  };

  const resumeTask = async (empId, type, taskId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    const empName = employees.find(e => e.id === empId)?.name || 'Unknown';
    const taskName = employees.find(e => e.id === empId)?.[type === 'cleaning' ? 'cleaningTasks' : 'workTasks']?.find(t => t.id === taskId)?.task || 'Task';
    logAction('Lanjutkan Pekerjaan', `${empName} - ${taskName}`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      // Dismiss task pause reminder
      dismissAllReminders(empId);

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      // ✅ CRITICAL FIX: Calculate updated array first
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          return {
            ...e,
            [list]: e[list].map(t => {
              if (t.id === taskId) {
                // Update last pause history with end time
                const pauseHistory = t.pauseHistory || [];
                const updatedHistory = pauseHistory.map((p, idx) =>
                  idx === pauseHistory.length - 1 ? { ...p, endTime: timeStr } : p
                );

                return {
                  ...t,
                  paused: false,
                  pauseStartTime: null,
                  pauseHistory: updatedHistory
                };
              }
              return t;
            })
          };
        }
        return e;
      });

      const empNameFinal = updatedEmployees.find(e => e.id === empId)?.name;

      // Update React state
      setEmployees(updatedEmployees);

      addNotification(`▶️ ${empNameFinal} melanjutkan task`, 'info');

      // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
      startSaveOperation('Lanjutkan Pekerjaan');
      const empToSave = updatedEmployees.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      endSaveOperation('Lanjutkan Pekerjaan');

      logSuccess('Lanjutkan Pekerjaan', `${empNameFinal} - ${taskName}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500); // 500ms delay to ensure Firebase write propagates
    }
  };

  const endTask = async (empId, type, taskId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    console.log(`🎯 END TASK called: empId=${empId}, type=${type}, taskId=${taskId}`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      let taskFound = false;

      // ✅ CRITICAL FIX: Calculate updated array first
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          const task = e[list].find(t => t.id === taskId && t.startTime);

          if (task) {
            taskFound = true;
            const [sh, sm, ss = 0] = task.startTime.split(':').map(Number);
            const [eh, em, es = 0] = timeStr.split(':').map(Number);
            let diff = (eh * 3600 + em * 60 + es) - (sh * 3600 + sm * 60 + ss);
            if (diff < 0) diff += 24 * 3600;
            const hours = Math.floor(diff / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const dur = hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;

            // Create completed task object
            const completedTask = {
              ...task,
              endTime: timeStr,
              duration: dur,
              completed: true,
              progress: 100,
              completedAt: now.toISOString(),
              completedAtDisplay: now.toLocaleString('id-ID'),
              taskType: type // ✅ Add task type marker (cleaning/work)
            };

            trackProductivity(empId, type);
            addNotification(`✅ ${e.name} menyelesaikan task: ${task.task} (${dur})`, 'success');

            // Move to history and remove from current list
            return {
              ...e,
              completedTasksHistory: [...e.completedTasksHistory, completedTask],
              [list]: e[list].filter(t => t.id !== taskId)
            };
          }
        }
        return e;
      });

      if (!taskFound) {
        console.error(`❌ Task NOT found! empId=${empId}, type=${type}, taskId=${taskId}`);
        return;
      }

      setEmployees(updatedEmployees);

      startSaveOperation('Selesai Task');
      const empToSave = updatedEmployees.find(e => e.id === empId);
      if (empToSave) await saveEmployeeSingle(empToSave);
      endSaveOperation('Selesai Task');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  // Track productivity data
  const trackProductivity = (empId, type) => {
    const now = new Date();
    const hour = now.getHours();
    const date = now.toLocaleDateString('id-ID');

    setProductivityData(prev => {
      const existing = prev.find(p => p.empId === empId && p.hour === hour && p.date === date);
      if (existing) {
        return prev.map(p =>
          p.empId === empId && p.hour === hour && p.date === date
            ? { ...p, count: p.count + 1, [type]: (p[type] || 0) + 1 }
            : p
        );
      }
      return [...prev, { empId, hour, date, count: 1, [type]: 1 }];
    });
  };

  // Task Break (pause with progress tracking)
  const taskBreak = (empId, type, taskId) => {
    setTaskBreakModal({ empId, type, taskId });
    const emp = employees.find(e => e.id === empId);
    const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
    const task = emp?.[list].find(t => t.id === taskId);
    setTaskBreakProgress(task?.progress || 0);
  };

  const confirmTaskBreak = async () => {
    if (taskBreakProgress === 0) {
      alert('Harap isi progress sebelum break!');
      return;
    }

    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    console.log(`☕ CONFIRM TASK BREAK: progress=${taskBreakProgress}%`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    const { empId, type, taskId } = taskBreakModal;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // ✅ CRITICAL FIX: Calculate updated array first
    const updatedEmployees = employees.map(e => {
      if (e.id === empId) {
        const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
        return {
          ...e,
          [list]: e[list].map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                progress: taskBreakProgress,
                onTaskBreak: true, // Flag untuk menandai sedang break
                isPaused: true, // Flag untuk pause timer
                taskBreakStartTime: timeStr,
                taskBreakStartDate: now.toISOString(),
                pauseHistory: [
                  ...(t.pauseHistory || []),
                  {
                    startTime: timeStr,
                    endTime: null, // Will be filled when resume
                    reason: `Break - Progress ${taskBreakProgress}%`,
                    date: now.toISOString(),
                    dateDisplay: now.toLocaleString('id-ID')
                  }
                ]
              };
            }
            return t;
          })
        };
      }
      return e;
    });

    const emp = updatedEmployees.find(e => e.id === empId);

    // Update React state
    setEmployees(updatedEmployees);

    addNotification(`☕ ${emp?.name} break task - Progress: ${taskBreakProgress}%`, 'warning');
    setTaskBreakModal(null);
    setTaskBreakProgress(0);

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Break Task');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Break Task');

    console.log(`✅ Confirm task break completed`);
    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  // Resume from task break
  const resumeFromTaskBreak = async (empId, type, taskId) => {
    // ✅ PREVENT DOUBLE-CLICK
    if (isProcessing) {
      console.log('⏸️ Action in progress, ignoring double-click');
      return;
    }

    console.log(`▶️ RESUME FROM TASK BREAK: empId=${empId}, type=${type}, taskId=${taskId}`);

    setIsProcessing(true);
    isProcessingRef.current = true;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    // ✅ CRITICAL FIX: Calculate updated array first
    const updatedEmployees = employees.map(e => {
      if (e.id === empId) {
        const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
        return {
          ...e,
          [list]: e[list].map(t => {
            if (t.id === taskId && t.onTaskBreak) {
              // Update last pause history with end time
              const updatedPauseHistory = [...(t.pauseHistory || [])];
              if (updatedPauseHistory.length > 0) {
                const lastPause = updatedPauseHistory[updatedPauseHistory.length - 1];
                if (!lastPause.endTime) {
                  lastPause.endTime = timeStr;
                }
              }

              return {
                ...t,
                onTaskBreak: false,
                isPaused: false, // Resume timer
                taskBreakStartTime: null,
                taskBreakStartDate: null,
                pauseHistory: updatedPauseHistory
              };
            }
            return t;
          })
        };
      }
      return e;
    });

    const emp = updatedEmployees.find(e => e.id === empId);

    // Update React state
    setEmployees(updatedEmployees);

    addNotification(`▶️ ${emp?.name} melanjutkan task`, 'info');

    // ✅ CRITICAL FIX: Save fresh data directly using TRANSACTION
    startSaveOperation('Lanjutkan Task');
    const empToSave = updatedEmployees.find(e => e.id === empId);
    if (empToSave) await saveEmployeeSingle(empToSave);
    endSaveOperation('Lanjutkan Task');

    console.log(`✅ Resume from task break completed`);
    setIsProcessing(false);
    isProcessingRef.current = false;
  };

  // Drag and Drop handlers
  const handleDragStart = (e, empId, type, taskId) => {
    setDraggedTask({ empId, type, taskId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Export data to JSON file
  const exportData = () => {
    try {
      const dataToExport = {
        employees,
        attentions,
        yearlyAttendance,
        productivityData,
        // shiftTasks removed - cleaning tasks feature no longer exists
        mbakTasks, // Export mbak tasks
        currentMonth,
        currentYear,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addNotification('✅ Data berhasil di-export', 'success');
    } catch (error) {
      console.error('Export error:', error);
      addNotification('❌ Gagal export data', 'error');
    }
  };

  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        if (imported.employees) setEmployees(imported.employees);
        if (imported.attentions) setAttentions(imported.attentions);
        if (imported.yearlyAttendance) setYearlyAttendance(imported.yearlyAttendance);
        if (imported.productivityData) setProductivityData(imported.productivityData);
        // shiftTasks removed - cleaning tasks feature no longer exists
        if (imported.mbakTasks) setMbakTasks(imported.mbakTasks); // Import mbak tasks
        if (imported.currentMonth !== undefined) setCurrentMonth(imported.currentMonth);
        if (imported.currentYear !== undefined) setCurrentYear(imported.currentYear);

        addNotification('✅ Data berhasil di-import', 'success');
      } catch (error) {
        console.error('Import error:', error);
        addNotification('❌ Gagal import data - file tidak valid', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Clear all data with password protection
  const clearAllData = () => {
    setShowClearModal(true);
    setClearPassword('');
  };

  const confirmClearAllData = async () => {
    const CORRECT_PASSWORD = '@enc2025';

    if (clearPassword !== CORRECT_PASSWORD) {
      alert('❌ Password salah! Data tidak dihapus.');
      return;
    }

    if (!window.confirm('⚠️ KONFIRMASI TERAKHIR: Yakin ingin menghapus SEMUA data dari Firebase? Tindakan ini TIDAK DAPAT DIBATALKAN!')) {
      return;
    }

    try {
      startSaveOperation('Hapus Semua Data');
      // Reset to default values
      const defaultEmployees = initializeEmployees();
      const defaultYearlyAttendance = generateYearlyAttendance();

      // Clear Firebase data
      await Promise.all([
        dbService.saveEmployees(defaultEmployees),
        dbService.saveAttentions([]),
        dbService.saveYearlyAttendance(defaultYearlyAttendance),
        dbService.saveProductivityData([]),
        dbService.saveCurrentPeriod(new Date().getMonth(), new Date().getFullYear()),
        dbService.saveMbakTasks([]) // Clear mbak tasks
      ]);

      console.log('✅ All data cleared from Firebase');

      // Close modal
      setShowClearModal(false);
      setClearPassword('');

      // Show success message
      addNotification('✅ Semua data berhasil dihapus dari Firebase!', 'success');

      // Reload page to reset local state
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ Error clearing data:', error);
      alert('❌ Gagal menghapus data: ' + error.message);
    } finally {
      endSaveOperation('Hapus Semua Data');
    }
  };

  // App Lock Functions
  const handleAppUnlock = async () => {
    if (!appEmail || !appPassword) {
      alert('❌ Email dan password harus diisi!');
      return;
    }

    // Prevent admin email from being used for app unlock
    if (appEmail === 'josepratama157@gmail.com') {
      alert('❌ Email admin tidak bisa digunakan untuk unlock aplikasi! Gunakan email user biasa.');
      setAppEmail('');
      return;
    }

    setIsUnlocking(true);

    try {
      // Use Firebase Auth for secure authentication
      const result = await authService.unlockApp(appEmail, appPassword);

      if (result.success) {
        // Load initial data from Firebase before unlocking
        console.log('📥 Loading data from Firebase...');
        const initialData = await dbService.loadInitialData();

        if (initialData) {
          // Set data from Firebase
          if (initialData.employees) {
            console.log('✅ Restoring employees:', initialData.employees.length);
            setEmployees(initialData.employees);
          }
          if (initialData.yearlyAttendance) {
            console.log('✅ Restoring yearly attendance');
            setYearlyAttendance(initialData.yearlyAttendance);
          }
          if (initialData.productivityData) {
            console.log('✅ Restoring productivity data:', initialData.productivityData.length);
            setProductivityData(initialData.productivityData);
          }
          if (initialData.attentions) {
            console.log('✅ Restoring attentions:', initialData.attentions.length);
            setAttentions(initialData.attentions);
          }
          if (initialData.currentPeriod) {
            console.log('✅ Restoring current period');
            setCurrentMonth(initialData.currentPeriod.currentMonth);
            setCurrentYear(initialData.currentPeriod.currentYear);
          }
          // shiftTasks removed - cleaning tasks feature no longer exists
          if (initialData.mbakTasks) {
            console.log('✅ Restoring mbak tasks:', initialData.mbakTasks.length);
            setMbakTasks(initialData.mbakTasks);
          }

          // Mark that initial data has been loaded
          hasLoadedInitialData.current = true;
          console.log('✅ Initial data loaded - saves now enabled');

          // Run migration after data loaded
          setTimeout(() => {
            migrateCompletedTasksToHistory();
          }, 1000); // Wait 1 second for state to settle
        }

        setIsAppLocked(false);
        setAppEmail('');
        setAppPassword('');

        // Store session with expiry (24 hours)
        const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000);
        sessionStorage.setItem('appUnlocked', 'true');
        sessionStorage.setItem('appUnlockExpiry', sessionExpiry.toString());

        addNotification('🔓 Aplikasi berhasil dibuka!', 'success');
      } else {
        alert('❌ Email atau password salah!');
        setAppPassword('');
      }
    } catch (error) {
      console.error('Unlock error:', error);
      alert('❌ Terjadi kesalahan saat membuka aplikasi. Pastikan Firebase Authentication sudah diaktifkan.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Admin Functions
  const handleAdminLogin = async () => {
    if (!adminEmail || !adminPassword) {
      alert('❌ Email dan password harus diisi!');
      return;
    }

    // Validate admin email - ONLY josepratama157@gmail.com allowed
    if (adminEmail !== 'josepratama157@gmail.com') {
      alert('❌ Email ini tidak memiliki akses admin!');
      setAdminEmail('');
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await authService.loginAdmin(adminEmail, adminPassword);

      if (result.success) {
        setIsAdmin(true);
        setShowAdminLogin(false);
        setAdminEmail('');
        setAdminPassword('');
        addNotification('🔐 Login Admin berhasil!', 'success');
        setActivePage('admin');
      } else {
        alert('❌ Email atau password salah!');
        setAdminPassword('');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('❌ Terjadi kesalahan saat login. Pastikan Firebase Authentication sudah diaktifkan.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    await authService.logoutAdmin();
    setIsAdmin(false);
    setActivePage('dashboard');
    addNotification('👋 Logout Admin berhasil', 'success');
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee({ ...employee });
  };

  const handleAddEmployee = async (name, id) => {
    if (!name || !id) {
      alert('❌ Nama dan ID harus diisi!');
      return;
    }

    // Check if ID already exists
    if (employees.some(emp => emp.id === id)) {
      alert('❌ ID Karyawan sudah ada!');
      return;
    }

    isProcessingRef.current = true;
    try {
      const newEmployee = {
        id: parseInt(id),
        name: name,
        baseSalary: 0,
        status: 'belum',
        lateHours: 0,
        checkInTime: null,
        cleaningTasks: [],
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
        completedTasksHistory: [],
        pauseHistory: []
      };

      const updatedEmployees = [...employees, newEmployee];
      setEmployees(updatedEmployees);

      // Update yearlyAttendance for the new employee
      const currentYearValue = new Date().getFullYear();
      setYearlyAttendance(prev => {
        if (prev[name]) return prev;

        const empAttendance = {};
        for (let m = 0; m < 12; m++) {
          empAttendance[m] = {};
          const daysInMonth = new Date(currentYearValue, m + 1, 0).getDate();
          for (let d = 1; d <= daysInMonth; d++) {
            empAttendance[m][d] = { status: 'belum', lateHours: 0 };
          }
        }

        return {
          ...prev,
          [name]: empAttendance
        };
      });

      startSaveOperation('Tambah Karyawan');
      await dbService.saveEmployees(updatedEmployees);
      needsImmediateSave.current = true;
      endSaveOperation('Tambah Karyawan');
      addNotification(`✅ Karyawan ${name} berhasil ditambahkan!`, 'success');
      return true;
    } catch (error) {
      console.error('Error adding employee:', error);
      alert('❌ Gagal menambahkan karyawan ke Firebase');
      endSaveOperation('Tambah Karyawan');
      return false;
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const handleDeleteEmployee = async (empId) => {
    const employeeToDelete = employees.find(emp => emp.id === empId);
    if (!employeeToDelete) return;

    if (!window.confirm(`⚠️ Apakah Anda yakin ingin menghapus karyawan "${employeeToDelete.name}"? Semua data terkait (termasuk riwayat kalender) akan hilang.`)) {
      return;
    }

    isProcessingRef.current = true;
    try {
      startSaveOperation('Hapus Karyawan');

      const updatedEmployees = employees.filter(emp => emp.id !== empId);
      setEmployees(updatedEmployees);

      setYearlyAttendance(prev => {
        const next = { ...prev };
        delete next[employeeToDelete.name];
        return next;
      });

      await dbService.saveEmployees(updatedEmployees);
      needsImmediateSave.current = true;

      endSaveOperation('Hapus Karyawan');
      addNotification(`🗑️ Karyawan ${employeeToDelete.name} berhasil dihapus!`, 'warning');
      return true;
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('❌ Gagal menghapus karyawan dari Firebase');
      endSaveOperation('Hapus Karyawan');
      return false;
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee) return;

    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(emp =>
        emp.id === editingEmployee.id ? editingEmployee : emp
      );
      setEmployees(updatedEmployees);

      const emp = updatedEmployees.find(e => e.id === editingEmployee.id);
      if (emp) {
        startSaveOperation('Update Employee Admin');
        await saveEmployeeSingle(emp);
        endSaveOperation('Update Employee Admin');
      }

      addNotification(`✅ Data ${editingEmployee.name} berhasil diupdate!`, 'success');
      setEditingEmployee(null);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const handleDeleteTask = async (empId, taskType, taskId) => {
    if (!window.confirm('Yakin ingin menghapus task ini?')) return;

    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(emp => {
        if (emp.id === empId) {
          if (taskType === 'cleaning') {
            return { ...emp, cleaningTasks: emp.cleaningTasks.filter(t => t.id !== taskId) };
          } else {
            return { ...emp, workTasks: emp.workTasks.filter(t => t.id !== taskId) };
          }
        }
        return emp;
      });
      setEmployees(updatedEmployees);

      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) {
        await saveEmployeeSingle(emp);
      }

      addNotification('🗑️ Task berhasil dihapus!', 'warning');
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  // Cleaning Tasks Management Functions - REMOVED (feature no longer exists)

  const handleEditCalendar = (empName, month, day, year) => {
    const data = yearlyAttendance[empName]?.[month]?.[day];
    setEditingCalendar({
      empName,
      month,
      day,
      year: year || currentYear,
      status: data?.status || 'belum',
      lateHours: data?.lateHours || 0,
      overtimeBaseStatus: data?.overtimeBaseStatus || null // For lembur with telat/hadir
    });
  };

  const handleSaveCalendar = () => {
    if (!editingCalendar) return;

    const dayData = {
      status: editingCalendar.status,
      lateHours: editingCalendar.lateHours || 0
    };

    // If lembur, save base status (hadir/telat)
    if (editingCalendar.status === 'lembur' && editingCalendar.overtimeBaseStatus) {
      dayData.overtimeBaseStatus = editingCalendar.overtimeBaseStatus;
    }

    setYearlyAttendance(prev => ({
      ...prev,
      [editingCalendar.empName]: {
        ...prev[editingCalendar.empName],
        [editingCalendar.month]: {
          ...prev[editingCalendar.empName]?.[editingCalendar.month],
          [editingCalendar.day]: dayData
        }
      }
    }));

    addNotification(`✅ Kalender ${editingCalendar.empName} berhasil diupdate!`, 'success');
    setEditingCalendar(null);
  };

  const handleFixOvertimeData = async () => {
    if (!window.confirm('Aksi ini akan memindai semua data dan memperbaiki status "Lembur" yang salah (jika hanya ada 1 shift di hari tersebut). Lanjutkan?')) return;

    try {
      startSaveOperation('Repair Overtime');

      // ✅ Use deep clone to ensure state consistency
      const updatedAttendance = JSON.parse(JSON.stringify(yearlyAttendance));
      let fixCount = 0;

      employees.forEach(emp => {
        if (!updatedAttendance[emp.name]) return;

        Object.keys(updatedAttendance[emp.name]).forEach(month => {
          Object.keys(updatedAttendance[emp.name][month]).forEach(day => {
            const data = updatedAttendance[emp.name][month][day];

            // ✅ IMPROVED LOGIC: Detect "Lembur" records that were created incorrectly
            // Indicator 1: Status is 'lembur' but startShift is missing (it's in overtimeCheckIn instead)
            // Indicator 2: shiftsCount <= 1
            if (data?.status === 'lembur') {
              const dateObj = new Date(currentYear, parseInt(month), parseInt(day));
              const dateString = dateObj.toDateString();
              const shiftsCount = (emp.shifts || []).filter(s => s.date === dateString).length;

              const isIncorrectOvertime = !data.startShift || shiftsCount <= 1;

              if (isIncorrectOvertime) {
                // Recover the check-in time if it was moved to overtimeCheckIn
                const recoveredCheckIn = data.startShift || data.overtimeCheckIn;

                updatedAttendance[emp.name][month][day] = {
                  ...data,
                  status: data.overtimeBaseStatus || 'hadir',
                  startShift: recoveredCheckIn, // Restore primary check-in
                  // Clear incorrect overtime markers
                  overtimeCheckIn: null,
                  overtimeShift: null,
                  overtimeBaseStatus: null
                };
                fixCount++;
              }
            }
          });
        });
      });

      if (fixCount > 0) {
        setYearlyAttendance(updatedAttendance);
        needsImmediateSave.current = true;
        addNotification(`✅ Berhasil memperbaiki ${fixCount} data lembur!`, 'success');
        console.log(`🛠️ Repair complete: ${fixCount} records fixed.`);
      } else {
        addNotification('ℹ️ Tidak ada data lembur yang perlu diperbaiki.', 'info');
      }

      endSaveOperation('Repair Overtime');
    } catch (error) {
      console.error('❌ Error repairing overtime data:', error);
      alert('Gagal memperbaiki data. Cek konsol untuk detail.');
      endSaveOperation('Repair Overtime');
    }
  };

  const handleResetEmployee = async (empId) => {
    if (!window.confirm('Yakin ingin reset semua data karyawan ini? (tasks, check-in, shifts)')) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(emp => {
        if (emp.id === empId) {
          return {
            ...emp,
            checkedIn: false,
            checkInTime: null,
            status: 'belum',
            lateHours: 0,
            shift: null,
            shifts: [],
            cleaningTasks: [],
            workTasks: [],
            breakHistory: [],
            izinHistory: [],
            pauseHistory: [],
            completedTasksHistory: [],
            shiftEndAdjustment: 0,
            overtime: false
          };
        }
        return emp;
      });

      setEmployees(updatedEmployees);

      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) {
        startSaveOperation('Reset Employee');
        await saveEmployeeSingle(emp);
        endSaveOperation('Reset Employee');
      }

      addNotification('🔄 Data karyawan berhasil direset!', 'warning');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const handleDrop = (e, targetEmpId, targetType, targetTaskId) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { empId, type, taskId } = draggedTask;

    // Reorder tasks within same employee and type
    if (empId === targetEmpId && type === targetType && taskId !== targetTaskId) {
      setEmployees(prev => prev.map(emp => {
        if (emp.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          const tasks = [...emp[list]];
          const dragIndex = tasks.findIndex(t => t.id === taskId);
          const dropIndex = tasks.findIndex(t => t.id === targetTaskId);

          if (dragIndex !== -1 && dropIndex !== -1) {
            const [draggedItem] = tasks.splice(dragIndex, 1);
            tasks.splice(dropIndex, 0, draggedItem);
          }

          return { ...emp, [list]: tasks };
        }
        return emp;
      }));
      addNotification('📋 Task berhasil dipindahkan', 'info');
    }

    setDraggedTask(null);
  };

  const deleteTask = async (empId, type, taskId) => {
    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(e => e.id === empId ? { ...e, [type === 'cleaning' ? 'cleaningTasks' : 'workTasks']: e[type === 'cleaning' ? 'cleaningTasks' : 'workTasks'].filter(t => t.id !== taskId) } : e);
      setEmployees(updatedEmployees);

      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) await saveEmployeeSingle(emp);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const addTask = async (empId, type) => {
    const text = newTask[`${empId}-${type}`];
    if (!text?.trim()) return;

    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          return { ...e, [list]: [...e[list], { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, task: text, completed: false, priority: 'normal', progress: 0, startTime: null, endTime: null, duration: null, createdAt: new Date().toLocaleString('id-ID'), completedAt: null }] };
        }
        return e;
      });

      setEmployees(updatedEmployees);
      setNewTask(prev => ({ ...prev, [`${empId}-${type}`]: '' }));

      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) await saveEmployeeSingle(emp);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const updatePriority = async (empId, type, taskId, priority) => {
    isProcessingRef.current = true;
    try {
      const updatedEmployees = employees.map(e => {
        if (e.id === empId) {
          const list = type === 'cleaning' ? 'cleaningTasks' : 'workTasks';
          return { ...e, [list]: e[list].map(t => t.id === taskId ? { ...t, priority } : t) };
        }
        return e;
      });

      setEmployees(updatedEmployees);

      const emp = updatedEmployees.find(e => e.id === empId);
      if (emp) await saveEmployeeSingle(emp);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const calculateMonthlyStats = (name, month) => {
    const data = yearlyAttendance[name]?.[month];
    const stats = { hadir: 0, libur: 0, lembur: 0, izin: 0, telat: 0, sakit: 0, alpha: 0, totalLateHours: 0 };
    if (!data) return stats; // Return empty stats if no data exists
    Object.values(data).forEach(d => {
      // Only count if there's actual data (not default/empty status)
      if (d.status && d.status !== 'belum') {
        stats[d.status] = (stats[d.status] || 0) + 1;
        // Count late hours for both 'telat' status and 'lembur' with late hours
        if (d.status === 'telat' && d.lateHours) {
          stats.totalLateHours += d.lateHours;
        }
        // Also count late hours in overtime (lembur) status
        if (d.status === 'lembur' && d.lateHours) {
          stats.totalLateHours += d.lateHours;
        }
      }
    });
    return stats;
  };

  const updateCalendarDay = (name, month, day, status) => {
    setYearlyAttendance(prev => ({
      ...prev,
      [name]: { ...prev[name], [month]: { ...prev[name][month], [day]: { status, lateHours: status === 'telat' ? 0 : 0 } } }
    }));
    setEditingCell(null);
  };

  // Update calendar dengan break/izin data
  const updateCalendarWithActivity = (empName, activityType, date) => {
    const dateObj = new Date(date);
    const month = dateObj.getMonth();
    const day = dateObj.getDate();

    setYearlyAttendance(prev => {
      const currentData = prev[empName]?.[month]?.[day];
      if (!currentData) return prev;

      // Add activity to calendar day
      return {
        ...prev,
        [empName]: {
          ...prev[empName],
          [month]: {
            ...prev[empName][month],
            [day]: {
              ...currentData,
              activities: [
                ...(currentData.activities || []),
                { type: activityType, timestamp: date }
              ]
            }
          }
        }
      };
    });
  };

  const addAttention = async () => {
    if (!newAttentionText.trim() && !newAttentionImage) return;
    const newAttention = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newAttentionText,
      image: newAttentionImage,
      completed: false,
      createdAt: new Date().toLocaleString('id-ID'),
      readBy: []
    };
    setAttentions(prev => [newAttention, ...prev]);

    // ✅ Save using transaction (race-condition safe)
    try {
      await dbService.addAttentionTransaction(newAttention);
      console.log('✅ Attention added via transaction');
    } catch (error) {
      console.error('❌ Error adding attention:', error);
      addNotification('⚠️ Gagal menyimpan perhatian!', 'error');
    }

    setNewAttentionText('');
    setNewAttentionImage(null);
  };

  const toggleAttentionRead = async (attentionId, employeeName) => {
    const att = attentions.find(a => a.id === attentionId);
    if (!att) return;

    const readBy = att.readBy || [];
    const hasRead = readBy.includes(employeeName);
    const updatedReadBy = hasRead
      ? readBy.filter(name => name !== employeeName)
      : [...readBy, employeeName];

    // Check if all employees have read
    const allEmployeeNames = employees.map(e => e.name);
    const allRead = allEmployeeNames.every(name => updatedReadBy.includes(name));

    // Update local state
    setAttentions(prev => prev.map(a =>
      a.id === attentionId
        ? { ...a, readBy: updatedReadBy, completed: allRead }
        : a
    ));

    // ✅ Save using transaction (race-condition safe)
    try {
      await dbService.updateAttentionTransaction(attentionId, {
        readBy: updatedReadBy,
        completed: allRead
      });
      console.log('✅ Attention read status updated via transaction');
    } catch (error) {
      console.error('❌ Error updating attention read status:', error);
    }
  };

  const deleteAttention = async (id) => {
    setAttentions(prev => prev.filter(a => a.id !== id));

    // ✅ Delete using transaction (race-condition safe)
    try {
      await dbService.deleteAttentionTransaction(id);
      console.log('✅ Attention deleted via transaction');
    } catch (error) {
      console.error('❌ Error deleting attention:', error);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewAttentionImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 📦 MBAK TASKS MANAGEMENT FUNCTIONS
  const addMbakTask = async (text) => {
    if (!text?.trim()) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const newTaskObj = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task: text,
        completed: false,
        createdAt: new Date().toLocaleString('id-ID')
      };
      const updatedTasks = [...mbakTasks, newTaskObj];
      setMbakTasks(updatedTasks);

      // ✅ Save using transaction (race-condition safe)
      await dbService.addMbakTaskTransaction(newTaskObj);
      addNotification('✅ Task Mbak berhasil ditambahkan!', 'success');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const deleteMbakTask = async (id) => {
    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const updatedTasks = mbakTasks.filter(t => t.id !== id);
      setMbakTasks(updatedTasks);

      // ✅ Delete using transaction (race-condition safe)
      await dbService.deleteMbakTaskTransaction(id);
      addNotification('🗑️ Task Mbak berhasil dihapus!', 'warning');
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const toggleMbakTask = async (id) => {
    const task = mbakTasks.find(t => t.id === id);
    if (!task) return;

    setIsProcessing(true);
    isProcessingRef.current = true;
    try {
      const newCompleted = !task.completed;
      const updatedTasks = mbakTasks.map(t =>
        t.id === id ? { ...t, completed: newCompleted, completedAt: newCompleted ? new Date().toLocaleString('id-ID') : null } : t
      );
      setMbakTasks(updatedTasks);

      // ✅ Update using transaction (race-condition safe)
      await dbService.updateMbakTaskTransaction(id, {
        completed: newCompleted,
        completedAt: newCompleted ? new Date().toLocaleString('id-ID') : null
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };
  // All order management functions (addOrder, updateOrder, updateOrderStatus, deleteOrder, addOrderNote)
  // are now in ordersHook - see initialization at line 2068

  const AttentionSection = useMemo(() => {
    const active = attentions.filter(a => !a.completed);
    // Auto hide jika tidak ada attention aktif
    if (active.length === 0 && !showAttentionSection) {
      return null;
    }

    if (!showAttentionSection && active.length === 0) {
      return (
        <div className="mb-8">
          <button onClick={() => setShowAttentionSection(true)} className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-5 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-500 transition-all shadow-md text-sm font-medium hover:scale-[1.01] active:scale-[0.99]">
            <Bell size={16} />
            Tambah Team Attention
          </button>
        </div>
      );
    }

    return (
      <div className={`${currentTheme.card} rounded-2xl shadow-md border-2 p-6 mb-8`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-2.5 rounded-xl">
              <Bell className="text-white" size={20} />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${currentTheme.text}`}>Team Attention</h2>
              <p className={`text-xs ${currentTheme.subtext} mt-0.5`}>Informasi penting untuk team</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold">{active.length} Active</span>
            {active.length === 0 && (
              <button onClick={() => setShowAttentionSection(false)} className="text-slate-400 hover:text-blue-300 p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 p-4 bg-blue-950/20 rounded-xl border-2 border-blue-500/15">
          <textarea placeholder="Tulis informasi penting..." value={newAttentionText} onChange={(e) => setNewAttentionText(e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border ${currentTheme.input} resize-none focus:outline-none text-sm`} rows="2" />
          <div className="flex items-center gap-2 mt-3">
            <label className={`flex items-center gap-2 px-3 py-2 ${currentTheme.badge} border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-sm`}>
              <Upload size={16} className="text-blue-200" />
              <span className="text-blue-200">Gambar</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {newAttentionImage && (
              <div className="relative">
                <img src={newAttentionImage} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-white/10" />
                <button onClick={() => setNewAttentionImage(null)} className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white rounded-full p-0.5 hover:bg-blue-500">
                  <X size={10} />
                </button>
              </div>
            )}
            <button onClick={addAttention} className="ml-auto flex items-center gap-1.5 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-500 transition-all shadow-sm text-sm font-medium hover:scale-[1.01] active:scale-[0.99]">
              <Plus size={16} />
              Tambah
            </button>
          </div>
        </div>

        {active.length > 0 && (
          <div className="space-y-2.5">
            {active.map(att => {
              const readBy = att.readBy || [];
              const totalEmployees = employees.length;
              const readCount = readBy.length;

              return (
                <div key={att.id} className={`${currentTheme.badge} border border-white/10 rounded-xl p-3.5 hover:shadow-sm transition-shadow`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium mb-1.5 break-words ${currentTheme.text}`}>{att.text}</p>
                      {att.image && <img src={att.image} alt="Attention" className="max-w-sm rounded-lg border border-white/10 mb-2" />}
                      <p className={`text-xs ${currentTheme.subtext} mb-3`}>📝 {att.createdAt}</p>

                      {/* Read confirmation per employee */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs font-semibold ${currentTheme.text}`}>Konfirmasi Baca:</p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${readCount === totalEmployees
                            ? 'bg-blue-700/55 text-white border border-blue-300/30'
                            : 'bg-blue-950/25 text-blue-200 border border-blue-500/15'
                            }`}>
                            {readCount}/{totalEmployees} sudah baca
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {employees.map(emp => {
                            const hasRead = readBy.includes(emp.name);
                            return (
                              <button
                                key={emp.id}
                                onClick={() => toggleAttentionRead(att.id, emp.name)}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${hasRead
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : `${currentTheme.badge} border border-white/10 ${currentTheme.text} hover:bg-white/5`
                                  }`}
                              >
                                {hasRead ? (
                                  <CheckCircle size={14} className="flex-shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-300/60 flex-shrink-0" />
                                )}
                                <span className="truncate">{emp.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => deleteAttention(att.id)} className="text-slate-400 hover:text-blue-300 p-1 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Riwayat Attention (Completed) */}
        {attentions.filter(a => a.completed).length > 0 && (
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${currentTheme.text} mb-3 flex items-center gap-2`}>
              <CheckCircle size={16} className="text-blue-300" />
              Riwayat Selesai ({attentions.filter(a => a.completed).length})
            </h3>
            <div className="space-y-2">
              {attentions.filter(a => a.completed).map(att => (
                <div key={att.id} className={`${currentTheme.card} border-2 border-blue-500/15 rounded-xl p-3 opacity-75`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle size={14} className="text-blue-300 flex-shrink-0" />
                        <p className={`text-sm font-medium ${currentTheme.text} break-words`}>{att.text}</p>
                      </div>
                      {att.image && <img src={att.image} alt="Attention" className="max-w-xs rounded-lg border border-white/10 mb-2 mt-2" />}
                      <p className={`text-xs ${currentTheme.subtext}`}>
                        📝 {att.createdAt} • ✅ Selesai dibaca semua
                      </p>
                    </div>
                    <button onClick={() => deleteAttention(att.id)} className="text-slate-400 hover:text-blue-300 p-1 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [attentions, showAttentionSection, newAttentionText, newAttentionImage, currentTheme, employees]);

  // All admin functionality (employees, calendar, tasks, cleaning, attendance, system actions) is now in the component

  // Loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // App Lock Screen
  if (isAppLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border-2 border-white/20 p-8">
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 rounded-full shadow-lg">
                <Lock className="text-white" size={48} />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">🔒 Aplikasi Terkunci</h1>
              <p className="text-slate-300 text-sm">Masukkan email dan password untuk mengakses aplikasi</p>
            </div>

            {/* Email & Password Input */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Password:
                </label>
                <input
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/20 text-white placeholder-slate-400 focus:border-blue-400 focus:outline-none text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAppUnlock();
                    }
                  }}
                />
              </div>
            </div>

            {/* Unlock Button */}
            <button
              onClick={handleAppUnlock}
              disabled={isUnlocking}
              className={`w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 text-white font-medium hover:from-blue-600 hover:to-blue-500 transition-all shadow-lg ${isUnlocking ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUnlocking ? '⏳ Membuka...' : '🔓 Buka Aplikasi'}
            </button>

            {/* Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                🔐 Aplikasi ini dilindungi untuk mencegah akses tidak sah
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentTheme.bg} p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        <nav className={`${currentTheme.nav} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-2 mb-6 sm:mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 px-1">
              {[
                { page: 'dashboard', icon: Home, label: 'Dashboard' },
                { page: 'orderan', icon: ShoppingCart, label: 'Orderan' },
                { page: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
                { page: 'statistics', icon: BarChart3, label: 'Statistik' },
                { page: 'shift', icon: CalendarDays, label: 'Jadwal Shift' },
                { page: 'mbak', icon: Sparkles, label: 'Mbak' },
                ...(isAdmin ? [{ page: 'admin', icon: Shield, label: 'Admin Panel' }] : [])
              ].map(({ page, icon: Icon, label }) => (
                <button
                  key={page}
                  onClick={() => setActivePage(page)}
                  className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 font-bold transition-all text-xs md:text-sm border-2 whitespace-nowrap ${activePage === page ? currentTheme.navActive : currentTheme.navInactive}`}
                >
                  <Icon size={14} className="md:w-4 md:h-4" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3 px-1">
              {/* ✅ REALTIME SYNC INDICATOR */}
              <div className={`flex items-center gap-2 px-3 py-2 font-bold border-2 ${currentTheme.borderColor} bg-black text-white ${currentTheme.shadow} text-xs`}>
                <div className={`w-2 h-2 rounded-full bg-white ${isLiveSync ? 'animate-pulse' : ''}`}></div>
                <span>LIVE</span>
                {lastSyncTime && (
                  <span className="text-[10px] opacity-75">
                    {lastSyncTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Admin Login Button */}
              {!isAdmin && (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className={`flex items-center gap-2 px-3 py-2 font-bold border-2 ${currentTheme.borderColor} bg-black text-white hover:bg-slate-900 transition-all ${currentTheme.shadow} text-xs`}
                  title="Admin Login"
                >
                  <Lock size={14} />
                  Admin
                </button>
              )}

              {/* Theme Buttons */}
              <div className={`flex items-center gap-1 p-1 border-2 border-black ${currentTheme.badge}`}>
                {Object.keys(APP_THEMES).filter(t => !APP_THEMES[t]?.hidden).map(t => {
                  const IconComponent = THEME_ICONS[APP_THEMES[t].icon];
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`w-9 h-9 flex items-center justify-center font-bold border-2 transition-all ${theme === t ? APP_THEMES[t].navActive : `${currentTheme.badge} ${currentTheme.navInactive}`} hover:scale-[1.02] active:scale-[0.98] ${theme === t ? 'border-black' : 'border-transparent'}`}
                      title={APP_THEMES[t].name}
                      aria-label={`Theme: ${APP_THEMES[t].name}`}
                    >
                      {IconComponent && <IconComponent size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Smart Notifications Panel */}
        {notifications.length > 0 && (
          <div className="fixed top-6 right-6 z-50 space-y-2 max-w-md">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-4 animate-slide-in-right ${notif.type === 'urgent' ? 'border-fuchsia-600' :
                  'border-fuchsia-400'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 border-2 ${currentTheme.borderColor} bg-fuchsia-100`}>
                    <Bell size={16} className="text-fuchsia-700" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${currentTheme.text}`}>{notif.message}</p>
                    <p className={`text-xs ${currentTheme.subtext} mt-1`}>{notif.timestamp}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activePage === 'dashboard' && (
          <DashboardPage
            employees={employees}
            currentTheme={currentTheme}
            AttentionSection={AttentionSection}
            selectedEmployee={selectedEmployee}
            setSelectedEmployee={setSelectedEmployee}
            newTask={newTask}
            setNewTask={setNewTask}
            showCompletedTasks={showCompletedTasks}
            isProcessing={isProcessing}
            statusConfig={statusConfig}
            priorityColors={priorityColors}
            detectShift={detectShift}
            updateLateHours={updateLateHours}
            startBreak={startBreak}
            endBreak={endBreak}
            startIzin={startIzin}
            endIzin={endIzin}
            endShift={endShift}
            pauseAllTasks={pauseAllTasks}
            resumeAllTasks={resumeAllTasks}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            calculateElapsedTime={calculateElapsedTime}
            deleteTask={deleteTask}
            updateProgress={updateProgress}
            updatePriority={updatePriority}
            startTask={startTask}
            pauseTask={pauseTask}
            resumeTask={resumeTask}
            taskBreak={taskBreak}
            resumeFromTaskBreak={resumeFromTaskBreak}
            endTask={endTask}
            addTask={addTask}
          />
        )}
        {activePage === 'orderan' && ordersHook && (
          <OrderanPage
            currentTheme={currentTheme}
            ordersHook={ordersHook}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            expandedOrder={expandedOrder}
            setExpandedOrder={setExpandedOrder}
            newNote={newNote}
            setNewNote={setNewNote}
          />
        )}
        {activePage === 'leaderboard' && (
          <LeaderboardPage
            employees={employees}
            currentTheme={currentTheme}
            leaderboardPeriod={leaderboardPeriod}
            setLeaderboardPeriod={setLeaderboardPeriod}
            leaderboardTaskType={leaderboardTaskType}
            setLeaderboardTaskType={setLeaderboardTaskType}
            expandedLeaderboard={expandedLeaderboard}
            setExpandedLeaderboard={setExpandedLeaderboard}
          />
        )}
        {activePage === 'mbak' && (
          <MbakPage
            currentTheme={currentTheme}
            tasks={mbakTasks}
            addTask={addMbakTask}
            deleteTask={deleteMbakTask}
            toggleTask={toggleMbakTask}
          />
        )}
        {activePage === 'statistics' && (
          <StatisticsPage
            employees={employees}
            attentions={attentions}
            currentTheme={currentTheme}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            statisticsTab={statisticsTab}
            setStatisticsTab={setStatisticsTab}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            currentYear={currentYear}
            yearlyAttendance={yearlyAttendance}
            statusConfig={statusConfig}
            monthNames={MONTH_NAMES}
            calculateMonthlyStats={calculateMonthlyStats}
          />
        )}
        {activePage === 'shift' && (
          <ShiftSchedulePage
            employees={employees}
            currentTheme={currentTheme}
            shiftScheduleYear={shiftScheduleYear}
            setShiftScheduleYear={setShiftScheduleYear}
            shiftScheduleMonth={shiftScheduleMonth}
            setShiftScheduleMonth={setShiftScheduleMonth}
            shiftScheduleWeek={shiftScheduleWeek}
            setShiftScheduleWeek={setShiftScheduleWeek}
            shiftScheduleData={shiftScheduleData}
            setShiftScheduleData={setShiftScheduleData}
            currentWeekRef={currentWeekRef}
            hasLoadedInitialData={hasLoadedInitialData}
            yearlyAttendance={yearlyAttendance}
            setYearlyAttendance={setYearlyAttendance}
            monthNames={MONTH_NAMES}
            startSaveOperation={startSaveOperation}
            endSaveOperation={endSaveOperation}
          />
        )}
        {activePage === 'admin' && isAdmin && (
          <AdminPanel
            currentTheme={currentTheme}
            handleAdminLogout={handleAdminLogout}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            employees={employees}
            editingEmployee={editingEmployee}
            setEditingEmployee={setEditingEmployee}
            handleSaveEmployee={handleSaveEmployee}
            handleEditEmployee={handleEditEmployee}
            handleAddEmployee={handleAddEmployee}
            handleDeleteEmployee={handleDeleteEmployee}
            handleDeleteTask={handleDeleteTask}
            handleResetEmployee={handleResetEmployee}
            currentMonth={currentMonth}
            currentYear={currentYear}
            monthNames={MONTH_NAMES}
            yearlyAttendance={yearlyAttendance}
            statusConfig={statusConfig}
            handleEditCalendar={handleEditCalendar}
            calculateMonthlyStats={calculateMonthlyStats}
            exportData={exportData}
            importData={importData}
            setShowClearModal={setShowClearModal}
            handleFixOvertimeData={handleFixOvertimeData}
          />
        )}

        {/* Floating Buttons */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          {/* Check-In Button - HIDDEN */}
          {false && !showCheckInModal && checkedInEmployees.length < 3 && (
            <button
              onClick={() => setShowCheckInModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-5 py-3 rounded-full hover:from-blue-600 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm font-medium"
              title="Start Shift"
            >
              <Clock size={20} />
              <span>Start Shift ({checkedInEmployees.length}/3)</span>
            </button>
          )}

          {/* Team Attention Button */}
          {!showAttentionSection && attentions.filter(a => !a.completed).length === 0 && (
            <button
              onClick={() => setShowAttentionSection(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-5 py-3 rounded-full hover:from-blue-600 hover:to-blue-500 transition-all shadow-lg hover:shadow-xl hover:scale-105 text-sm font-medium"
              title="Tambah Team Attention"
            >
              <Bell size={20} />
              <span>Team Attention</span>
            </button>
          )}
        </div>

        {/* Check-In Modal */}
        {showCheckInModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-8 max-w-2xl w-full mx-4 relative`}>
              {/* Close Button */}
              <button
                onClick={() => setShowCheckInModal(false)}
                className="absolute top-4 right-4 p-2 border-2 border-black bg-white hover:bg-black hover:text-white transition-all font-bold"
                title="Close"
              >
                <X size={24} className={currentTheme.text} />
              </button>

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 border-4 ${currentTheme.borderColor} ${currentTheme.accent} mb-4`}>
                  <Clock className="text-white" size={32} />
                </div>
                <h2 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>START SHIFT</h2>
                <p className={`text-sm ${currentTheme.subtext}`}>
                  Shift Sekarang: <span className="font-bold">{detectShift() === 'pagi' ? '☀️ Pagi (09:00 - 17:00)' : '🌙 Malam (17:00 - 01:00)'}</span>
                </p>
                <p className={`text-xs ${currentTheme.subtext} mt-1`}>
                  Klik nama Anda untuk mulai shift dan mendapatkan task
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {employees.filter(emp => {
                  if (emp.checkedIn) return true;
                  if (!emp.isBackup) return true;
                  const today = new Date().getDate();
                  const todaySchedule = shiftScheduleData.find(d => d.day === today);
                  if (!todaySchedule) return false;
                  return todaySchedule.pagi.includes(emp.name) || todaySchedule.malam.includes(emp.name);
                }).map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => checkInEmployee(emp.id)}
                    disabled={emp.checkedIn || isProcessing}
                    className={`relative p-6 border-4 transition-all font-bold ${emp.checkedIn || isProcessing
                      ? `${currentTheme.accentSoftBg} border-slate-500 cursor-not-allowed opacity-70`
                      : `${currentTheme.card} ${currentTheme.shadow} hover:-translate-x-1 hover:-translate-y-1 cursor-pointer`
                      } ${currentTheme.borderColor}`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-16 h-16 border-4 border-black flex items-center justify-center font-bold text-2xl ${emp.checkedIn
                        ? `${currentTheme.accent} text-white`
                        : `${currentTheme.accent} text-white`
                        }`}>
                        <span className="drop-shadow-lg">{emp.checkedIn ? '✓' : emp.name[0]}</span>
                      </div>
                      <div className="text-center">
                        <h3 className={`text-xl font-bold mb-2 ${emp.checkedIn
                          ? 'text-blue-200'
                          : currentTheme.text
                          }`}>{emp.name}</h3>
                        {emp.checkedIn && (
                          <>
                            <p className="text-xs text-blue-200 font-semibold mt-1">✓ Checked In</p>
                            <p className="text-xs text-blue-200/80 font-medium">{emp.checkInTime}</p>
                            <span className={`inline-block mt-2 px-2.5 py-1 border-2 border-black text-xs font-bold ${emp.shift === 'pagi'
                              ? 'bg-yellow-200 text-black'
                              : 'bg-cyan-200 text-black'
                              }`}>
                              {emp.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}
                            </span>
                          </>
                        )}
                        {!emp.checkedIn && (
                          <p className={`text-sm ${currentTheme.subtext} font-medium mt-1`}>Tap untuk check-in</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                {checkedInEmployees.length > 0 && (
                  <button
                    onClick={() => setShowCheckInModal(false)}
                    className={`flex-1 py-3 border-2 border-black ${currentTheme.accent} text-white font-bold ${currentTheme.accentHover} transition-all ${currentTheme.shadow} hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0`}
                  >
                    Mulai Bekerja ({checkedInEmployees.length} orang) →
                  </button>
                )}
                {checkedInEmployees.length === 0 && (
                  <p className={`flex-1 text-center text-sm ${currentTheme.subtext} py-3`}>
                    Pilih nama untuk check-in terlebih dahulu
                  </p>
                )}
              </div>

              {checkedInEmployees.length > 0 && checkedInEmployees.length < 3 && (
                <p className={`text-center text-xs ${currentTheme.subtext} mt-2`}>
                  💡 {3 - checkedInEmployees.length} orang lagi belum check-in (opsional)
                </p>
              )}
            </div>
          </div>
        )}

        {/* Pause Modal */}
        {pauseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-6 max-w-md w-full mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`border-2 ${currentTheme.borderColor} ${currentTheme.accentSoftBg} p-3`}>
                  <Pause className={currentTheme.accentText} size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.text}`}>PAUSE TASK</h3>
                  <p className={`text-xs ${currentTheme.subtext}`}>Berikan alasan untuk pause</p>
                </div>
              </div>

              <textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Contoh: Istirahat makan siang, Meeting mendadak, dll..."
                className={`w-full px-4 py-3 border-2 ${currentTheme.borderColor} ${currentTheme.input} text-sm resize-none font-bold`}
                rows={4}
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setPauseModal(null);
                    setPauseReason('');
                  }}
                  className={`flex-1 px-4 py-2 border-2 border-black bg-white text-black font-bold hover:bg-black hover:text-white transition-all`}
                >
                  Batal
                </button>
                <button
                  onClick={confirmPause}
                  className={`flex-1 px-4 py-2 border-2 border-black ${currentTheme.accent} text-white font-bold ${currentTheme.accentHover} transition-all ${currentTheme.shadow} hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0`}
                >
                  Konfirmasi Pause
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pause All Modal */}
        {pauseAllModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-6 max-w-md w-full mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`border-2 ${currentTheme.borderColor} bg-orange-100 p-3`}>
                  <Pause className="text-orange-600" size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.text}`}>PAUSE SEMUA TASK</h3>
                  <p className={`text-xs ${currentTheme.subtext}`}>Semua task yang sedang berjalan akan di-pause</p>
                </div>
              </div>

              <textarea
                value={pauseAllReason}
                onChange={(e) => setPauseAllReason(e.target.value)}
                placeholder="Contoh: Istirahat makan siang, Meeting mendadak, dll..."
                className={`w-full px-4 py-3 border-2 ${currentTheme.borderColor} ${currentTheme.input} text-sm resize-none font-bold`}
                rows={4}
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setPauseAllModal(null);
                    setPauseAllReason('');
                  }}
                  className={`flex-1 px-4 py-2 border-2 ${currentTheme.borderColor} bg-white text-black font-bold hover:bg-black hover:text-white transition-all`}
                >
                  Batal
                </button>
                <button
                  onClick={confirmPauseAll}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 border-2 ${currentTheme.borderColor} bg-orange-500 text-white font-bold transition-all ${currentTheme.shadow} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600 hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0'}`}
                >
                  {isProcessing ? 'Memproses...' : 'Pause Semua'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Izin Modal */}
        {izinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-6 max-w-md w-full mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`border-2 ${currentTheme.borderColor} ${currentTheme.accentSoftBg} p-3`}>
                  <Bell className={currentTheme.accentText} size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.text}`}>IZIN</h3>
                  <p className={`text-xs ${currentTheme.subtext}`}>Berikan alasan izin Anda</p>
                </div>
              </div>

              <textarea
                value={izinReason}
                onChange={(e) => setIzinReason(e.target.value)}
                placeholder="Contoh: Ke dokter, Urusan keluarga, dll..."
                className={`w-full px-4 py-3 border-2 ${currentTheme.borderColor} ${currentTheme.input} text-sm resize-none font-bold`}
                rows={4}
                autoFocus
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setIzinModal(null);
                    setIzinReason('');
                  }}
                  className={`flex-1 px-4 py-2 border-2 ${currentTheme.borderColor} bg-white text-black font-bold hover:bg-black hover:text-white transition-all`}
                >
                  Batal
                </button>
                <button
                  onClick={confirmIzin}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 border-2 ${currentTheme.borderColor} ${currentTheme.accent} text-white font-bold transition-all ${currentTheme.shadow} ${isProcessing ? 'opacity-50 cursor-not-allowed' : `${currentTheme.accentHover} hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0`
                    }`}
                >
                  {isProcessing ? 'Memproses...' : 'Konfirmasi Izin'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Break Modal */}
        {taskBreakModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-6 max-w-md w-full mx-4`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`${currentTheme.accentSoftBg} p-3 rounded-xl border ${currentTheme.borderColor}`}>
                  <Coffee className={currentTheme.accentText} size={24} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.text}`}>Task Break</h3>
                  <p className={`text-xs ${currentTheme.subtext}`}>Isi progress saat ini sebelum break</p>
                </div>
              </div>

              <div className="mb-4">
                <label className={`text-sm font-medium ${currentTheme.text} mb-2 block`}>
                  Progress Saat Ini: {taskBreakProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={taskBreakProgress}
                  onChange={(e) => setTaskBreakProgress(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className={`flex justify-between text-xs ${currentTheme.subtext} mt-1`}>
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-500/15 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-200">
                  ⏸️ Timer akan berhenti saat break. Klik "Lanjutkan" untuk melanjutkan timer
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTaskBreakModal(null);
                    setTaskBreakProgress(0);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all text-sm font-medium hover:scale-[1.01] active:scale-[0.99]`}
                >
                  Batal
                </button>
                <button
                  onClick={confirmTaskBreak}
                  className={`flex-1 px-4 py-2 rounded-lg ${currentTheme.accent} text-white ${currentTheme.accentHover} transition-all text-sm font-medium ${currentTheme.shadow} hover:scale-[1.01] active:scale-[0.99]`}
                >
                  Konfirmasi Break
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Processing Reminder Popups */}
        <div className="fixed bottom-24 right-6 z-50 space-y-3 max-w-sm">
          {orderReminders.map(reminder => {
            const now = Date.now();
            const elapsed = Math.floor((now - reminder.timestamp) / 1000 / 60); // minutes

            const priorityConfig = {
              low: { badgeClass: 'bg-slate-800/60 text-slate-200 border border-white/10', icon: '●', label: 'Low' },
              medium: { badgeClass: 'bg-blue-900/35 text-blue-200 border border-blue-500/20', icon: '●●', label: 'Medium' },
              high: { badgeClass: 'bg-blue-800/45 text-blue-100 border border-blue-400/25', icon: '●●●', label: 'High' },
              urgent: { badgeClass: 'bg-blue-700/55 text-white border border-blue-300/30', icon: '🔥', label: 'URGENT' }
            };

            const platformConfig = {
              wa: { label: 'WhatsApp', emoji: '💬' },
              tele: { label: 'Telegram', emoji: '✈️' },
              shopee_media: { label: 'Shopee Media', emoji: '🛒' },
              shopee_acc: { label: 'Shopee AccStor', emoji: '🛍️' }
            };

            const priority = priorityConfig[reminder.priority] || priorityConfig.medium;
            const platform = platformConfig[reminder.platform] || platformConfig.wa;

            return (
              <div
                key={reminder.id}
                className={`${currentTheme.accent} text-white rounded-2xl ${currentTheme.shadow} border ${currentTheme.borderColor} p-4 animate-slide-in-right`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🚀</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm">{reminder.username}</h4>
                        <p className="text-xs opacity-90">Order Sedang Diproses</p>
                      </div>
                    </div>

                    <div className="bg-white/20 rounded-lg p-2 mb-2">
                      <p className="text-xs font-medium">{reminder.description}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <span className="bg-white/20 px-2 py-0.5 rounded">
                        {platform.emoji} {platform.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${priority.badgeClass}`}>
                        {priority.icon} {priority.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span>Mulai: {reminder.startTime}</span>
                      <span className="font-bold">{elapsed} menit lalu</span>
                    </div>
                  </div>

                  <button
                    onClick={() => dismissOrderReminder(reminder.id)}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs font-semibold text-center animate-pulse">
                    ⚠️ Jangan lupa untuk menyelesaikan order ini!
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pause Reminder Popups */}
        <div className="fixed bottom-24 right-96 z-50 space-y-3 max-w-sm">
          {pauseReminders.map(reminder => {
            const now = Date.now();
            const elapsed = Math.floor((now - reminder.timestamp) / 1000 / 60); // minutes

            const iconConfig = {
              break: { icon: '☕', label: 'Istirahat' },
              izin: { icon: '📋', label: 'Izin' },
              task: { icon: '⏸️', label: 'Pause Task' }
            };

            const config = iconConfig[reminder.type];

            return (
              <div
                key={reminder.id}
                className={`${currentTheme.accent} text-white rounded-2xl ${currentTheme.shadow} border ${currentTheme.borderColor} p-4 animate-slide-in-right`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h4 className="font-bold text-sm">{reminder.empName}</h4>
                        <p className="text-xs opacity-90">{config.label}</p>
                      </div>
                    </div>

                    <div className="bg-white/20 rounded-lg p-2 mb-2">
                      <p className="text-xs font-medium">{reminder.reason}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span>Mulai: {reminder.startTime}</span>
                      <span className="font-bold">{elapsed} menit lalu</span>
                    </div>
                  </div>

                  <button
                    onClick={() => dismissReminder(reminder.id)}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-1.5 transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-white/20">
                  <p className="text-xs font-semibold text-center animate-pulse">
                    ⚠️ Jangan lupa untuk melanjutkan atau menghentikan waktu!
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear All Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`${currentTheme.card} rounded-2xl shadow-2xl border-2 border-blue-500/20 p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${currentTheme.accentSoftBg} p-3 rounded-xl border ${currentTheme.borderColor}`}>
                <Trash2 className={currentTheme.accentText} size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>⚠️ Clear All Data</h3>
                <p className={`text-xs ${currentTheme.subtext}`}>Hapus semua data dari Firebase</p>
              </div>
            </div>

            <div className="bg-blue-950/20 border border-blue-500/15 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-200 font-medium mb-2">
                ⚠️ PERINGATAN:
              </p>
              <ul className="text-xs text-blue-200/80 space-y-1 list-disc list-inside">
                <li>Semua data akan dihapus</li>
                <li>Semua riwayat task akan hilang</li>
                <li>Semua data kehadiran akan direset</li>
                <li>Tindakan ini TIDAK DAPAT DIBATALKAN!</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                Masukkan Password untuk Konfirmasi:
              </label>
              <div className="relative">
                <input
                  type={showClearPassword ? "text" : "password"}
                  value={clearPassword}
                  onChange={(e) => setClearPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className={`w-full px-4 py-3 pr-12 rounded-lg border ${currentTheme.input} text-sm`}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      confirmClearAllData();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowClearPassword(!showClearPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showClearPassword ? "Sembunyikan password" : "Lihat password"}
                >
                  {showClearPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearModal(false);
                  setClearPassword('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all text-sm font-medium hover:scale-[1.01] active:scale-[0.99]`}
              >
                Batal
              </button>
              <button
                onClick={confirmClearAllData}
                className={`flex-1 px-4 py-2 rounded-lg ${currentTheme.accentSoftBg} ${currentTheme.accentText} ${currentTheme.accentHover} transition-all text-sm font-medium ${currentTheme.shadow} border ${currentTheme.borderColor} hover:scale-[1.01] active:scale-[0.99]`}
              >
                🗑️ Hapus Semua Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`${currentTheme.accentSoftBg} p-3 rounded-xl border ${currentTheme.borderColor}`}>
                <Shield className={currentTheme.accentText} size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>🔐 Admin Login</h3>
                <p className={`text-xs ${currentTheme.subtext}`}>Masukkan password admin</p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Email Admin:
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className={`w-full px-4 py-3 rounded-lg border ${currentTheme.input} text-sm`}
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Password:
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className={`w-full px-4 py-3 rounded-lg border ${currentTheme.input} text-sm`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAdminLogin();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setAdminEmail('');
                  setAdminPassword('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all text-sm font-medium hover:scale-[1.01] active:scale-[0.99]`}
              >
                Batal
              </button>
              <button
                onClick={handleAdminLogin}
                disabled={isLoggingIn}
                className={`flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-600 hover:to-blue-500 transition-all text-sm font-medium shadow-md ${isLoggingIn ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'}`}
              >
                {isLoggingIn ? '⏳ Loading...' : '🔓 Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Edit Modal */}
      {editingCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`${currentTheme.card} rounded-2xl shadow-2xl border-2 border-blue-500/20 p-6 max-w-md w-full mx-4`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-950/20 p-3 rounded-xl border border-blue-500/15">
                <Calendar className="text-blue-300" size={24} />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>📅 Edit Kalender</h3>
                <p className={`text-xs ${currentTheme.subtext}`}>
                  {editingCalendar.empName} - {editingCalendar.day} {MONTH_NAMES[editingCalendar.month]} {editingCalendar.year || currentYear}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                  Status Kehadiran:
                </label>
                <select
                  value={editingCalendar.status}
                  onChange={(e) => setEditingCalendar({ ...editingCalendar, status: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border ${currentTheme.input} text-sm`}
                >
                  <option value="belum">Belum Ada Data</option>
                  <option value="hadir">✅ Hadir</option>
                  {!employees.find(e => e.name === editingCalendar.empName)?.isBackup && (
                    <>
                      <option value="telat">⚠️ Telat</option>
                      <option value="lembur">⚡ Lembur</option>
                      <option value="libur">🏖️ Libur</option>
                    </>
                  )}
                  <option value="izin">📋 Izin</option>
                  {!employees.find(e => e.name === editingCalendar.empName)?.isBackup && (
                    <>
                      <option value="sakit">🤒 Sakit</option>
                      <option value="alpha">⛔ Alpha</option>
                    </>
                  )}
                </select>
              </div>

              {/* If Lembur, show base status selector */}
              {editingCalendar.status === 'lembur' && (
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Status Dasar (Shift Pertama):
                  </label>
                  <select
                    value={editingCalendar.overtimeBaseStatus || 'hadir'}
                    onChange={(e) => setEditingCalendar({ ...editingCalendar, overtimeBaseStatus: e.target.value })}
                    className={`w-full px-4 py-3 rounded-lg border ${currentTheme.input} text-sm`}
                  >
                    <option value="hadir">✅ Hadir (Tepat Waktu)</option>
                    <option value="telat">⚠️ Telat</option>
                  </select>
                  <p className={`text-xs ${currentTheme.subtext} mt-1`}>
                    💡 Status shift pertama sebelum lembur
                  </p>
                </div>
              )}

              {(editingCalendar.status === 'telat' || editingCalendar.status === 'lembur') && (
                <div>
                  <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Jam Telat:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingCalendar.lateHours}
                    onChange={(e) => setEditingCalendar({ ...editingCalendar, lateHours: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-3 rounded-lg border ${currentTheme.input} text-sm`}
                    placeholder="Masukkan jam telat"
                  />
                  {editingCalendar.status === 'lembur' && (
                    <p className={`text-xs ${currentTheme.subtext} mt-1`}>
                      💡 Total jam telat dari shift 1 + shift 2
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditingCalendar(null)}
                className={`flex-1 px-4 py-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all text-sm font-medium hover:scale-[1.01] active:scale-[0.99]`}
              >
                Batal
              </button>
              <button
                onClick={handleSaveCalendar}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-600 hover:to-blue-500 transition-all text-sm font-medium shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                💾 Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Visual Loading Overlay - Shows when saving to Firebase */}
      {(isSavingToFirebase || activeSaveOperations.current > 0) && (
        <div className="fixed inset-0 z-[9999]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div className={`${currentTheme.card} w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden`}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/15 to-blue-900/15 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className={`text-base font-semibold ${currentTheme.text}`}>
                      Menyimpan perubahan
                    </h3>
                    <p className={`mt-1 text-sm ${currentTheme.subtext} truncate`}>
                      {currentAction || 'Memproses…'}
                    </p>

                    <div className={`mt-4 h-2 rounded-full ${currentTheme.badge} overflow-hidden`}>
                      <div className="h-full w-1/3 bg-gradient-to-r from-blue-700 to-blue-500 animate-pulse"></div>
                    </div>

                    <p className={`mt-4 text-xs ${currentTheme.subtext}`}>
                      Mohon tunggu, jangan tutup atau refresh halaman sampai proses selesai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSystem;

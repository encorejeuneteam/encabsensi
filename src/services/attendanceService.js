/**
 * Attendance Service
 * Business logic for attendance management
 */

import { SHIFT_CONFIG, ATTENDANCE_STATUS } from '../config'; // ✅ Unified import
import { formatTime, parseTime } from '../utils/dateHelpers';

/**
 * Detect current shift based on time
 * @returns {string|null} Current shift ('pagi', 'malam', or null)
 */
export const detectShift = () => {
  const now = new Date();
  const hour = now.getHours();

  // Pagi: 09:00 - 17:00
  if (hour >= SHIFT_CONFIG.pagi.start && hour < SHIFT_CONFIG.pagi.end) {
    return 'pagi';
  }

  // Malam: 17:00 - 01:00 (crosses midnight)
  if (hour >= SHIFT_CONFIG.malam.start || hour < SHIFT_CONFIG.malam.end) {
    return 'malam';
  }

  return null;
};

/**
 * Calculate late hours for check-in
 * @param {string} timeStr - Check-in time (HH:MM)
 * @param {string} shift - Shift type
 * @param {boolean} hadBreak - Whether employee had break
 * @returns {{isLate: boolean, lateHours: number}} Late calculation
 */
export const calculateLateHours = (timeStr, shift, hadBreak = false) => {
  const { hour, minute } = parseTime(timeStr);
  const shiftConfig = SHIFT_CONFIG[shift];
  if (!shiftConfig) return { isLate: false, lateHours: 0 };

  let maxCheckInHour = shiftConfig.maxCheckIn;
  if (hadBreak) maxCheckInHour += 1; // 1 hour tolerance if had break

  let totalLateMinutes = 0;

  if (shift === 'malam') {
    // Night shift: 17:00-01:00
    if (hour >= 0 && hour < shiftConfig.end) {
      // After midnight (00:00-01:00) - definitely late
      totalLateMinutes = (24 - maxCheckInHour) * 60 + hour * 60 + minute;
    } else if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
      // Same day but after maxCheckIn
      totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
    }
  } else {
    // Day shift: normal calculation
    if (hour > maxCheckInHour || (hour === maxCheckInHour && minute > 1)) {
      totalLateMinutes = (hour - maxCheckInHour) * 60 + minute;
    }
  }

  // Only count as late if more than 1 minute late
  const isLate = totalLateMinutes > 1;
  const lateHours = isLate ? Math.ceil(totalLateMinutes / 60) : 0;

  return { isLate, lateHours };
};

/**
 * Check if employee can check in
 * @param {Object} employee - Employee object
 * @param {string} currentShift - Current shift
 * @returns {{canCheckIn: boolean, reason: string}} Check-in validation
 */
export const canCheckIn = (employee, currentShift) => {
  if (!currentShift) {
    return { canCheckIn: false, reason: 'Tidak ada shift aktif saat ini' };
  }

  if (employee.checkedIn) {
    // Check if already in this shift
    const todayShifts = employee.shifts?.filter(
      s => s.date === new Date().toDateString()
    ) || [];

    if (todayShifts.some(s => s.shift === currentShift)) {
      return { canCheckIn: false, reason: 'Sudah check-in untuk shift ini' };
    }

    // Allow overtime (2nd shift)
    return { canCheckIn: true, reason: 'Overtime shift' };
  }

  return { canCheckIn: true, reason: 'OK' };
};

/**
 * Process check-in for employee
 * @param {Object} employee - Employee object
 * @param {string} currentShift - Current shift
 * @param {Array} allEmployees - All employees for task distribution
 * @returns {Object} Updated employee object
 */
export const processCheckIn = (employee, currentShift, allEmployees) => {
  const now = new Date();
  const timeStr = formatTime(now);
  const hadBreak = employee.breakHistory?.some(
    b => b.date === now.toDateString()
  ) || false;

  const { isLate, lateHours } = calculateLateHours(timeStr, currentShift, hadBreak);
  const status = isLate ? ATTENDANCE_STATUS.TELAT : ATTENDANCE_STATUS.HADIR;

  // Check if it's overtime (2nd shift today)
  const todayShifts = employee.shifts?.filter(
    s => s.date === now.toDateString()
  ) || [];
  const isOvertime = todayShifts.length > 0;

  // Note: Cleaning tasks feature removed - no task distribution on check-in

  // Create shift record
  const newShift = {
    shift: currentShift,
    checkInTime: timeStr,
    date: now.toDateString(),
    status: isOvertime ? ATTENDANCE_STATUS.LEMBUR : status,
    lateHours: lateHours,
    isOvertime: isOvertime
  };

  return {
    ...employee,
    checkedIn: true,
    checkInTime: timeStr,
    shift: currentShift,
    status: isOvertime ? ATTENDANCE_STATUS.LEMBUR : status,
    lateHours: lateHours,
    overtime: isOvertime,
    shifts: [...employee.shifts, newShift]
  };
};

/**
 * Process check-out for employee
 * @param {Object} employee - Employee object
 * @returns {Object} Updated employee object
 */
export const processCheckOut = (employee) => {
  const timeStr = formatTime(new Date());

  // Save all work tasks to history (cleaning tasks feature removed)
  const allWorkTasks = (employee.workTasks || []).map(t => ({
    ...t,
    completedAt: t.completed ? new Date().toISOString() : null,
    shift: employee.shift
  }));

  return {
    ...employee,
    checkedIn: false,
    shiftEndTime: timeStr,
    shift: null,
    breakTime: null,
    hasBreakToday: false,
    workTasks: [],
    completedTasksHistory: [...(employee.completedTasksHistory || []), ...allWorkTasks]
  };
};

/**
 * Calculate salary deduction
 * @param {number} baseSalary - Base salary
 * @param {number} lateHours - Total late hours
 * @param {number} deductionPerHour - Deduction amount per hour
 * @returns {{totalDeduction: number, finalSalary: number}} Salary calculation
 */
export const calculateSalaryDeduction = (baseSalary, lateHours, deductionPerHour) => {
  const totalDeduction = lateHours * deductionPerHour;
  const finalSalary = Math.max(0, baseSalary - totalDeduction);

  return {
    totalDeduction,
    finalSalary
  };
};

export default {
  detectShift,
  calculateLateHours,
  canCheckIn,
  processCheckIn,
  processCheckOut,
  calculateSalaryDeduction
};

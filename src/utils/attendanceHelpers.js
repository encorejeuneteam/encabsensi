/**
 * Attendance Helper Functions
 * Utility functions for attendance data generation and manipulation
 */

import { INITIAL_EMPLOYEES } from '../config'; // ✅ Unified import

/**
 * Generate yearly attendance data structure for all employees
 * @param {number} year - Year to generate for
 * @returns {Object} Yearly attendance data object
 */
export const generateYearlyAttendance = (year = new Date().getFullYear()) => {
  const data = {};

  INITIAL_EMPLOYEES.forEach(employee => {
    data[employee.name] = {};
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      data[employee.name][month] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        // Default status is 'belum' (empty/no data)
        data[employee.name][month][day] = {
          status: 'belum',
          lateHours: 0
        };
      }
    }
  });

  return data;
};

/**
 * Get employee names from initial employees config
 * @returns {string[]} Array of employee names
 */
export const getEmployeeNames = () => {
  return INITIAL_EMPLOYEES.map(emp => emp.name);
};

/**
 * Initialize employee with default structure
 * @param {Object} employee - Employee object
 * @returns {Object} Employee with all default properties
 */
export const initializeEmployee = (employee) => {
  return {
    baseSalary: 0,
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
    completedTasksHistory: [],
    ...employee
  };
};

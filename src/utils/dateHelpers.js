/**
 * Date Helper Functions
 * Centralized date manipulation and formatting utilities
 */

import { MONTH_NAMES, DAY_NAMES } from '../config'; // ✅ Unified import

/**
 * Format date to Indonesian locale
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export const formatDateID = (date = new Date()) => {
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Format time to HH:MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
export const formatTime = (date = new Date()) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format full datetime to Indonesian locale
 * @param {Date} date - Date object
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date = new Date()) => {
  return date.toLocaleString('id-ID');
};

/**
 * Get month name in Indonesian
 * @param {number} month - Month index (0-11)
 * @returns {string} Month name
 */
export const getMonthName = (month) => {
  return MONTH_NAMES[month] || '';
};

/**
 * Get day name in Indonesian
 * @param {number} day - Day index (0-6)
 * @returns {string} Day name
 */
export const getDayName = (day) => {
  return DAY_NAMES[day] || '';
};

/**
 * Get number of days in a month
 * @param {number} year - Year
 * @param {number} month - Month index (0-11)
 * @returns {number} Number of days
 */
export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Check if a date is today
 * @param {Date} date - Date to check
 * @returns {boolean} Is today
 */
export const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is in the past
 * @param {Date} date - Date to check
 * @returns {boolean} Is in the past
 */
export const isPast = (date) => {
  return date < new Date();
};

/**
 * Get current month and year
 * @returns {{month: number, year: number}} Current period
 */
export const getCurrentPeriod = () => {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
};

/**
 * Parse time string to hours and minutes
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {{hour: number, minute: number}} Parsed time
 */
export const parseTime = (timeStr) => {
  if (!timeStr) return { hour: 0, minute: 0 };
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour: hour || 0, minute: minute || 0 };
};

/**
 * Calculate time difference in minutes
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @returns {number} Difference in minutes
 */
export const getTimeDifference = (startTime, endTime) => {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  let diff = (end.hour * 60 + end.minute) - (start.hour * 60 + start.minute);
  
  // Handle overnight shifts
  if (diff < 0) {
    diff += 24 * 60;
  }
  
  return diff;
};

/**
 * Format duration in minutes to hours and minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins} menit`;
  if (mins === 0) return `${hours} jam`;
  return `${hours} jam ${mins} menit`;
};

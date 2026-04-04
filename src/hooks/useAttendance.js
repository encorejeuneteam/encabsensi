/**
 * useAttendance Hook
 * Manages yearly attendance calendar data
 */

import { useState, useCallback } from 'react';

export const useAttendance = () => {
  const [yearlyAttendance, setYearlyAttendance] = useState({});

  // Update attendance for a specific employee and date
  const updateAttendance = useCallback((employeeName, month, day, data) => {
    setYearlyAttendance(prev => ({
      ...prev,
      [employeeName]: {
        ...prev[employeeName],
        [month]: {
          ...prev[employeeName]?.[month],
          [day]: data
        }
      }
    }));
  }, []);

  // Get attendance for employee on specific date
  const getAttendance = useCallback((employeeName, month, day) => {
    return yearlyAttendance[employeeName]?.[month]?.[day] || null;
  }, [yearlyAttendance]);

  // Get monthly attendance for employee
  const getMonthlyAttendance = useCallback((employeeName, month) => {
    return yearlyAttendance[employeeName]?.[month] || {};
  }, [yearlyAttendance]);

  // Get yearly stats for employee
  const getYearlyStats = useCallback((employeeName) => {
    const employeeData = yearlyAttendance[employeeName] || {};
    let hadir = 0;
    let telat = 0;
    let izin = 0;
    let sakit = 0;
    let alpha = 0;
    let lembur = 0;
    let totalLateHours = 0;

    Object.values(employeeData).forEach(monthData => {
      Object.values(monthData).forEach(dayData => {
        switch (dayData.status) {
          case 'hadir':
            hadir++;
            break;
          case 'telat':
            telat++;
            totalLateHours += dayData.lateHours || 0;
            break;
          case 'izin':
            izin++;
            break;
          case 'sakit':
            sakit++;
            break;
          case 'alpha':
            alpha++;
            break;
          case 'lembur':
            lembur++;
            break;
          default:
            break;
        }
      });
    });

    return {
      hadir,
      telat,
      izin,
      sakit,
      alpha,
      lembur,
      totalLateHours,
      total: hadir + telat + izin + sakit + alpha + lembur
    };
  }, [yearlyAttendance]);

  // Clear attendance for specific month
  const clearMonthAttendance = useCallback((employeeName, month) => {
    setYearlyAttendance(prev => ({
      ...prev,
      [employeeName]: {
        ...prev[employeeName],
        [month]: {}
      }
    }));
  }, []);

  return {
    yearlyAttendance,
    setYearlyAttendance,
    updateAttendance,
    getAttendance,
    getMonthlyAttendance,
    getYearlyStats,
    clearMonthAttendance
  };
};

export default useAttendance;

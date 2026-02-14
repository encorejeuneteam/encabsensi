/**
 * useEmployees Hook
 * Manages employee data and operations
 */

import { useState, useCallback, useRef } from 'react';
import { INITIAL_EMPLOYEES } from '../config'; // ✅ Unified import

export const useEmployees = (isSyncingRef) => {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);

  // Update employee
  const updateEmployee = useCallback((employeeId, updates) => {
    setEmployees(prev => prev.map(emp =>
      emp.id === employeeId ? { ...emp, ...updates } : emp
    ));
  }, []);

  // Update multiple employees
  const updateMultipleEmployees = useCallback((updateFn) => {
    setEmployees(prev => prev.map(updateFn));
  }, []);

  // Add task to employee
  const addTaskToEmployee = useCallback((employeeId, task, taskType = 'workTasks') => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          [taskType]: [...emp[taskType], task]
        };
      }
      return emp;
    }));
  }, []);

  // Update task for employee
  const updateEmployeeTask = useCallback((employeeId, taskId, updates, taskType = 'workTasks') => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          [taskType]: emp[taskType].map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        };
      }
      return emp;
    }));
  }, []);

  // Delete task from employee
  const deleteEmployeeTask = useCallback((employeeId, taskId, taskType = 'workTasks') => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          [taskType]: emp[taskType].filter(task => task.id !== taskId)
        };
      }
      return emp;
    }));
  }, []);

  // Get employee by ID
  const getEmployeeById = useCallback((employeeId) => {
    return employees.find(emp => emp.id === employeeId);
  }, [employees]);

  // Get employee by name
  const getEmployeeByName = useCallback((name) => {
    return employees.find(emp => emp.name === name);
  }, [employees]);

  // Get checked-in employees
  const getCheckedInEmployees = useCallback(() => {
    return employees.filter(emp => emp.checkedIn);
  }, [employees]);

  // Get admin employee
  const getAdminEmployee = useCallback(() => {
    return employees.find(emp => emp.isAdmin);
  }, [employees]);

  return {
    employees,
    setEmployees,
    updateEmployee,
    updateMultipleEmployees,
    addTaskToEmployee,
    updateEmployeeTask,
    deleteEmployeeTask,
    getEmployeeById,
    getEmployeeByName,
    getCheckedInEmployees,
    getAdminEmployee
  };
};

export default useEmployees;

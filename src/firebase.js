import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot, getDoc, runTransaction } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Sanitize data for Firebase by removing undefined values
 * Firebase Firestore does not accept undefined values - must be null or removed
 * @param {any} obj - Object to sanitize
 * @returns {any} - Sanitized object
 */
const sanitizeForFirebase = (obj) => {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirebase(item)).filter(item => item !== undefined);
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedValue = sanitizeForFirebase(value);
      // Only add field if value is not undefined
      if (sanitizedValue !== undefined) {
        sanitized[key] = sanitizedValue;
      }
    }
    return sanitized;
  }

  return obj;
};

// Database service
export const dbService = {
  // Save employees data
  async saveEmployees(employees) {
    try {
      // ✅ CRITICAL FIX: Sanitize data before saving to remove undefined values
      const sanitizedEmployees = sanitizeForFirebase(employees);

      await setDoc(doc(db, 'attendance', 'employees'), {
        data: sanitizedEmployees,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Employees saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving employees:', error);
      throw error;
    }
  },

  // Update single employee transactionally (Prevent Race Conditions)
  async updateEmployeeTransaction(updatedEmployee) {
    try {
      if (!updatedEmployee || !updatedEmployee.id) {
        throw new Error('Invalid employee data for update');
      }

      const sanitizedEmployee = sanitizeForFirebase(updatedEmployee);
      const employeesRef = doc(db, 'attendance', 'employees');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(employeesRef);
        if (!sfDoc.exists()) {
          throw new Error("Document does not exist!");
        }

        const currentData = sfDoc.data();
        const currentEmployees = currentData.data || [];

        // Find index of employee to update
        const empIndex = currentEmployees.findIndex(e => e.id === updatedEmployee.id);

        let newEmployees;
        if (empIndex === -1) {
          // Employee not found, arguably should append, but in this system employees are fixed.
          // We will append just in case/or throw. Let's append to be safe if ID not found.
          newEmployees = [...currentEmployees, sanitizedEmployee];
        } else {
          // Update specific employee
          newEmployees = [...currentEmployees];
          newEmployees[empIndex] = sanitizedEmployee;
        }

        transaction.set(employeesRef, {
          data: newEmployees,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log(`✅ Employee ${updatedEmployee.name} updated transactionally`);
    } catch (error) {
      console.error('❌ Error updating employee transactionally:', error);
      throw error;
    }
  },

  // Get employees data (for verification)
  async getEmployees() {
    try {
      const docSnap = await getDoc(doc(db, 'attendance', 'employees'));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting employees:', error);
      throw error;
    }
  },

  // Save attentions data
  async saveAttentions(attentions) {
    try {
      const sanitizedAttentions = sanitizeForFirebase(attentions);
      await setDoc(doc(db, 'attendance', 'attentions'), {
        data: sanitizedAttentions,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Attentions saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving attentions:', error);
      throw error;
    }
  },

  // Save yearly attendance
  async saveYearlyAttendance(yearlyAttendance) {
    try {
      const sanitizedYearlyAttendance = sanitizeForFirebase(yearlyAttendance);
      await setDoc(doc(db, 'attendance', 'yearlyAttendance'), {
        data: sanitizedYearlyAttendance,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Yearly attendance saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving yearly attendance:', error);
      throw error;
    }
  },

  // Save productivity data
  async saveProductivityData(productivityData) {
    try {
      const sanitizedProductivityData = sanitizeForFirebase(productivityData);
      await setDoc(doc(db, 'attendance', 'productivityData'), {
        data: sanitizedProductivityData,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Productivity data saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving productivity data:', error);
      throw error;
    }
  },

  // Save current month/year
  async saveCurrentPeriod(currentMonth, currentYear) {
    try {
      await setDoc(doc(db, 'attendance', 'currentPeriod'), {
        currentMonth,
        currentYear,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Current period saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving current period:', error);
      throw error;
    }
  },

  // Save shift tasks - REMOVED (cleaning tasks feature removed)


  // Listen to employees changes (realtime)
  onEmployeesChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'employees'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Employees updated from Firestore');
        callback(doc.data().data);
      }
    }, (error) => {
      console.error('❌ Error listening to employees:', error);
    });
  },

  // Listen to attentions changes (realtime)
  onAttentionsChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'attentions'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Attentions updated from Firestore');
        callback(doc.data().data);
      }
    }, (error) => {
      console.error('❌ Error listening to attentions:', error);
    });
  },

  // Listen to yearly attendance changes (realtime)
  onYearlyAttendanceChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'yearlyAttendance'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Yearly attendance updated from Firestore');
        callback(doc.data().data);
      }
    }, (error) => {
      console.error('❌ Error listening to yearly attendance:', error);
    });
  },

  // Listen to productivity data changes (realtime)
  onProductivityDataChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'productivityData'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Productivity data updated from Firestore');
        callback(doc.data().data);
      }
    }, (error) => {
      console.error('❌ Error listening to productivity data:', error);
    });
  },

  // Listen to current period changes (realtime)
  onCurrentPeriodChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'currentPeriod'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Current period updated from Firestore');
        const data = doc.data();
        callback(data.currentMonth, data.currentYear);
      }
    }, (error) => {
      console.error('❌ Error listening to current period:', error);
    });
  },

  // Listen to shift tasks changes - REMOVED (cleaning tasks feature removed)


  // Save shift schedule
  async saveShiftSchedule(shiftSchedule) {
    try {
      const sanitizedShiftSchedule = sanitizeForFirebase(shiftSchedule);
      await setDoc(doc(db, 'attendance', 'shiftSchedule'), {
        data: sanitizedShiftSchedule,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Shift schedule saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving shift schedule:', error);
      throw error;
    }
  },

  // Listen to shift schedule changes
  onShiftScheduleChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'shiftSchedule'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Shift schedule updated from Firestore');
        callback(doc.data().data);
      }
    });
  },

  // Save orders data
  async saveOrders(orders) {
    try {
      const sanitizedOrders = sanitizeForFirebase(orders);
      await setDoc(doc(db, 'attendance', 'orders'), {
        data: sanitizedOrders,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Orders saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving orders:', error);
      throw error;
    }
  },

  // Listen to orders changes
  onOrdersChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'orders'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Orders updated from Firestore');
        callback(doc.data().data);
      }
    });
  },

  // Save mbak tasks
  async saveMbakTasks(tasks) {
    try {
      const sanitizedTasks = sanitizeForFirebase(tasks);
      await setDoc(doc(db, 'attendance', 'mbakData'), {
        data: sanitizedTasks,
        lastUpdated: new Date().toISOString()
      });
      console.log('✅ Mbak tasks saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving mbak tasks:', error);
      throw error;
    }
  },

  // Listen to mbak tasks changes
  onMbakTasksChange(callback) {
    return onSnapshot(doc(db, 'attendance', 'mbakData'), (doc) => {
      if (doc.exists()) {
        console.log('🔄 Mbak tasks updated from Firestore');
        callback(doc.data().data);
      }
    });
  },

  // Load initial data (one-time read)
  async loadInitialData() {
    try {
      console.log('📥 Loading initial data from Firebase...');

      const [employeesDoc, attendanceDoc, productivityDoc, attentionsDoc, periodDoc, shiftScheduleDoc, ordersDoc, mbakDoc] = await Promise.all([
        getDoc(doc(db, 'attendance', 'employees')),
        getDoc(doc(db, 'attendance', 'yearlyAttendance')),
        getDoc(doc(db, 'attendance', 'productivityData')),
        getDoc(doc(db, 'attendance', 'attentions')),
        getDoc(doc(db, 'attendance', 'currentPeriod')),
        getDoc(doc(db, 'attendance', 'shiftSchedule')),
        getDoc(doc(db, 'attendance', 'orders')),
        getDoc(doc(db, 'attendance', 'mbakData'))
      ]);

      const data = {
        employees: employeesDoc.exists() ? employeesDoc.data().data : null,
        yearlyAttendance: attendanceDoc.exists() ? attendanceDoc.data().data : null,
        productivityData: productivityDoc.exists() ? productivityDoc.data().data : null,
        attentions: attentionsDoc.exists() ? attentionsDoc.data().data : null,
        currentPeriod: periodDoc.exists() ? {
          currentMonth: periodDoc.data().currentMonth,
          currentYear: periodDoc.data().currentYear
        } : null,
        shiftSchedule: shiftScheduleDoc.exists() ? shiftScheduleDoc.data().data : null,
        orders: ordersDoc.exists() ? ordersDoc.data().data : null,
        mbakTasks: mbakDoc.exists() ? mbakDoc.data().data : []
      };

      console.log('✅ Initial data loaded:', {
        employees: data.employees?.length || 0,
        hasAttendance: !!data.yearlyAttendance,
        productivity: data.productivityData?.length || 0,
        attentions: data.attentions?.length || 0,
        shiftSchedule: !!data.shiftSchedule,
        orders: data.orders?.length || 0,
        mbakTasks: data.mbakTasks?.length || 0
      });

      return data;
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      return null;
    }
  },

  // ==========================================
  // TRANSACTION METHODS (Race Condition Safe)
  // ==========================================

  // ✅ Add order with transaction (prevent race condition)
  async addOrderTransaction(newOrder) {
    try {
      const sanitizedOrder = sanitizeForFirebase(newOrder);
      const ordersRef = doc(db, 'attendance', 'orders');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(ordersRef);
        const currentOrders = sfDoc.exists() ? (sfDoc.data().data || []) : [];

        transaction.set(ordersRef, {
          data: [sanitizedOrder, ...currentOrders],
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Order added via transaction');
    } catch (error) {
      console.error('❌ Error adding order (transaction):', error);
      throw error;
    }
  },

  // ✅ Update order with transaction
  async updateOrderTransaction(orderId, updates) {
    try {
      const sanitizedUpdates = sanitizeForFirebase(updates);
      const ordersRef = doc(db, 'attendance', 'orders');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(ordersRef);
        if (!sfDoc.exists()) throw new Error("Orders document does not exist!");

        const currentOrders = sfDoc.data().data || [];
        const updatedOrders = currentOrders.map(order =>
          order.id === orderId
            ? { ...order, ...sanitizedUpdates, updatedAt: new Date().toISOString() }
            : order
        );

        transaction.set(ordersRef, {
          data: updatedOrders,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Order updated via transaction:', orderId);
    } catch (error) {
      console.error('❌ Error updating order (transaction):', error);
      throw error;
    }
  },

  // ✅ Delete order with transaction
  async deleteOrderTransaction(orderId) {
    try {
      const ordersRef = doc(db, 'attendance', 'orders');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(ordersRef);
        if (!sfDoc.exists()) return;

        const currentOrders = sfDoc.data().data || [];
        const filteredOrders = currentOrders.filter(o => o.id !== orderId);

        transaction.set(ordersRef, {
          data: filteredOrders,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Order deleted via transaction:', orderId);
    } catch (error) {
      console.error('❌ Error deleting order (transaction):', error);
      throw error;
    }
  },

  // ✅ Add attention with transaction
  async addAttentionTransaction(newAttention) {
    try {
      const sanitizedAttention = sanitizeForFirebase(newAttention);
      const attentionsRef = doc(db, 'attendance', 'attentions');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(attentionsRef);
        const currentAttentions = sfDoc.exists() ? (sfDoc.data().data || []) : [];

        transaction.set(attentionsRef, {
          data: [sanitizedAttention, ...currentAttentions],
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Attention added via transaction');
    } catch (error) {
      console.error('❌ Error adding attention (transaction):', error);
      throw error;
    }
  },

  // ✅ Update attention with transaction
  async updateAttentionTransaction(attentionId, updates) {
    try {
      const sanitizedUpdates = sanitizeForFirebase(updates);
      const attentionsRef = doc(db, 'attendance', 'attentions');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(attentionsRef);
        if (!sfDoc.exists()) throw new Error("Attentions document does not exist!");

        const currentAttentions = sfDoc.data().data || [];
        const updatedAttentions = currentAttentions.map(att =>
          att.id === attentionId
            ? { ...att, ...sanitizedUpdates, updatedAt: new Date().toISOString() }
            : att
        );

        transaction.set(attentionsRef, {
          data: updatedAttentions,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Attention updated via transaction:', attentionId);
    } catch (error) {
      console.error('❌ Error updating attention (transaction):', error);
      throw error;
    }
  },

  // ✅ Delete attention with transaction
  async deleteAttentionTransaction(attentionId) {
    try {
      const attentionsRef = doc(db, 'attendance', 'attentions');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(attentionsRef);
        if (!sfDoc.exists()) return;

        const currentAttentions = sfDoc.data().data || [];
        const filteredAttentions = currentAttentions.filter(a => a.id !== attentionId);

        transaction.set(attentionsRef, {
          data: filteredAttentions,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Attention deleted via transaction:', attentionId);
    } catch (error) {
      console.error('❌ Error deleting attention (transaction):', error);
      throw error;
    }
  },

  // ✅ Add mbak task with transaction
  async addMbakTaskTransaction(newTask) {
    try {
      const sanitizedTask = sanitizeForFirebase(newTask);
      const mbakRef = doc(db, 'attendance', 'mbakData');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(mbakRef);
        const currentTasks = sfDoc.exists() ? (sfDoc.data().data || []) : [];

        transaction.set(mbakRef, {
          data: [sanitizedTask, ...currentTasks],
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Mbak task added via transaction');
    } catch (error) {
      console.error('❌ Error adding mbak task (transaction):', error);
      throw error;
    }
  },

  // ✅ Update mbak task with transaction
  async updateMbakTaskTransaction(taskId, updates) {
    try {
      const sanitizedUpdates = sanitizeForFirebase(updates);
      const mbakRef = doc(db, 'attendance', 'mbakData');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(mbakRef);
        if (!sfDoc.exists()) throw new Error("Mbak tasks document does not exist!");

        const currentTasks = sfDoc.data().data || [];
        const updatedTasks = currentTasks.map(task =>
          task.id === taskId
            ? { ...task, ...sanitizedUpdates, updatedAt: new Date().toISOString() }
            : task
        );

        transaction.set(mbakRef, {
          data: updatedTasks,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Mbak task updated via transaction:', taskId);
    } catch (error) {
      console.error('❌ Error updating mbak task (transaction):', error);
      throw error;
    }
  },

  // ✅ Delete mbak task with transaction
  async deleteMbakTaskTransaction(taskId) {
    try {
      const mbakRef = doc(db, 'attendance', 'mbakData');

      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(mbakRef);
        if (!sfDoc.exists()) return;

        const currentTasks = sfDoc.data().data || [];
        const filteredTasks = currentTasks.filter(t => t.id !== taskId);

        transaction.set(mbakRef, {
          data: filteredTasks,
          lastUpdated: new Date().toISOString()
        });
      });

      console.log('✅ Mbak task deleted via transaction:', taskId);
    } catch (error) {
      console.error('❌ Error deleting mbak task (transaction):', error);
      throw error;
    }
  }
};

// Authentication service
export const authService = {
  // App unlock with Firebase Auth (user login)
  async unlockApp(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ App unlocked:', userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ Unlock error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Admin login with Firebase Auth
  async loginAdmin(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Admin logged in:', userCredential.user.email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Admin logout
  async logoutAdmin() {
    try {
      await signOut(auth);
      console.log('✅ Admin logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Check auth state
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  }
};

export default db;

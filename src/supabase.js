import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// DATABASE SERVICE (Same API as firebase.js dbService)
// ============================================================================
export const dbService = {

  // ── SAVE OPERATIONS ──────────────────────────────────────────────────────

  async saveEmployees(employees) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key: 'employees', data: employees, last_updated: new Date().toISOString() });
      if (error) throw error;
      console.log('✅ Employees saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving employees:', error);
      throw error;
    }
  },

  async updateEmployeeTransaction(updatedEmployee) {
    try {
      if (!updatedEmployee || !updatedEmployee.id) {
        throw new Error('Invalid employee data for update');
      }

      // Read current employees
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'employees')
        .single();
      if (readError) throw readError;

      const currentEmployees = row?.data || [];
      const empIndex = currentEmployees.findIndex(e => e.id === updatedEmployee.id);

      let newEmployees;
      if (empIndex === -1) {
        newEmployees = [...currentEmployees, updatedEmployee];
      } else {
        newEmployees = [...currentEmployees];
        newEmployees[empIndex] = updatedEmployee;
      }

      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'employees', data: newEmployees, last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log(`✅ Employee ${updatedEmployee.name} updated`);
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      throw error;
    }
  },

  async getEmployees() {
    try {
      const { data: row, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'employees')
        .single();
      if (error) throw error;
      return row ? { data: row.data } : null;
    } catch (error) {
      console.error('❌ Error getting employees:', error);
      throw error;
    }
  },

  async saveAttentions(attentions) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key: 'attentions', data: attentions, last_updated: new Date().toISOString() });
      if (error) throw error;
      console.log('✅ Attentions saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving attentions:', error);
      throw error;
    }
  },

  async saveYearlyAttendance(yearlyAttendance) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key: 'yearlyAttendance', data: yearlyAttendance, last_updated: new Date().toISOString() });
      if (error) throw error;
      console.log('✅ Yearly attendance saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving yearly attendance:', error);
      throw error;
    }
  },

  async saveProductivityData(productivityData) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key: 'productivityData', data: productivityData, last_updated: new Date().toISOString() });
      if (error) throw error;
      console.log('✅ Productivity data saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving productivity data:', error);
      throw error;
    }
  },

  async saveCurrentPeriod(currentMonth, currentYear) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({
          key: 'currentPeriod',
          data: { currentMonth, currentYear },
          last_updated: new Date().toISOString()
        });
      if (error) throw error;
      console.log('✅ Current period saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving current period:', error);
      throw error;
    }
  },

  async saveShiftSchedule(shiftSchedule) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key: 'shiftSchedule', data: shiftSchedule, last_updated: new Date().toISOString() });
      if (error) throw error;
      console.log('✅ Shift schedule saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving shift schedule:', error);
      throw error;
    }
  },

  async saveOrders(orders) {
    try {
      const { error } = await supabase
        .from('app_data')
        .upsert({ key: 'orders', data: orders, last_updated: new Date().toISOString() });
      if (error) throw error;
      console.log('✅ Orders saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving orders:', error);
      throw error;
    }
  },

  // ── REALTIME LISTENERS ────────────────────────────────────────────────────

  onEmployeesChange(callback) {
    const channel = supabase
      .channel('employees_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.employees' },
        (payload) => {
          console.log('🔄 Employees updated from Supabase');
          callback(payload.new.data);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onAttentionsChange(callback) {
    const channel = supabase
      .channel('attentions_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.attentions' },
        (payload) => {
          console.log('🔄 Attentions updated from Supabase');
          callback(payload.new.data);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onYearlyAttendanceChange(callback) {
    const channel = supabase
      .channel('yearlyattendance_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.yearlyAttendance' },
        (payload) => {
          console.log('🔄 Yearly attendance updated from Supabase');
          callback(payload.new.data);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onProductivityDataChange(callback) {
    const channel = supabase
      .channel('productivitydata_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.productivityData' },
        (payload) => {
          console.log('🔄 Productivity data updated from Supabase');
          callback(payload.new.data);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onCurrentPeriodChange(callback) {
    const channel = supabase
      .channel('currentperiod_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.currentPeriod' },
        (payload) => {
          console.log('🔄 Current period updated from Supabase');
          const data = payload.new.data;
          callback(data.currentMonth, data.currentYear);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onShiftScheduleChange(callback) {
    const channel = supabase
      .channel('shiftschedule_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.shiftSchedule' },
        (payload) => {
          console.log('🔄 Shift schedule updated from Supabase');
          callback(payload.new.data);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  onOrdersChange(callback) {
    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'app_data', filter: 'key=eq.orders' },
        (payload) => {
          console.log('🔄 Orders updated from Supabase');
          callback(payload.new.data);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  // ── LOAD INITIAL DATA ─────────────────────────────────────────────────────

  async loadInitialData() {
    try {
      console.log('📥 Loading initial data from Supabase...');

      const { data: rows, error } = await supabase
        .from('app_data')
        .select('key, data');

      if (error) throw error;

      // Convert rows array to keyed object
      const dataMap = {};
      (rows || []).forEach(row => {
        dataMap[row.key] = row.data;
      });

      const data = {
        employees: dataMap.employees || null,
        yearlyAttendance: dataMap.yearlyAttendance || null,
        productivityData: dataMap.productivityData || null,
        attentions: dataMap.attentions || null,
        currentPeriod: dataMap.currentPeriod ? {
          currentMonth: dataMap.currentPeriod.currentMonth,
          currentYear: dataMap.currentPeriod.currentYear
        } : null,
        shiftSchedule: dataMap.shiftSchedule || null,
        orders: dataMap.orders || null
      };

      console.log('✅ Initial data loaded:', {
        employees: data.employees?.length || 0,
        hasAttendance: !!data.yearlyAttendance,
        productivity: data.productivityData?.length || 0,
        attentions: data.attentions?.length || 0,
        shiftSchedule: !!data.shiftSchedule,
        orders: data.orders?.length || 0
      });

      return data;
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      return null;
    }
  },

  // ── TRANSACTION METHODS (Read-Modify-Write) ───────────────────────────────

  async addOrderTransaction(newOrder) {
    try {
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'orders')
        .single();
      if (readError && readError.code !== 'PGRST116') throw readError;

      const currentOrders = row?.data || [];
      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'orders', data: [newOrder, ...currentOrders], last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log('✅ Order added');
    } catch (error) {
      console.error('❌ Error adding order:', error);
      throw error;
    }
  },

  async updateOrderTransaction(orderId, updates) {
    try {
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'orders')
        .single();
      if (readError) throw readError;

      const currentOrders = row?.data || [];
      const updatedOrders = currentOrders.map(order =>
        order.id === orderId
          ? { ...order, ...updates, updatedAt: new Date().toISOString() }
          : order
      );

      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'orders', data: updatedOrders, last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log('✅ Order updated:', orderId);
    } catch (error) {
      console.error('❌ Error updating order:', error);
      throw error;
    }
  },

  async deleteOrderTransaction(orderId) {
    try {
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'orders')
        .single();
      if (readError) throw readError;

      const currentOrders = row?.data || [];
      const filteredOrders = currentOrders.filter(o => o.id !== orderId);

      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'orders', data: filteredOrders, last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log('✅ Order deleted:', orderId);
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      throw error;
    }
  },

  async addAttentionTransaction(newAttention) {
    try {
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'attentions')
        .single();
      if (readError && readError.code !== 'PGRST116') throw readError;

      const currentAttentions = row?.data || [];
      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'attentions', data: [newAttention, ...currentAttentions], last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log('✅ Attention added');
    } catch (error) {
      console.error('❌ Error adding attention:', error);
      throw error;
    }
  },

  async updateAttentionTransaction(attentionId, updates) {
    try {
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'attentions')
        .single();
      if (readError) throw readError;

      const currentAttentions = row?.data || [];
      const updatedAttentions = currentAttentions.map(att =>
        att.id === attentionId
          ? { ...att, ...updates, updatedAt: new Date().toISOString() }
          : att
      );

      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'attentions', data: updatedAttentions, last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log('✅ Attention updated:', attentionId);
    } catch (error) {
      console.error('❌ Error updating attention:', error);
      throw error;
    }
  },

  async deleteAttentionTransaction(attentionId) {
    try {
      const { data: row, error: readError } = await supabase
        .from('app_data')
        .select('data')
        .eq('key', 'attentions')
        .single();
      if (readError) throw readError;

      const currentAttentions = row?.data || [];
      const filteredAttentions = currentAttentions.filter(a => a.id !== attentionId);

      const { error: writeError } = await supabase
        .from('app_data')
        .upsert({ key: 'attentions', data: filteredAttentions, last_updated: new Date().toISOString() });
      if (writeError) throw writeError;

      console.log('✅ Attention deleted:', attentionId);
    } catch (error) {
      console.error('❌ Error deleting attention:', error);
      throw error;
    }
  }
};

// ============================================================================
// AUTHENTICATION SERVICE (Using Supabase Auth)
// ============================================================================
export const authService = {
  // App unlock with Supabase Auth
  async unlockApp(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('✅ App unlocked:', data.user.email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Unlock error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Admin login with Supabase Auth
  async loginAdmin(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('✅ Admin logged in:', data.user.email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Admin logout
  async logoutAdmin() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('✅ Admin logged out');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Check auth state
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });
    return () => subscription.unsubscribe();
  },

  // Get current user
  getCurrentUser() {
    return supabase.auth.getUser().then(({ data }) => data?.user || null);
  }
};

export default supabase;

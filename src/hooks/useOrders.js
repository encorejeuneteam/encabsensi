import { useState, useCallback } from 'react';
import { ORDER_STATUS } from '../config'; // Unified import
import { dbService } from '../firebase';

/**
 * Custom Hook for Orders Management
 * 
 * Extracts all orders-related business logic from App.js
 * Provides clean API for order operations
 * NOW WITH DIRECT FIREBASE SYNC!
 * 
 * @param {Function} addNotification - Notification handler from parent
 * @param {Array} employees - Employees list for createdBy
 * @param {Object} isSyncingRef - Ref to check if syncing from Firebase
 * @param {Object} saveTracker - Optional save tracker callbacks from parent
 * @returns {Object} Orders state and handlers
 */
export const useOrders = (addNotification, employees = [], isSyncingRef = { current: false }, saveTracker = null) => {
  const startSaveOperation = saveTracker?.startSaveOperation;
  const endSaveOperation = saveTracker?.endSaveOperation;

  // State
  const [orders, setOrders] = useState([]);
  const [isOrdersLoaded, setIsOrdersLoaded] = useState(false); // Track if orders loaded from Firebase
  const [orderForm, setOrderForm] = useState({
    username: '',
    platform: 'wa',
    description: '',
    quantity: '',
    status: ORDER_STATUS.PENDING,
    priority: 'medium',
    dueDate: ''
  });
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderPlatformFilter, setOrderPlatformFilter] = useState('all');

  // ✅ Wrapper for setOrders to track loading state
  const setOrdersWithFlag = useCallback((newOrders) => {
    setOrders(newOrders);
    setIsOrdersLoaded(true);
  }, []);

  // Handlers
  const addOrder = useCallback(async () => {
    // ✅ CRITICAL: Don't add if orders not loaded yet (prevent data loss)
    if (!isOrdersLoaded) {
      console.warn('⚠️ Orders not loaded yet - please wait');
      addNotification?.('⚠️ Mohon tunggu data dimuat terlebih dahulu...', 'warning');
      return false;
    }
    if (!orderForm.username.trim() || !orderForm.description.trim()) {
      addNotification?.('⚠️ Username dan deskripsi harus diisi!', 'warning');
      return false;
    }

    const newOrder = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...orderForm,
      createdAt: new Date().toISOString(),
      createdBy: employees.find(e => e.isAdmin)?.name || 'Admin',
      updatedAt: new Date().toISOString(),
      completedAt: null,
      notes: []
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);

    // ✅ Save to Firebase immediately using TRANSACTION (race-condition safe)
    if (!isSyncingRef.current) {
      if (startSaveOperation) startSaveOperation('Orders: Tambah');
      try {
        await dbService.addOrderTransaction(newOrder);
        console.log('💾 ORDER ADDED VIA TRANSACTION:', {
          count: updatedOrders.length,
          timestamp: new Date().toISOString(),
          latestOrder: {
            id: newOrder.id,
            username: newOrder.username,
            status: newOrder.status
          }
        });
      } catch (error) {
        console.error('❌ Error saving order:', error);
        addNotification?.('⚠️ Gagal menyimpan order ke database!', 'error');
      } finally {
        if (endSaveOperation) endSaveOperation('Orders: Tambah');
      }
    } else {
      console.log('⏭️ Skipped save - syncing from Firebase');
    }

    // Reset form
    setOrderForm({
      username: '',
      platform: 'wa',
      description: '',
      quantity: '',
      status: ORDER_STATUS.PENDING,
      priority: 'medium',
      dueDate: ''
    });

    addNotification?.(`✅ Order dari ${newOrder.username} berhasil ditambahkan!`, 'success');
    return true;
  }, [orderForm, employees, addNotification, orders, isOrdersLoaded, isSyncingRef]);

  const updateOrder = useCallback(async (id, updates) => {
    if (!isOrdersLoaded) {
      console.warn('⚠️ Orders not loaded yet - cannot update');
      return;
    }
    const updatedOrders = orders.map(order =>
      order.id === id
        ? { ...order, ...updates, updatedAt: new Date().toISOString() }
        : order
    );
    setOrders(updatedOrders);

    // ✅ Save to Firebase immediately using TRANSACTION (race-condition safe)
    if (!isSyncingRef.current) {
      if (startSaveOperation) startSaveOperation('Orders: Update');
      try {
        await dbService.updateOrderTransaction(id, updates);
        console.log('💾 ORDER UPDATED VIA TRANSACTION:', {
          count: updatedOrders.length,
          updatedOrderId: id,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error updating order:', error);
        addNotification?.('⚠️ Gagal update order ke database!', 'error');
      } finally {
        if (endSaveOperation) endSaveOperation('Orders: Update');
      }
    } else {
      console.log('⏭️ Skipped save - syncing from Firebase');
    }

    addNotification?.('✅ Order berhasil diupdate!', 'success');
  }, [addNotification, orders, isOrdersLoaded, isSyncingRef]);

  const updateOrderStatus = useCallback(async (id, newStatus, processNote = '') => {
    if (!isOrdersLoaded) {
      console.warn('⚠️ Orders not loaded yet - cannot update status');
      return;
    }

    const updatedOrders = orders.map(order => {
      if (order.id === id) {
        const updates = {
          status: newStatus,
          updatedAt: new Date().toISOString()
        };

        // Add completion timestamp
        if (newStatus === ORDER_STATUS.COMPLETED) {
          updates.completedAt = new Date().toISOString();
        }

        // Add process note to notes array
        if (newStatus === 'process' && processNote.trim()) {
          const newNote = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: processNote,
            createdAt: new Date().toISOString(),
            createdBy: employees.find(e => e.isAdmin)?.name || 'Admin'
          };
          updates.notes = [...(order.notes || []), newNote];
        }

        return { ...order, ...updates };
      }
      return order;
    });
    setOrders(updatedOrders);

    // ✅ Save to Firebase immediately using TRANSACTION (race-condition safe)
    if (!isSyncingRef.current) {
      if (startSaveOperation) startSaveOperation('Orders: Status');
      try {
        const updates = {
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === ORDER_STATUS.COMPLETED ? { completedAt: new Date().toISOString() } : {}),
          ...(newStatus === 'process' && processNote.trim() ? {
            notes: [...(orders.find(o => o.id === id)?.notes || []), {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              text: processNote,
              createdAt: new Date().toISOString(),
              createdBy: employees.find(e => e.isAdmin)?.name || 'Admin'
            }]
          } : {})
        };
        await dbService.updateOrderTransaction(id, updates);
        console.log('💾 ORDER STATUS UPDATED VIA TRANSACTION:', {
          count: updatedOrders.length,
          orderId: id,
          newStatus: newStatus,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Error updating order status:', error);
        addNotification?.('⚠️ Gagal update status ke database!', 'error');
      } finally {
        if (endSaveOperation) endSaveOperation('Orders: Status');
      }
    } else {
      console.log('⏭️ Skipped save - syncing from Firebase');
    }

    const statusText = newStatus === 'pending' ? 'Pending' :
      newStatus === 'process' ? 'Sedang Diproses' : 'Selesai';

    // 🔔 Play sound notification for process status
    if (newStatus === 'process') {
      try {
        // Create notification sound using Web Audio API
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

      // 📢 Enhanced notification for process status
      const order = orders.find(o => o.id === id);
      addNotification?.(`🚀 Order dari ${order?.username || 'customer'} MULAI DIPROSES!`, 'info');

      // 🔔 Show browser notification (works even when tab is inactive)
      console.log('🔔 Attempting browser notification, permission:', Notification.permission);
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          console.log('✅ Creating browser notification...');
          const notification = new Notification('🚀 ORDER MULAI DIPROSES!', {
            body: `${order?.username || 'Customer'} - ${order?.description || 'Order baru'}\nPlatform: ${order?.platform?.toUpperCase() || 'N/A'}`,
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'order-processing',
            requireInteraction: true,
            silent: false
          });

          console.log('✅ Browser notification created');

          setTimeout(() => notification.close(), 10000);

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch (e) {
          console.error('⚠️ Browser notification error:', e);
        }
      } else {
        console.warn('⚠️ Browser notification not available:', {
          hasNotification: 'Notification' in window,
          permission: Notification?.permission
        });
      }
    } else {
      addNotification?.(`✅ Order diupdate ke ${statusText}!`, 'success');
    }
  }, [addNotification, orders, employees, isOrdersLoaded, isSyncingRef]);

  const deleteOrder = useCallback(async (id) => {
    if (!isOrdersLoaded) {
      console.warn('⚠️ Orders not loaded yet - cannot delete');
      return;
    }
    if (window.confirm('Yakin ingin menghapus order ini?')) {
      const updatedOrders = orders.filter(o => o.id !== id);
      setOrders(updatedOrders);

      // ✅ Save to Firebase immediately using TRANSACTION (race-condition safe)
      if (!isSyncingRef.current) {
        if (startSaveOperation) startSaveOperation('Orders: Hapus');
        try {
          await dbService.deleteOrderTransaction(id);
          console.log('💾 ORDER DELETED VIA TRANSACTION:', {
            count: updatedOrders.length,
            deletedOrderId: id,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Error deleting order:', error);
          addNotification?.('⚠️ Gagal hapus order dari database!', 'error');
        } finally {
          if (endSaveOperation) endSaveOperation('Orders: Hapus');
        }
      } else {
        console.log('⏭️ Skipped save - syncing from Firebase');
      }

      addNotification?.('✅ Order berhasil dihapus!', 'success');
    }
  }, [addNotification, orders, isOrdersLoaded, isSyncingRef]);

  const addOrderNote = useCallback(async (id, note) => {
    if (!isOrdersLoaded) {
      console.warn('⚠️ Orders not loaded yet - cannot add note');
      return;
    }
    if (!note.trim()) return;

    const updatedOrders = orders.map(order => {
      if (order.id === id) {
        const newNote = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: note,
          createdAt: new Date().toISOString(),
          createdBy: employees.find(e => e.isAdmin)?.name || 'Admin'
        };
        return {
          ...order,
          notes: [...(order.notes || []), newNote],
          updatedAt: new Date().toISOString()
        };
      }
      return order;
    });
    setOrders(updatedOrders);

    // ✅ Save to Firebase immediately using TRANSACTION (race-condition safe)
    if (!isSyncingRef.current) {
      if (startSaveOperation) startSaveOperation('Orders: Catatan');
      try {
        const order = orders.find(o => o.id === id);
        const newNote = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: note,
          createdAt: new Date().toISOString(),
          createdBy: employees.find(e => e.isAdmin)?.name || 'Admin'
        };
        await dbService.updateOrderTransaction(id, {
          notes: [...(order?.notes || []), newNote]
        });
        console.log('✅ Note added via transaction');
      } catch (error) {
        console.error('❌ Error adding note:', error);
      } finally {
        if (endSaveOperation) endSaveOperation('Orders: Catatan');
      }
    } else {
      console.log('⏭️ Skipped save - syncing from Firebase');
    }

    addNotification?.('✅ Catatan berhasil ditambahkan!', 'success');
  }, [employees, addNotification, orders, isOrdersLoaded, isSyncingRef]);

  // Computed values
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (orderFilter !== 'all' && order.status !== orderFilter) return false;

    // Platform filter
    if (orderPlatformFilter !== 'all' && order.platform !== orderPlatformFilter) return false;

    // Search filter
    if (orderSearch.trim()) {
      const search = orderSearch.toLowerCase();
      const matchUsername = order.username.toLowerCase().includes(search);
      const matchDescription = order.description.toLowerCase().includes(search);
      if (!matchUsername && !matchDescription) return false;
    }

    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === ORDER_STATUS.PENDING).length,
    process: orders.filter(o => o.status === 'process').length,
    completed: orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length,
    overdue: orders.filter(o => {
      if (o.status === ORDER_STATUS.COMPLETED || !o.dueDate) return false;
      return new Date(o.dueDate) < new Date();
    }).length
  };

  return {
    // State
    orders,
    setOrders: setOrdersWithFlag,
    isOrdersLoaded,
    orderForm,
    setOrderForm,
    orderFilter,
    setOrderFilter,
    orderSearch,
    setOrderSearch,
    orderPlatformFilter,
    setOrderPlatformFilter,

    // Computed
    filteredOrders,
    stats,

    // Handlers
    addOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    addOrderNote
  };
};

export default useOrders;

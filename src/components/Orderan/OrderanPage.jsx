/* eslint-disable */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Package, Plus, CheckCircle, Clock, AlertCircle, Zap,
  Eye, Trash2, Play, Search, MessageSquare, ShoppingCart, Filter, X,
  Copy, FileText
} from 'lucide-react';
import { PLATFORM_CONFIG, PRIORITY_CONFIG, STATUS_CONFIG } from '../../config'; // ✅ Unified import

/**
 * OrderanPage Component
 * 
 * Extracted from App.js monolith
 * Manages order display, creation, and management
 * 
 * @param {Object} props
 * @param {Object} props.currentTheme - Current theme configuration
 * @param {Object} props.ordersHook - useOrders hook return value
 * @param {Boolean} props.showAddForm - Form visibility state
 * @param {Function} props.setShowAddForm - Form visibility setter
 * @param {Number} props.expandedOrder - Expanded order ID
 * @param {Function} props.setExpandedOrder - Expanded order setter
 * @param {String} props.newNote - Note input value
 * @param {Function} props.setNewNote - Note input setter
 */
export const OrderanPage = React.memo(({
  currentTheme,
  ordersHook,
  showAddForm,
  setShowAddForm,
  expandedOrder,
  setExpandedOrder,
  newNote,
  setNewNote
}) => {
  const {
    orderForm,
    setOrderForm,
    orderFilter,
    setOrderFilter,
    orderSearch,
    setOrderSearch,
    orderPlatformFilter,
    setOrderPlatformFilter,
    filteredOrders,
    stats,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    addOrderNote
  } = ordersHook;

  // Process note modal state
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processNote, setProcessNote] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesModalOrder, setNotesModalOrder] = useState(null);
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [copiedUsername, setCopiedUsername] = useState(null);

  const handleOpenNotesModal = (order) => {
    setNotesModalOrder(order);
    setShowNotesModal(true);
    setCopiedNoteId(null);
  };

  const handleCopyNote = async (noteText, noteId) => {
    try {
      await navigator.clipboard.writeText(noteText);
      setCopiedNoteId(noteId);
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = noteText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedNoteId(noteId);
      setTimeout(() => setCopiedNoteId(null), 2000);
    }
  };

  // Helper functions
  const getPlatformBadge = (platform) => {
    return PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.wa;
  };

  const getPriorityBadge = (priority) => {
    return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  };

  const getStatusBadge = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  };

  const formatNoteText = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/^\s*🚀\s*MULAI\s+PROSES\s*:\s*/i, '')
      .replace(/^\s*MULAI\s+PROSES\s*:\s*/i, '')
      .trim();
  };

  const isOverdue = (order) => {
    if (order.status === 'completed' || !order.dueDate) return false;
    return new Date(order.dueDate) < new Date();
  };

  const handleStartProcess = (orderId) => {
    setProcessingOrderId(orderId);
    setProcessNote('');
    setShowProcessModal(true);
  };

  const handleConfirmProcess = () => {
    if (!processNote.trim()) {
      alert('⚠️ Catatan harus diisi sebelum memulai proses!');
      return;
    }
    updateOrderStatus(processingOrderId, 'process', processNote);
    setShowProcessModal(false);
    setProcessNote('');
    setProcessingOrderId(null);
  };

  const handleAddOrder = () => {
    const success = addOrder();
    if (success) {
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4 sm:p-6 mb-6`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`${currentTheme.accent} border-2 ${currentTheme.borderColor} p-2 sm:p-2.5 shadow-lg`}>
              <Package className="text-white" size={20} />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${currentTheme.text}`}>ORDERS MANAGEMENT</h1>
              <p className={`text-[10px] sm:text-xs ${currentTheme.subtext}`}>Lacak dan kelola pesanan pelanggan</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl ${currentTheme.accent} ${currentTheme.accentHover} text-white transition-all ${currentTheme.shadow} font-bold text-sm`}
          >
            <Plus size={18} />
            Tambah Order
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className={`${currentTheme.badge} rounded-xl p-4 border-2 ${currentTheme.borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <Package size={16} className={currentTheme.accentText} />
              <span className={`text-xs font-medium ${currentTheme.subtext}`}>Total</span>
            </div>
            <p className={`text-2xl font-bold ${currentTheme.text}`}>{stats.total}</p>
          </div>
          <div className={`${currentTheme.badge} rounded-xl p-4 border-2 border-white/10`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className={currentTheme.accentText} />
              <span className={`text-xs font-medium ${currentTheme.subtext}`}>Pending</span>
            </div>
            <p className={`text-2xl font-bold ${currentTheme.accentTextStrong}`}>{stats.pending}</p>
          </div>
          <div className={`${currentTheme.badge} rounded-xl p-4 border-2 ${currentTheme.borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className={currentTheme.accentText} />
              <span className={`text-xs font-medium ${currentTheme.subtext}`}>Diproses</span>
            </div>
            <p className={`text-2xl font-bold ${currentTheme.accentTextStrong}`}>{stats.process}</p>
          </div>
          <div className={`${currentTheme.badge} rounded-xl p-4 border-2 ${currentTheme.borderColor}`}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className={currentTheme.accentText} />
              <span className={`text-xs font-medium ${currentTheme.subtext}`}>Selesai</span>
            </div>
            <p className={`text-2xl font-bold ${currentTheme.accentTextStrong}`}>{stats.completed}</p>
          </div>
          {stats.overdue > 0 && (
            <div className={`${currentTheme.badge} rounded-xl p-4 border-2 ${currentTheme.borderColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className={currentTheme.accentText} />
                <span className={`text-xs font-medium ${currentTheme.subtext}`}>Terlambat</span>
              </div>
              <p className={`text-2xl font-bold ${currentTheme.accentTextStrong}`}>{stats.overdue}</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Order Form */}
      {showAddForm && (
        <div
          key="add-order-form"
          className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-6`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2 className={`text-lg font-bold ${currentTheme.text} mb-4`}>Tambah Order Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Username Buyer</label>
              <input
                type="text"
                value={orderForm.username}
                onChange={(e) => {
                  e.stopPropagation();
                  setOrderForm({ ...orderForm, username: e.target.value });
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Masukkan username buyer"
                autoComplete="off"
                className={`w-full px-4 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Platform</label>
              <select
                value={orderForm.platform}
                onChange={(e) => {
                  e.stopPropagation();
                  setOrderForm({ ...orderForm, platform: e.target.value });
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={`w-full px-4 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
              >
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Deskripsi</label>
              <textarea
                value={orderForm.description}
                onChange={(e) => {
                  e.stopPropagation();
                  setOrderForm({ ...orderForm, description: e.target.value });
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="Deskripsi orderan..."
                rows="3"
                autoComplete="off"
                className={`w-full px-4 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Quantity</label>
              <input
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={(e) => {
                  e.stopPropagation();
                  const val = e.target.value;
                  setOrderForm({ ...orderForm, quantity: val === '' ? '' : (parseInt(val) || '') });
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                placeholder="0"
                autoComplete="off"
                className={`w-full px-4 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Prioritas</label>
              <select
                value={orderForm.priority}
                onChange={(e) => {
                  e.stopPropagation();
                  setOrderForm({ ...orderForm, priority: e.target.value });
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={`w-full px-4 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Due Date (Opsional)</label>
              <input
                type="date"
                value={orderForm.dueDate}
                onChange={(e) => {
                  e.stopPropagation();
                  setOrderForm({ ...orderForm, dueDate: e.target.value });
                }}
                onFocus={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={`w-full px-4 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleAddOrder}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg ${currentTheme.accent} ${currentTheme.accentHover} text-white transition-all ${currentTheme.shadow} font-medium hover:scale-[1.01] active:scale-[0.99]`}
            >
              <CheckCircle size={16} />
              Simpan Order
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className={`px-5 py-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all font-medium hover:scale-[1.01] active:scale-[0.99]`}
            >
              Batal
            </button>
          </div>
        </div>
      )}
      {/* Filters & Search */}
      <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4 sm:p-6 mb-6 relative z-30`}>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${currentTheme.subtext}`} size={18} />
            <input
              type="text"
              placeholder="Cari order berdasarkan username atau deskripsi..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border-2 ${currentTheme.input} focus:outline-none focus:border-blue-500 transition-all text-sm`}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all whitespace-nowrap ${orderFilter !== 'all' || orderPlatformFilter !== 'all'
                ? `${currentTheme.accent} text-white border-transparent shadow-md`
                : `${currentTheme.badge} ${currentTheme.borderColor} border-opacity-30`
                }`}
            >
              <Filter size={18} />
              Filter
              {(orderFilter !== 'all' || orderPlatformFilter !== 'all') && (
                <span className="flex items-center justify-center w-5 h-5 bg-white text-blue-600 rounded-full text-[10px]">
                  {(orderFilter !== 'all' ? 1 : 0) + (orderPlatformFilter !== 'all' ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Filter Popup */}
            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-72 sm:w-80 bg-slate-950 border-2 border-slate-700 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl z-50 p-4 animate-in fade-in zoom-in duration-200`}>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                    <h3 className={`font-bold ${currentTheme.text}`}>Filter Orders</h3>
                    <button onClick={() => setIsFilterOpen(false)} className={currentTheme.subtext}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Status Filter */}
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${currentTheme.subtext} mb-2`}>Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'process', 'completed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setOrderFilter(status)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${orderFilter === status
                              ? `${currentTheme.accent} text-white border-transparent`
                              : `${currentTheme.badge} ${currentTheme.borderColor} border-opacity-30`
                              }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Platform Filter */}
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${currentTheme.subtext} mb-2`}>Platform</p>
                      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                        {['all', ...Object.keys(PLATFORM_CONFIG)].map((platform) => (
                          <button
                            key={platform}
                            onClick={() => setOrderPlatformFilter(platform)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${orderPlatformFilter === platform
                              ? `${currentTheme.accent} text-white border-transparent`
                              : `${currentTheme.badge} ${currentTheme.borderColor} border-opacity-30`
                              }`}
                          >
                            {platform === 'all' ? 'All Platforms' : PLATFORM_CONFIG[platform].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        setOrderFilter('all');
                        setOrderPlatformFilter('all');
                        setOrderSearch('');
                        setIsFilterOpen(false);
                      }}
                      className={`w-full py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all`}
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {filteredOrders.length === 0 ? (
          <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-12 text-center col-span-full`}>
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className={`text-lg font-medium ${currentTheme.subtext}`}>Belum ada orderan</p>
            <p className={`text-sm ${currentTheme.subtext} mt-2`}>Klik tombol "Tambah Order" untuk memulai</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const platform = getPlatformBadge(order.platform);
            const priority = getPriorityBadge(order.priority);
            const status = getStatusBadge(order.status);
            const overdue = isOverdue(order);
            const expanded = expandedOrder === order.id;
            const PlatformIcon = platform.icon === 'MessageSquare' ? MessageSquare : ShoppingCart;

            return (
              <div key={order.id} className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-5 transition-all ${expanded ? `ring-2 ${currentTheme.ringAccent}` : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${currentTheme.accent} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <PlatformIcon className="text-white" size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Username - paling atas, full width, no truncation */}
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-lg font-bold ${currentTheme.text} break-all`}>{order.username}</h3>
                      <button
                        type="button"
                        onClick={() => handleCopyNote(order.username, `user-${order.id}`).then(() => { setCopiedUsername(order.id); setTimeout(() => setCopiedUsername(null), 2000); })}
                        className={`p-1.5 rounded-lg flex-shrink-0 transition-all hover:scale-[1.05] active:scale-[0.95] ${copiedUsername === order.id
                          ? 'bg-green-500/20 text-green-400'
                          : `${currentTheme.badge} hover:bg-white/10 ${currentTheme.subtext}`
                          }`}
                        title="Copy username"
                      >
                        {copiedUsername === order.id ? <CheckCircle size={14} /> : <Copy size={14} />}
                      </button>
                    </div>

                    {/* Badges + action buttons */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priority.color}`}>
                          {priority.icon} {priority.label}
                        </span>
                        <span className={`px-2 py-1 rounded-lg ${currentTheme.accent} text-white text-xs font-medium`}>
                          {platform.label}
                        </span>
                        <span className={`px-3 py-1 rounded-lg border-2 ${status.color} text-xs font-medium`}>
                          {status.label}
                        </span>
                        {order.status === 'process' && (
                          <span className={`relative px-2 py-0.5 rounded-full text-xs font-medium ${currentTheme.accentSoftBg} ${currentTheme.accentTextStrong} border ${currentTheme.accentSoftBorder}`}>
                            🔔 Diproses
                            <span className={`absolute -top-1 -right-1 w-3 h-3 ${currentTheme.accentDot} rounded-full animate-ping`}></span>
                          </span>
                        )}
                        {overdue && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentTheme.accentSoftBg} ${currentTheme.accentTextStrong} border ${currentTheme.accentSoftBorder}`}>
                            ⚠️ Terlambat
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedOrder(expanded ? null : order.id)}
                          className={`p-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all hover:scale-[1.03] active:scale-[0.97]`}
                          title="Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteOrder(order.id)}
                          className={`p-2 rounded-lg ${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} ${currentTheme.primarySoftHover} transition-all border ${currentTheme.primarySoftBorder} hover:scale-[1.03] active:scale-[0.97]`}
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <p className={`text-base font-bold ${currentTheme.text} mb-3 line-clamp-2`}>{order.description}</p>
                    {order.quantity && (
                      <p className={`text-sm ${currentTheme.subtext} mb-2`}>
                        <span className="font-medium">Jumlah:</span> {order.quantity} item
                      </p>
                    )}

                    {/* Notes preview button */}
                    {order.notes && order.notes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenNotesModal(order)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${currentTheme.badge} hover:bg-white/10 transition-all text-xs font-medium border ${currentTheme.borderColor} mb-3 hover:scale-[1.01] active:scale-[0.99]`}
                      >
                        <FileText size={14} />
                        <span>Lihat Catatan ({order.notes.length})</span>
                      </button>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className={currentTheme.subtext}>
                        <Clock size={12} className="inline mr-1" />
                        Dibuat: {new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {order.dueDate && (
                        <span className={overdue ? `${currentTheme.accentTextStrong} font-medium` : currentTheme.subtext}>
                          <AlertCircle size={12} className="inline mr-1" />
                          Due: {new Date(order.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {order.completedAt && (
                        <span className={currentTheme.accentTextStrong}>
                          <CheckCircle size={12} className="inline mr-1" />
                          Selesai: {new Date(order.completedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {order.status !== 'completed' && (
                      <div className="flex gap-2 mt-3">
                        {order.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleStartProcess(order.id)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} ${currentTheme.primarySoftHover} transition-all text-xs font-medium border ${currentTheme.primarySoftBorder} hover:scale-[1.01] active:scale-[0.99]`}
                          >
                            <Play size={12} />
                            Mulai Proses
                          </button>
                        )}
                        {order.status === 'process' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${currentTheme.primary} text-white ${currentTheme.primaryHover} transition-all text-xs font-medium hover:scale-[1.01] active:scale-[0.99]`}
                            >
                              <CheckCircle size={12} />
                              Selesai
                            </button>
                            <button
                              type="button"
                              onClick={() => updateOrderStatus(order.id, 'pending')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all text-xs font-medium hover:scale-[1.01] active:scale-[0.99]`}
                            >
                              <Clock size={12} />
                              Pending
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {expanded && (
                      <div className={`mt-4 pt-4 border-t-2 ${currentTheme.borderColor} space-y-3`}>
                        <div>
                          <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Deskripsi Lengkap</h4>
                          <p className={`text-sm ${currentTheme.text} mb-4 whitespace-pre-wrap break-words`}>{order.description}</p>
                        </div>
                        <div>
                          <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Catatan</h4>
                          {order.notes && order.notes.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => handleOpenNotesModal(order)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentTheme.badge} hover:bg-white/10 transition-all text-sm font-medium border ${currentTheme.borderColor} mb-3 hover:scale-[1.01] active:scale-[0.99]`}
                            >
                              <FileText size={16} />
                              <span>📋 Lihat Catatan ({order.notes.length})</span>
                            </button>
                          ) : (
                            <p className={`text-sm ${currentTheme.subtext} mb-3`}>Belum ada catatan</p>
                          )}

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="Tambah catatan..."
                              className={`flex-1 px-3 py-2 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} text-sm focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder}`}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newNote.trim()) {
                                  addOrderNote(order.id, newNote);
                                  setNewNote('');
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newNote.trim()) {
                                  addOrderNote(order.id, newNote);
                                  setNewNote('');
                                }
                              }}
                              className={`px-4 py-2 rounded-lg ${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} ${currentTheme.primarySoftHover} transition-all text-sm font-medium border ${currentTheme.primarySoftBorder} hover:scale-[1.02] active:scale-[0.98]`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className={`text-sm font-bold ${currentTheme.text} mb-2`}>Timeline</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-xs">
                              <div className={`w-2 h-2 ${currentTheme.accentDot} rounded-full mt-1`}></div>
                              <div>
                                <p className={currentTheme.text}>Dibuat oleh {order.createdBy}</p>
                                <p className={currentTheme.subtext}>{new Date(order.createdAt).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 text-xs">
                              <div className={`w-2 h-2 ${currentTheme.accentDotMuted} rounded-full mt-1`}></div>
                              <div>
                                <p className={currentTheme.text}>Terakhir diupdate</p>
                                <p className={currentTheme.subtext}>{new Date(order.updatedAt).toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            {order.completedAt && (
                              <div className="flex items-start gap-2 text-xs">
                                <div className={`w-2 h-2 ${currentTheme.accentDotSoft} rounded-full mt-1`}></div>
                                <div>
                                  <p className={currentTheme.text}>Selesai</p>
                                  <p className={currentTheme.subtext}>{new Date(order.completedAt).toLocaleString('id-ID')}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )
        }
      </div >

      {/* Process Note Modal */}
      {
        showProcessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowProcessModal(false)}>
            <div
              className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} p-6 max-w-md w-full mx-4`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-xl font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}>
                <Play size={24} className={currentTheme.accentText} />
                Mulai Proses Order
              </h3>
              <p className={`text-sm ${currentTheme.subtext} mb-4`}>
                Masukkan catatan untuk memulai proses order ini:
              </p>
              <textarea
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
                placeholder="Contoh: Sudah konfirmasi dengan customer, mulai pengerjaan..."
                rows="4"
                autoFocus
                className={`w-full px-4 py-3 rounded-lg ${currentTheme.input} border-2 ${currentTheme.borderColor} focus:ring-2 ${currentTheme.focusRing} ${currentTheme.focusBorder} mb-4`}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmProcess}
                  className={`flex-1 px-4 py-2.5 rounded-lg ${currentTheme.primary} text-white ${currentTheme.primaryHover} transition-all font-medium`}
                >
                  Mulai Proses
                </button>
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all font-medium`}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Notes Preview Modal */}
      {showNotesModal && notesModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setShowNotesModal(false)}>
          <div
            className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-6 max-w-lg w-full max-h-[80vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${currentTheme.text} flex items-center gap-2`}>
                <FileText size={20} className={currentTheme.accentText} />
                Catatan — {notesModalOrder.username}
              </h3>
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className={`p-2 rounded-lg ${currentTheme.badge} hover:bg-white/10 transition-all`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {notesModalOrder.notes && notesModalOrder.notes.length > 0 ? (
                notesModalOrder.notes.map(note => (
                  <div key={note.id} className={`${currentTheme.badge} rounded-xl p-4 border ${currentTheme.borderColor}`}>
                    <p className={`text-sm ${currentTheme.text} whitespace-pre-wrap break-words mb-2`}>{formatNoteText(note.text)}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${currentTheme.subtext}`}>
                        {note.createdBy} • {new Date(note.createdAt).toLocaleString('id-ID')}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyNote(note.text, note.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${copiedNoteId === note.id
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : `${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} border ${currentTheme.primarySoftBorder} ${currentTheme.primarySoftHover}`
                          }`}
                      >
                        {copiedNoteId === note.id ? (
                          <><CheckCircle size={12} /> Copied!</>
                        ) : (
                          <><Copy size={12} /> Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className={`text-sm ${currentTheme.subtext} text-center py-4`}>Belum ada catatan</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div >
  );
});

OrderanPage.displayName = 'OrderanPage';

export default OrderanPage;

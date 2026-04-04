/* eslint-disable */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Package, Plus, CheckCircle, Clock, AlertCircle, Zap,
  Eye, Trash2, Play, Search, MessageSquare, ShoppingCart, Filter, X,
  Copy, FileText, ChevronDown, ChevronUp, Archive
} from 'lucide-react';
import { PLATFORM_CONFIG, STATUS_CONFIG } from '../../config';

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
    orderForm, setOrderForm, orderFilter, setOrderFilter,
    orderSearch, setOrderSearch, orderPlatformFilter, setOrderPlatformFilter,
    filteredOrders, stats, addOrder, updateOrderStatus, deleteOrder, addOrderNote
  } = ordersHook;

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processNote, setProcessNote] = useState('');
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesModalOrder, setNotesModalOrder] = useState(null);
  const [copiedNoteId, setCopiedNoteId] = useState(null);
  const [copiedUsername, setCopiedUsername] = useState(null);

  const handleOpenNotesModal = (order) => { setNotesModalOrder(order); setShowNotesModal(true); setCopiedNoteId(null); };
  const handleCopyNote = async (noteText, noteId) => {
    try { await navigator.clipboard.writeText(noteText); } catch (err) {
      const ta = document.createElement('textarea'); ta.value = noteText; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopiedNoteId(noteId); setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const getPlatformBadge = (platform) => PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.wa;
  const getStatusBadge = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const formatNoteText = (text) => text ? String(text).replace(/^\s*🚀\s*MULAI\s+PROSES\s*:\s*/i, '').replace(/^\s*MULAI\s+PROSES\s*:\s*/i, '').trim() : '';

  const handleStartProcess = (orderId) => { setProcessingOrderId(orderId); setProcessNote(''); setShowProcessModal(true); };
  const handleConfirmProcess = () => {
    if (!processNote.trim()) { alert('⚠️ Catatan harus diisi!'); return; }
    updateOrderStatus(processingOrderId, 'process', processNote);
    setShowProcessModal(false); setProcessNote(''); setProcessingOrderId(null);
  };
  const handleAddOrder = async () => {
    if (await addOrder()) {
      setTimeout(() => document.getElementById('input-username-order')?.focus(), 50);
    }
  };

  // Status dot colors
  const statusDot = { pending: 'bg-amber-400', process: 'bg-emerald-400', completed: 'bg-slate-500' };
  const statusText = { pending: 'text-amber-400', process: 'text-emerald-400', completed: 'text-slate-500' };
  const priorityDot = { urgent: 'bg-red-400', high: 'bg-amber-400', medium: 'bg-blue-400', low: 'bg-slate-400' };

  return (
    <div className="space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white/90">Orders Management</h1>
          <p className="text-xs text-slate-400 mt-1">Lacak dan kelola pesanan</p>
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 transition-all text-xs font-medium">
          <Plus size={14} /> Tambah Order
        </button>
      </div>

      {/* ===== STATS ROW ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Package, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'Selesai', value: stats.process, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Tutup', value: stats.completed, icon: Archive, color: 'text-slate-500' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={14} className={s.color} />
              <span className="text-[11px] text-slate-400">{s.label}</span>
            </div>
            <p className="text-2xl font-semibold text-white/90">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input type="text" placeholder="Cari order..." value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30"
          />
        </div>
        <div className="relative">
          <button onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
              orderFilter !== 'all' || orderPlatformFilter !== 'all'
                ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200'}`}>
            <Filter size={14} /> Filter
            {(orderFilter !== 'all' || orderPlatformFilter !== 'all') && (
              <span className="w-4 h-4 rounded-full bg-blue-500/30 text-blue-300 text-[9px] flex items-center justify-center">
                {(orderFilter !== 'all' ? 1 : 0) + (orderPlatformFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>

          {isFilterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl z-50 p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                  <h3 className="text-xs font-medium text-white/80">Filter Orders</h3>
                  <button onClick={() => setIsFilterOpen(false)} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'pending', 'process', 'completed'].map(s => (
                        <button key={s} onClick={() => setOrderFilter(s)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${orderFilter === s
                            ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                            : 'text-slate-400 hover:bg-white/[0.04]'}`}>
                          {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Platform</p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {['all', ...Object.keys(PLATFORM_CONFIG)].map(p => (
                        <button key={p} onClick={() => setOrderPlatformFilter(p)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${orderPlatformFilter === p
                            ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                            : 'text-slate-400 hover:bg-white/[0.04]'}`}>
                          {p === 'all' ? 'Semua' : PLATFORM_CONFIG[p].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => { setOrderFilter('all'); setOrderPlatformFilter('all'); setOrderSearch(''); setIsFilterOpen(false); }}
                    className="w-full py-1.5 rounded-lg bg-red-500/8 text-red-400/80 text-[11px] font-medium hover:bg-red-500/15 transition-all">
                    Reset Filters
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== ADD ORDER FORM ===== */}
      {showAddForm && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
          <h2 className="text-sm font-semibold text-white/90 mb-4">Tambah Order Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Username Buyer</label>
              <input id="input-username-order" type="text" value={orderForm.username} onChange={e => { e.stopPropagation(); setOrderForm({ ...orderForm, username: e.target.value }); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddOrder(); }}
                onFocus={e => e.stopPropagation()} onClick={e => e.stopPropagation()} placeholder="Username" autoComplete="off"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Platform</label>
              <select value={orderForm.platform} onChange={e => { e.stopPropagation(); setOrderForm({ ...orderForm, platform: e.target.value }); }}
                onFocus={e => e.stopPropagation()} onClick={e => e.stopPropagation()}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 focus:outline-none focus:border-blue-500/30">
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (<option key={key} value={key} className="bg-slate-900 text-slate-200">{config.label}</option>))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Nama Product</label>
              <input type="text" value={orderForm.productName} onChange={e => { e.stopPropagation(); setOrderForm({ ...orderForm, productName: e.target.value }); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddOrder(); }}
                onFocus={e => e.stopPropagation()} onClick={e => e.stopPropagation()} placeholder="Nama Produk" autoComplete="off"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">Catatan</label>
              <textarea value={orderForm.description} onChange={e => { e.stopPropagation(); setOrderForm({ ...orderForm, description: e.target.value }); }}
                onFocus={e => e.stopPropagation()} onClick={e => e.stopPropagation()} placeholder="Catatan orderan..." rows="2" autoComplete="off"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Quantity</label>
              <input type="number" min="1" value={orderForm.quantity} onChange={e => { e.stopPropagation(); setOrderForm({ ...orderForm, quantity: e.target.value === '' ? '' : (parseInt(e.target.value) || '') }); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddOrder(); }}
                onFocus={e => e.stopPropagation()} onClick={e => e.stopPropagation()} placeholder="0" autoComplete="off"
                className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30" />
            </div>

          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={handleAddOrder}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 text-xs font-medium transition-all">
              <CheckCircle size={13} /> Simpan
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/[0.04] transition-all">Batal</button>
          </div>
        </div>
      )}

      {/* ===== ORDERS LIST ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-12 text-center col-span-full">
            <Package size={40} className="mx-auto text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">Belum ada orderan</p>
            <p className="text-xs text-slate-500 mt-1">Klik "Tambah Order" untuk memulai</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const platform = getPlatformBadge(order.platform);
            const status = getStatusBadge(order.status);
            const expanded = expandedOrder === order.id;
            const PlatformIcon = platform.icon === 'MessageSquare' ? MessageSquare : ShoppingCart;

            return (
              <div key={order.id} className={`bg-slate-900/40 backdrop-blur-sm rounded-xl border transition-all ${expanded ? 'border-blue-500/20 ring-1 ring-blue-500/10' : 'border-white/[0.06]'}`}>
                <div className="p-4">
                  {/* Top: platform icon + username */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
                      <PlatformIcon size={16} className="text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-white/90 break-all">{order.username}</h3>
                        <button type="button" onClick={() => handleCopyNote(order.username, `user-${order.id}`).then(() => { setCopiedUsername(order.id); setTimeout(() => setCopiedUsername(null), 2000); })}
                          className={`p-1 rounded transition-all flex-shrink-0 ${copiedUsername === order.id ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-300'}`}>
                          {copiedUsername === order.id ? <CheckCircle size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                      {order.productName && <p className="text-xs font-medium text-blue-300 mt-1">{order.productName}</p>}
                      <div className="mt-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">📝 {order.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusText[order.status] || 'text-slate-400'} bg-white/[0.04]`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot[order.status] || 'bg-slate-400'}`}></span>
                      {status.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300`}>{platform.label}</span>
                    {order.quantity && <span className="text-[10px] text-slate-500">{order.quantity} item</span>}
                  </div>

                  {/* Date info */}
                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 mb-3">
                    <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {order.status === 'pending' && (
                        <button type="button" onClick={() => handleStartProcess(order.id)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 font-medium">
                          <Play size={10} /> Proses
                        </button>
                      )}
                      {order.status === 'process' && (
                        <>
                          <button type="button" onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-slate-500/15 text-slate-300 hover:bg-slate-500/20 font-medium">
                            <Archive size={10} /> Tutup
                          </button>
                          <button type="button" onClick={() => updateOrderStatus(order.id, 'pending')}
                            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] font-medium">
                            <Clock size={10} /> Pending
                          </button>
                        </>
                      )}
                      {order.notes && order.notes.length > 0 && (
                        <button type="button" onClick={() => handleOpenNotesModal(order)}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-slate-400 hover:bg-white/[0.06]">
                          <FileText size={10} /> {order.notes.length}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => setExpandedOrder(expanded ? null : order.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all">
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button type="button" onClick={() => deleteOrder(order.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/[0.04] transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3">
                    {order.productName && (
                      <div>
                        <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Nama Product</h4>
                        <p className="text-xs text-slate-200 font-medium">{order.productName}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Catatan Order</h4>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap break-words">{order.description}</p>
                    </div>
                    <div>
                      <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Riwayat Catatan</h4>
                      {order.notes && order.notes.length > 0 ? (
                        <button type="button" onClick={() => handleOpenNotesModal(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-slate-300 hover:bg-white/[0.05] transition-all">
                          <FileText size={12} /> Lihat {order.notes.length} catatan
                        </button>
                      ) : (
                        <p className="text-xs text-slate-500">Belum ada</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Tambah catatan..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30"
                          onKeyPress={e => { if (e.key === 'Enter' && newNote.trim()) { addOrderNote(order.id, newNote); setNewNote(''); } }} />
                        <button type="button" onClick={() => { if (newNote.trim()) { addOrderNote(order.id, newNote); setNewNote(''); } }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 transition-all">
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Timeline</h4>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span className="text-slate-400">Dibuat oleh {order.createdBy} · {new Date(order.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          <span className="text-slate-400">Update · {new Date(order.updatedAt).toLocaleString('id-ID')}</span>
                        </div>
                        {order.completedAt && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span className="text-emerald-400/70">Selesai · {new Date(order.completedAt).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ===== PROCESS MODAL ===== */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowProcessModal(false)}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-5 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-white/90 mb-1 flex items-center gap-2"><Play size={16} className="text-emerald-400" /> Mulai Proses</h3>
            <p className="text-[11px] text-slate-400 mb-3">Masukkan catatan proses:</p>
            <textarea value={processNote} onChange={e => setProcessNote(e.target.value)} placeholder="Contoh: Sudah konfirmasi, mulai dicetak..."
              rows="3" autoFocus className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30 mb-3" />
            <div className="flex gap-2">
              <button type="button" onClick={handleConfirmProcess}
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 text-xs font-medium">Proses</button>
              <button type="button" onClick={() => setShowProcessModal(false)}
                className="flex-1 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/[0.04]">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== NOTES MODAL ===== */}
      {showNotesModal && notesModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNotesModal(false)}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-5 max-w-lg w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2"><FileText size={14} className="text-blue-300" /> Catatan — {notesModalOrder.username}</h3>
              <button type="button" onClick={() => setShowNotesModal(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"><X size={14} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
              {notesModalOrder.notes && notesModalOrder.notes.length > 0 ? (
                notesModalOrder.notes.map(note => (
                  <div key={note.id} className="bg-white/[0.02] rounded-lg p-3 hover:bg-white/[0.04] transition-all">
                    <p className="text-xs text-slate-200 whitespace-pre-wrap break-words mb-1.5">{formatNoteText(note.text)}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-500">{note.createdBy} · {new Date(note.createdAt).toLocaleString('id-ID')}</p>
                      <button type="button" onClick={() => handleCopyNote(note.text, note.id)}
                        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition-all ${copiedNoteId === note.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>
                        {copiedNoteId === note.id ? <><CheckCircle size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada catatan</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

OrderanPage.displayName = 'OrderanPage';
export default OrderanPage;

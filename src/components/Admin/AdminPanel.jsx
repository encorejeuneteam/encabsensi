import React from 'react';
import {
  Shield, Users, Calendar, CheckCircle, BarChart3, LogOut,
  Save, Edit, Trash2, Plus, X, Settings, Upload, Sparkles
} from 'lucide-react';

export const AdminPanel = React.memo(({
  currentTheme, handleAdminLogout, adminTab, setAdminTab,
  employees, editingEmployee, setEditingEmployee,
  handleSaveEmployee, handleEditEmployee, handleAddEmployee,
  handleDeleteEmployee, handleDeleteTask, handleResetEmployee,
  currentMonth, currentYear, monthNames, yearlyAttendance, statusConfig,
  handleEditCalendar, calculateMonthlyStats,
  exportData, importData, setShowClearModal, handleFixOvertimeData
}) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newEmpName, setNewEmpName] = React.useState('');
  const [newEmpId, setNewEmpId] = React.useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white/90">Admin Panel</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola semua data sistem</p>
        </div>
        <button onClick={handleAdminLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/15 text-xs font-medium transition-all">
          <LogOut size={13} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5">
        {[
          { id: 'employees', label: 'Karyawan', icon: Users },
          { id: 'calendar', label: 'Kalender', icon: Calendar },
          { id: 'tasks', label: 'Tasks', icon: CheckCircle },
          { id: 'attendance', label: 'Kehadiran', icon: BarChart3 }
        ].map(tab => (
          <button key={tab.id} onClick={() => setAdminTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${adminTab === tab.id
              ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ===== EMPLOYEES TAB ===== */}
      {adminTab === 'employees' && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2"><Users size={14} className="text-blue-300" /> Manajemen Karyawan</h3>
            <button onClick={() => {
              if (showAddForm) { setShowAddForm(false); setNewEmpName(''); setNewEmpId(''); }
              else { const nextId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1; setNewEmpId(nextId.toString()); setShowAddForm(true); }
            }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 text-[11px] font-medium transition-all">
              {showAddForm ? <X size={12} /> : <Plus size={12} />} {showAddForm ? 'Batal' : 'Tambah'}
            </button>
          </div>

          {showAddForm && (
            <div className="mb-4 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <h4 className="text-xs font-medium text-white/80 mb-3">Tambah Karyawan Baru</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Nama</label>
                  <input type="text" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} placeholder="Nama karyawan"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 focus:outline-none focus:border-blue-500/30" />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">ID</label>
                  <input type="number" value={newEmpId} onChange={e => setNewEmpId(e.target.value)} placeholder="ID"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 focus:outline-none focus:border-blue-500/30" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowAddForm(false); setNewEmpName(''); setNewEmpId(''); }}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-white/[0.04]">Batal</button>
                <button onClick={async () => {
                  if (!newEmpName.trim() || !newEmpId.trim()) { alert('Harap isi Nama dan ID!'); return; }
                  const success = await handleAddEmployee(newEmpName, newEmpId);
                  if (success) { setShowAddForm(false); setNewEmpName(''); setNewEmpId(''); }
                }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/20">
                  <Save size={12} /> Simpan
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                {editingEmployee && editingEmployee.id === emp.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Nama</label>
                        <input type="text" value={editingEmployee.name} onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 focus:outline-none focus:border-blue-500/30" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">ID</label>
                        <input type="number" value={editingEmployee.id} onChange={e => setEditingEmployee({ ...editingEmployee, id: parseInt(e.target.value) })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 focus:outline-none focus:border-blue-500/30" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEmployee} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-xs font-medium"><Save size={12} /> Simpan</button>
                      <button onClick={() => setEditingEmployee(null)} className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-white/[0.04]">Batal</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white/90">{emp.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        ID: {emp.id} · {emp.checkedIn ? '✅ In' : '⭕ Out'} · Shift: {emp.shift || '-'} · 💼 {emp.workTasks.length}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditEmployee(emp)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-medium"><Edit size={11} /> Edit</button>
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-medium"><Trash2 size={11} /> Hapus</button>
                    </div>
                  </div>
                )}

                {(!editingEmployee || editingEmployee.id !== emp.id) && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <h5 className="text-[11px] text-slate-400 mb-1.5">💼 Tasks ({emp.workTasks.length})</h5>
                    <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                      {emp.workTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between bg-white/[0.02] rounded px-2 py-1.5 text-[10px]">
                          <span className={`text-slate-300 ${task.completed ? 'line-through opacity-50' : ''}`}>{task.task}</span>
                          <button onClick={() => handleDeleteTask(emp.id, 'work', task.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={11} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CALENDAR TAB ===== */}
      {adminTab === 'calendar' && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4"><Calendar size={14} className="text-blue-300" /> Edit Kalender</h3>
          <div className="space-y-5">
            {employees.map(emp => {
              const days = new Date(currentYear, currentMonth + 1, 0).getDate();
              const first = new Date(currentYear, currentMonth, 1).getDay();
              return (
                <div key={emp.id} className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                  <h4 className="text-xs font-semibold text-white/90 mb-3">{emp.name} — {monthNames[currentMonth]} {currentYear}</h4>
                  <div className="mb-3">
                    <div className="grid grid-cols-7 gap-1">
                      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                        <div key={i} className="text-center text-[8px] text-slate-600 py-0.5">{d}</div>
                      ))}
                      {[...Array(first)].map((_, i) => <div key={`empty-${i}`} className="h-7"></div>)}
                      {[...Array(days)].map((_, i) => {
                        const day = i + 1;
                        const data = yearlyAttendance[emp.name]?.[currentMonth]?.[day];
                        const hasData = data && data.status && data.status !== 'belum';
                        const hasOvertime = data && data.status === 'lembur';
                        const baseStatus = hasOvertime && data.overtimeBaseStatus ? data.overtimeBaseStatus : data?.status;
                        return (
                          <div key={day} className="h-7">
                            {hasData ? (
                              hasOvertime ? (
                                <button onClick={() => handleEditCalendar(emp.name, currentMonth, day, currentYear)}
                                  className="w-full h-full rounded text-center text-white text-[9px] font-medium hover:scale-110 transition-transform cursor-pointer overflow-hidden relative flex items-center justify-center"
                                  title={`${day}: ${baseStatus === 'telat' ? 'Telat' : 'Hadir'} + Lembur`}>
                                  <div className={`absolute inset-0 ${statusConfig[baseStatus]?.bg || 'bg-blue-600'}`} style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}></div>
                                  <div className={`absolute inset-0 ${statusConfig?.lembur?.bg || 'bg-emerald-600'}`} style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                                  <span className="relative z-10">{day}</span>
                                </button>
                              ) : (
                                <button onClick={() => handleEditCalendar(emp.name, currentMonth, day, currentYear)}
                                  className={`w-full h-full ${statusConfig?.[data.status]?.bg || 'bg-blue-600'} rounded text-center text-white text-[9px] font-medium hover:scale-110 transition-transform cursor-pointer flex items-center justify-center`}
                                  title={`${day}: ${statusConfig?.[data.status]?.label || data.status}`}>
                                  {day}
                                </button>
                              )
                            ) : (
                              <button onClick={() => handleEditCalendar(emp.name, currentMonth, day, currentYear)}
                                className="w-full h-full bg-white/[0.02] rounded text-center text-[9px] text-slate-600 border border-dashed border-white/[0.04] hover:scale-110 transition-transform cursor-pointer flex items-center justify-center">
                                {day}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TASKS TAB ===== */}
      {adminTab === 'tasks' && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4"><CheckCircle size={14} className="text-blue-300" /> Manajemen Tasks</h3>
          <div className="space-y-4">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-white/90">{emp.name}</h4>
                  <button onClick={() => handleResetEmployee(emp.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/8 text-red-400/80 text-[10px] font-medium hover:bg-red-500/15">
                    <Trash2 size={10} /> Reset
                  </button>
                </div>
                <div>
                  <h5 className="text-[11px] text-slate-400 mb-1.5">💼 Tasks ({emp.workTasks.length})</h5>
                  <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                    {emp.workTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between bg-white/[0.02] rounded px-2 py-1.5 text-[10px]">
                        <div className="flex-1">
                          <p className={`text-slate-300 ${task.completed ? 'line-through opacity-50' : ''}`}>{task.task}</p>
                          {task.completed && task.duration && <p className="text-[9px] text-emerald-400/60">✓ {task.duration}</p>}
                        </div>
                        <button onClick={() => handleDeleteTask(emp.id, 'work', task.id)} className="text-slate-600 hover:text-red-400 ml-2"><Trash2 size={11} /></button>
                      </div>
                    ))}
                    {emp.workTasks.length === 0 && <p className="text-[10px] text-slate-500 text-center py-3">Tidak ada task</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ATTENDANCE TAB ===== */}
      {adminTab === 'attendance' && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4"><BarChart3 size={14} className="text-blue-300" /> Data Kehadiran</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {employees.map(emp => {
              const ms = calculateMonthlyStats(emp.name, currentMonth);
              return (
                <div key={emp.id} className="bg-white/[0.02] rounded-lg border border-white/[0.06] p-4">
                  <h4 className="text-sm font-semibold text-white/90 mb-3">{emp.name}</h4>
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { l: 'Hadir', v: ms.hadir, c: 'text-emerald-400' },
                      { l: 'Telat', v: `${ms.telat} (${ms.totalLateHours}h)`, c: 'text-amber-400' },
                      { l: 'Lembur', v: ms.lembur, c: 'text-blue-400' },
                      { l: 'Libur', v: ms.libur, c: 'text-slate-400' }
                    ].map(r => (
                      <div key={r.l} className="flex justify-between">
                        <span className="text-slate-400">{r.l}</span>
                        <span className={`font-medium ${r.c}`}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SYSTEM ACTIONS ===== */}
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-5">
        <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-4"><Settings size={14} className="text-blue-300" /> Aksi Sistem</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={exportData}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 text-xs font-medium transition-all">
            <Upload size={14} /> Export
          </button>
          <label className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 text-xs font-medium cursor-pointer transition-all">
            <Upload size={14} /> Import
            <input type="file" accept=".json" className="hidden" onChange={importData} />
          </label>
          <button onClick={handleFixOvertimeData}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 text-xs font-medium transition-all">
            <Sparkles size={14} /> Fix Overtime
          </button>
          <button onClick={() => setShowClearModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-500/8 text-red-400/80 hover:bg-red-500/15 text-xs font-medium transition-all">
            <Trash2 size={14} /> Clear Data
          </button>
        </div>
      </div>
    </div>
  );
});

AdminPanel.displayName = 'AdminPanel';
export default AdminPanel;

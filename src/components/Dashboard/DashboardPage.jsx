/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Calendar, Users, Sun, Moon, TrendingUp, CheckCircle, Clock,
  AlertCircle, Zap, GripVertical, Trash2, Play, Square,
  Pause, Coffee, Plus, Bell, ChevronDown, ChevronUp, LogOut
} from 'lucide-react';

export const DashboardPage = React.memo(({
  employees,
  currentTheme,
  AttentionSection,
  selectedEmployee,
  setSelectedEmployee,
  newTask,
  setNewTask,
  showCompletedTasks,
  isProcessing,
  statusConfig,
  priorityColors,
  detectShift,
  updateLateHours,
  startBreak,
  endBreak,
  startIzin,
  endIzin,
  endShift,
  pauseAllTasks,
  resumeAllTasks,
  handleDragStart,
  handleDragOver,
  handleDrop,
  calculateElapsedTime,
  deleteTask,
  updateProgress,
  updatePriority,
  startTask,
  pauseTask,
  resumeTask,
  taskBreak,
  resumeFromTaskBreak,
  endTask,
  addTask
}) => {
  const dashboardContent = useMemo(() => {
    const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentShift = detectShift();
    const checkedInCount = employees.filter(e => e.checkedIn).length;

    const destaUser = employees.find(e => e.isAdmin);
    const filteredEmployees = selectedEmployee === 'all'
      ? (destaUser ? employees : employees.filter(e => e.checkedIn))
      : employees.filter(emp => emp.name === selectedEmployee);

    // Priority dot colors
    const priorityDot = {
      urgent: 'bg-red-400',
      high: 'bg-amber-400',
      normal: 'bg-blue-400',
      low: 'bg-slate-400'
    };

    // Task status helper
    const getTaskStatus = (task) => {
      if (task.completed) return { label: 'Done', color: 'text-emerald-400' };
      if (task.onTaskBreak) return { label: 'Break', color: 'text-amber-400' };
      if (task.paused) return { label: 'Paused', color: 'text-amber-400' };
      if (task.startTime && !task.endTime) return { label: 'In Progress', color: 'text-blue-400' };
      return { label: 'Queued', color: 'text-slate-500' };
    };

    return (
      <div className="space-y-6">
        {AttentionSection}

        {/* ===== COMPACT HEADER ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white/90">Absensi EncoreJeune</h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {date}
              </span>
              <span className="flex items-center gap-1.5">
                {currentShift === 'pagi' ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-blue-300" />}
                {currentShift === 'pagi' ? 'Shift Pagi' : 'Shift Malam'}
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={12} />
                {checkedInCount}/{employees.length} check-in
              </span>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setSelectedEmployee('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedEmployee === 'all'
                ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
            >
              Semua
            </button>
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployee(emp.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedEmployee === emp.name
                  ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
              >
                {emp.name}
              </button>
            ))}
          </div>
        </div>

        {/* ===== 3-COLUMN EMPLOYEE BOARD ===== */}
        <div className={`grid gap-5 ${filteredEmployees.length === 1 ? 'grid-cols-1 max-w-lg' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
          {filteredEmployees.map(emp => {
            const tasks = emp.workTasks || [];
            const filtered = tasks.filter(t => showCompletedTasks || !t.completed);
            const hasRunning = tasks.some(t => t.startTime && !t.completed && !t.paused);
            const hasPaused = tasks.some(t => t.paused && !t.completed);
            const completedCount = tasks.filter(t => t.completed).length;
            const activeCount = tasks.filter(t => !t.completed).length;

            return (
              <div key={emp.id} className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] flex flex-col">

                {/* ===== EMPLOYEE HEADER ===== */}
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300">
                        {emp.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-white/90">{emp.name}</h2>
                          {emp.isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-medium">Admin</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {emp.shift && (
                            <span className="text-[10px] text-slate-400">
                              {emp.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}
                            </span>
                          )}
                          {emp.checkedIn && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Online
                            </span>
                          )}
                          {(emp.overtime && emp.checkedIn) && (
                            <span className="text-[10px] text-amber-400 font-medium">⚡ Lembur</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    {emp.status && emp.status !== 'belum' && (
                      <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                        (!emp.checkedIn && ['hadir', 'lembur', 'telat'].includes(emp.status)) ? 'bg-slate-500/20 text-slate-400' :
                        emp.status === 'hadir' ? 'bg-emerald-500/10 text-emerald-400' :
                        emp.status === 'telat' ? 'bg-amber-500/10 text-amber-400' :
                        emp.status === 'lembur' ? 'bg-purple-500/10 text-purple-400' :
                        emp.status === 'izin' ? 'bg-blue-500/10 text-blue-400' :
                        emp.status === 'libur' ? 'bg-slate-500/10 text-slate-400' :
                        emp.status === 'sakit' ? 'bg-red-500/10 text-red-400' :
                        emp.status === 'alpha' ? 'bg-red-500/10 text-red-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {(!emp.checkedIn && ['hadir', 'lembur', 'telat'].includes(emp.status))
                          ? 'Selesai Shift'
                          : (statusConfig?.[emp.status]?.label || emp.status)}
                      </span>
                    )}
                  </div>

                  {/* Late hours input */}
                  {emp.status === 'telat' && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-400 bg-amber-500/5 rounded-lg px-3 py-1.5">
                      <AlertCircle size={12} />
                      <span>Terlambat</span>
                      <input type="number" min="0" max="12" value={emp.lateHours}
                        onChange={(e) => updateLateHours(emp.id, parseInt(e.target.value) || 0)}
                        className="w-12 px-1.5 py-0.5 rounded bg-slate-800/60 border border-white/10 text-[11px] text-center text-white focus:outline-none focus:border-amber-500/40"
                      />
                      <span>jam</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  {emp.checkedIn && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {/* Pause/Resume All */}
                      {hasPaused ? (
                        <button onClick={() => resumeAllTasks(emp.id)} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 transition-all disabled:opacity-40">
                          <Play size={12} /> Resume All
                        </button>
                      ) : (
                        <button onClick={() => pauseAllTasks(emp.id)} disabled={isProcessing || !hasRunning}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 transition-all disabled:opacity-40">
                          <Pause size={12} /> Pause All
                        </button>
                      )}

                      {/* Break */}
                      {!emp.breakTime && !emp.hasBreakToday ? (
                        <button onClick={() => startBreak(emp.id)} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-slate-300 hover:bg-white/[0.06] transition-all disabled:opacity-40">
                          <Coffee size={12} /> Break
                        </button>
                      ) : emp.breakTime ? (
                        <button onClick={() => endBreak(emp.id)} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 transition-all disabled:opacity-40">
                          <CheckCircle size={12} /> End Break
                        </button>
                      ) : null}

                      {/* Izin */}
                      {!emp.izinTime ? (
                        <button onClick={() => startIzin(emp.id)} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-slate-300 hover:bg-white/[0.06] transition-all disabled:opacity-40">
                          <Bell size={12} /> Izin
                        </button>
                      ) : (
                        <button onClick={() => endIzin(emp.id)} disabled={isProcessing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 transition-all disabled:opacity-40">
                          <CheckCircle size={12} /> End Izin
                        </button>
                      )}

                      {/* End Shift */}
                      <button onClick={() => endShift(emp.id)} disabled={isProcessing}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-red-500/8 text-red-400/80 hover:bg-red-500/15 transition-all disabled:opacity-40 ml-auto">
                        <LogOut size={12} /> End Shift
                      </button>
                    </div>
                  )}

                  {/* Active timer display */}
                  {(emp.breakTime || emp.izinTime) && (
                    <div className="mt-2 text-[11px] text-center py-1.5 rounded-lg bg-white/[0.02] text-slate-400">
                      {emp.breakTime && <span>☕ Istirahat sejak {emp.breakTime}</span>}
                      {emp.izinTime && <span>🔔 Izin: {emp.izinReason} (sejak {emp.izinTime})</span>}
                    </div>
                  )}
                </div>

                {/* ===== TASK LIST ===== */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[500px] scrollbar-thin">
                  {filtered.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Belum ada task
                    </div>
                  )}

                  {filtered.map(task => {
                    const status = getTaskStatus(task);
                    return (
                      <div
                        key={task.id}
                        className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-lg p-3 transition-all cursor-move border border-transparent hover:border-white/[0.06]"
                        draggable
                        onDragStart={(e) => handleDragStart(e, emp.id, 'work', task.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, emp.id, 'work', task.id)}
                      >
                        {/* Task top row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <GripVertical size={12} className="text-slate-600 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority] || priorityDot.normal}`}></div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium break-words ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {task.task}
                              </p>
                              {/* Running timer */}
                              {task.startTime && !task.endTime && !task.paused && !task.isPaused && (
                                <p className="text-[10px] text-blue-400 mt-0.5 font-mono">
                                  ⏱ {calculateElapsedTime(task.startTime)}
                                </p>
                              )}
                              {task.paused && (
                                <p className="text-[10px] text-amber-400 mt-0.5">
                                  ⏸ {task.pauseHistory?.[task.pauseHistory.length - 1]?.reason || 'Paused'}
                                </p>
                              )}
                              {task.isPaused && (
                                <p className="text-[10px] text-amber-400 mt-0.5">☕ Break</p>
                              )}
                              {task.duration && (
                                <p className="text-[10px] text-slate-500 mt-0.5">{task.startTime} → {task.endTime} ({task.duration})</p>
                              )}
                            </div>
                          </div>

                          {/* Right side: status + delete */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-medium ${status.color}`}>{status.label}</span>
                            <button onClick={() => deleteTask(emp.id, 'work', task.id)}
                              className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-0.5">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar (compact) */}
                        {!task.completed && task.startTime && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                              <div className="h-full bg-blue-500/40 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span className="text-[9px] text-slate-500 w-7 text-right">{task.progress}%</span>
                          </div>
                        )}

                        {/* Task action buttons (compact, show on hover or always for active) */}
                        <div className={`mt-2 flex flex-wrap gap-1 ${task.completed ? 'hidden' : ''}`}>
                          {/* Priority select */}
                          <select value={task.priority} onChange={(e) => updatePriority(emp.id, 'work', task.id, e.target.value)}
                            className="text-[10px] px-1.5 py-1 rounded bg-slate-800/60 border border-white/[0.06] text-slate-300 focus:outline-none">
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="normal">Normal</option>
                            <option value="low">Low</option>
                          </select>

                          {/* Progress slider */}
                          <input type="range" min="0" max="100" value={task.progress}
                            onChange={(e) => updateProgress(emp.id, 'work', task.id, e.target.value)}
                            className="w-16 h-1 mt-2 rounded-lg appearance-none bg-white/[0.06] cursor-pointer accent-blue-500"
                          />

                          {/* Action buttons */}
                          {!task.startTime ? (
                            <button onClick={() => startTask(emp.id, 'work', task.id)}
                              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 font-medium ml-auto">
                              <Play size={10} /> Start
                            </button>
                          ) : !task.endTime ? (
                            <div className="flex gap-1 ml-auto">
                              {task.paused ? (
                                <button onClick={() => resumeTask(emp.id, 'work', task.id)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 font-medium">
                                  <Play size={10} /> Resume
                                </button>
                              ) : (
                                <button onClick={() => pauseTask(emp.id, 'work', task.id)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 font-medium">
                                  <Pause size={10} /> Pause
                                </button>
                              )}
                              {!task.onTaskBreak ? (
                                <button onClick={() => taskBreak(emp.id, 'work', task.id)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] font-medium">
                                  <Coffee size={10} />
                                </button>
                              ) : (
                                <button onClick={() => resumeFromTaskBreak(emp.id, 'work', task.id)}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 font-medium">
                                  <Play size={10} /> Lanjut
                                </button>
                              )}
                              <button onClick={() => endTask(emp.id, 'work', task.id)}
                                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md bg-white/[0.04] text-slate-400 hover:bg-white/[0.06] font-medium">
                                <Square size={10} /> End
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ===== ADD TASK INPUT ===== */}
                <div className="p-3 border-t border-white/[0.06]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah task baru..."
                      value={newTask[`${emp.id}-work`] || ''}
                      onChange={(e) => setNewTask(prev => ({ ...prev, [`${emp.id}-work`]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addTask(emp.id, 'work')}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/30"
                    />
                    <button
                      onClick={() => addTask(emp.id, 'work')}
                      className="px-3 py-2 rounded-lg bg-blue-500/15 text-blue-300 hover:bg-blue-500/20 transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [
    employees, currentTheme, AttentionSection, selectedEmployee, newTask,
    showCompletedTasks, isProcessing, statusConfig, priorityColors, detectShift,
    updateLateHours, startBreak, endBreak, startIzin, endIzin, endShift,
    handleDragStart, handleDragOver, handleDrop, calculateElapsedTime,
    deleteTask, updateProgress, updatePriority, startTask, pauseTask,
    resumeTask, taskBreak, resumeFromTaskBreak, endTask, addTask,
    setSelectedEmployee, setNewTask, pauseAllTasks, resumeAllTasks
  ]);

  return dashboardContent;
});

DashboardPage.displayName = 'DashboardPage';

/* eslint-disable */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Calendar, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  Bell, Play, Square, Pause, Coffee
} from 'lucide-react';

export const StatisticsPage = React.memo(({
  employees, attentions, currentTheme, selectedDate, setSelectedDate,
  statisticsTab, setStatisticsTab, currentMonth, setCurrentMonth,
  currentYear, yearlyAttendance, statusConfig, monthNames, calculateMonthlyStats
}) => {
  const days = new Date(currentYear, currentMonth + 1, 0).getDate();
  const first = new Date(currentYear, currentMonth, 1).getDay();
  const active = attentions.filter(a => !a.completed);

  const employeeCompletedTasks = useMemo(() => {
    return employees.map(emp => {
      const currentTasks = [...emp.workTasks].filter(t => {
        if (!t.completed) return false;
        return (t.completedAt ? new Date(t.completedAt).toDateString() : null) === selectedDate;
      });
      const archivedTasks = emp.completedTasksHistory.filter(t => {
        const taskDate = t.shiftDate || (t.completedAt ? new Date(t.completedAt).toDateString() : null);
        return taskDate === selectedDate;
      });
      return { emp, completedTasks: [...currentTasks, ...archivedTasks] };
    });
  }, [employees, selectedDate]);

  const priorityDot = { urgent: 'bg-red-400', high: 'bg-amber-400', normal: 'bg-blue-400', low: 'bg-slate-400' };

  return (
    <div className="space-y-6">
      {/* Active attentions */}
      {active.length > 0 && (
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="text-blue-300" size={16} />
            <h3 className="text-sm font-semibold text-white/90">Active Attentions</h3>
          </div>
          <div className="space-y-2">
            {active.map(a => (
              <div key={a.id} className="bg-white/[0.02] rounded-lg p-3">
                <p className="text-xs text-slate-200 break-words mb-1">{a.text}</p>
                {a.image && <img src={a.image} alt="Att" className="max-w-sm rounded-lg border border-white/[0.06] mb-1" />}
                <p className="text-[10px] text-slate-500">📝 {a.createdAt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-1.5">
        <button onClick={() => setStatisticsTab('history')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${statisticsTab === 'history'
            ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}>
          <CheckCircle size={14} /> History Task
        </button>
        <button onClick={() => setStatisticsTab('attendance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${statisticsTab === 'attendance'
            ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}>
          <Calendar size={14} /> Kehadiran
        </button>
      </div>

      {/* ===== HISTORY TAB ===== */}
      {statisticsTab === 'history' && (
        <div className="space-y-6">
          {/* Date header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white/90">History Task Selesai</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedDate === new Date().toDateString() ? 'Hari ini'
                  : new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {selectedDate !== new Date().toDateString() && (
              <button onClick={() => setSelectedDate(new Date().toDateString())}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-300 text-[11px] font-medium hover:bg-blue-500/20 transition-all">
                Hari Ini
              </button>
            )}
          </div>

          {/* 3-column employee task history */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {employeeCompletedTasks.map(({ emp, completedTasks }) => (
              <div key={emp.id} className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] flex flex-col">
                {/* Employee header */}
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-300">
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white/90">{emp.name}</h3>
                      <span className="text-[10px] text-slate-500">{completedTasks.length} task selesai</span>
                    </div>
                  </div>

                  {/* Shift info */}
                  {emp.shifts && emp.shifts.length > 0 && (() => {
                    const todayShift = emp.shifts.find(s => s.date === selectedDate);
                    if (!todayShift) return null;
                    return (
                      <div className="mt-2 pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300">
                            {todayShift.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}
                          </span>
                          <span className="text-slate-500">{todayShift.status === 'telat' ? `⚠️ Telat ${todayShift.lateHours}h` : '✅ On time'}</span>
                        </div>
                        <div className="flex gap-3 mt-1 text-[10px] text-slate-500">
                          {todayShift.checkInTime && <span>▶ {todayShift.checkInTime}</span>}
                          {todayShift.endTime && <span>⏹ {todayShift.endTime}</span>}
                          {todayShift.checkInTime && todayShift.endTime && (() => {
                            const [sH, sM] = todayShift.checkInTime.split(':').map(Number);
                            const [eH, eM] = todayShift.endTime.split(':').map(Number);
                            const dur = (eH * 60 + eM) - (sH * 60 + sM);
                            return <span>⏱ {Math.floor(dur / 60)}h {dur % 60}m</span>;
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Task list */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[400px] scrollbar-thin">
                  {completedTasks.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle size={28} className="text-slate-700 mx-auto mb-1" />
                      <p className="text-[11px] text-slate-500">Belum ada task selesai</p>
                    </div>
                  ) : completedTasks.map((task, idx) => (
                    <div key={`task-${emp.id}-${task.id}-${idx}`} className="bg-white/[0.02] rounded-lg p-3 hover:bg-white/[0.04] transition-all">
                      <div className="flex items-start gap-2 mb-1.5">
                        <CheckCircle size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-200 font-medium">{task.task}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
                        {task.completedAtDisplay && <span>✅ {task.completedAtDisplay}</span>}
                        {task.duration && <span>⏱ {task.duration}</span>}
                        {task.startTime && <span>▶ {task.startTime}</span>}
                        {task.endTime && <span>⏹ {task.endTime}</span>}
                      </div>
                      {task.pauseHistory && task.pauseHistory.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-white/[0.04]">
                          <p className="text-[10px] text-amber-400/60 mb-1 flex items-center gap-1">
                            <Pause size={10} /> {task.pauseHistory.length}x pause
                          </p>
                          {task.pauseHistory.map((pause, pidx) => (
                            <div key={pidx} className="text-[10px] text-slate-500 bg-white/[0.02] rounded px-2 py-1 mb-0.5">
                              ⏸ {pause.startTime} → {pause.endTime || '...'} · {pause.reason}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority] || priorityDot.normal}`}></span>
                        <span className="text-[10px] text-slate-500">{task.priority}</span>
                        <span className="text-[10px] text-slate-600">· {task.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Break History */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-3">
              <Coffee size={14} /> Riwayat Istirahat
            </h3>
            {employees.map(emp => {
              const filteredBreaks = emp.breakHistory.filter(b => b.date && new Date(b.date).toDateString() === selectedDate);
              if (filteredBreaks.length === 0) return null;
              return (
                <div key={`break-${emp.id}`} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-[9px] font-bold text-blue-300">{emp.name[0]}</div>
                    <span className="text-xs font-medium text-white/80">{emp.name}</span>
                    <span className="text-[10px] text-slate-500">{filteredBreaks.length}x</span>
                  </div>
                  {filteredBreaks.map((brk, idx) => (
                    <div key={idx} className="bg-white/[0.02] rounded-lg p-2.5 mb-1.5 text-[10px] text-slate-400">
                      <div className="flex items-center gap-2 mb-1">
                        <Coffee size={10} className="text-amber-400/60" />
                        <span>{brk.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}</span>
                        {brk.isLate && <span className="text-amber-400">Telat {brk.lateDuration}j</span>}
                      </div>
                      <div className="flex gap-3">
                        <span>{brk.startTime} → {brk.endTime}</span>
                        <span>{brk.duration} menit</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {employees.every(e => e.breakHistory.length === 0) && (
              <div className="text-center py-4"><p className="text-xs text-slate-500">Belum ada riwayat</p></div>
            )}
          </div>

          {/* Izin History */}
          <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-4">
            <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 mb-3">
              <Bell size={14} /> Riwayat Izin
            </h3>
            {employees.map(emp => {
              const filteredIzin = emp.izinHistory.filter(i => i.date && new Date(i.date).toDateString() === selectedDate);
              if (filteredIzin.length === 0) return null;
              return (
                <div key={`izin-${emp.id}`} className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center text-[9px] font-bold text-blue-300">{emp.name[0]}</div>
                    <span className="text-xs font-medium text-white/80">{emp.name}</span>
                    <span className="text-[10px] text-slate-500">{filteredIzin.length}x</span>
                  </div>
                  {filteredIzin.map((izin, idx) => (
                    <div key={idx} className="bg-white/[0.02] rounded-lg p-2.5 mb-1.5 text-[10px] text-slate-400">
                      <div className="flex items-center gap-2 mb-1">
                        <Bell size={10} className="text-blue-300/60" />
                        <span>{izin.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}</span>
                      </div>
                      <p className="text-slate-300 mb-1">📋 {izin.reason}</p>
                      <div className="flex gap-3">
                        <span>{izin.startTime} → {izin.endTime}</span>
                        <span>{izin.duration} menit</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {employees.every(e => e.izinHistory.length === 0) && (
              <div className="text-center py-4"><p className="text-xs text-slate-500">Belum ada riwayat</p></div>
            )}
          </div>
        </div>
      )}

      {/* ===== ATTENDANCE TAB ===== */}
      {statisticsTab === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white/90">Statistik Kehadiran</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">{monthNames[currentMonth]} {currentYear}</p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))} disabled={currentMonth === 0}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-20 transition-all">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))} disabled={currentMonth === 11}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-20 transition-all">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {employees.map(e => {
            const mStats = calculateMonthlyStats(e.name, currentMonth);
            const getAttendancePillClass = (s) => statusConfig?.[s]?.pillClass || 'bg-slate-900/45 text-slate-200';

            return (
              <div key={e.id} className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold text-white/90">{e.name}</h3>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {['hadir', 'telat', 'lembur', 'izin', 'libur', 'sakit', 'alpha'].map(s => (
                      <div key={s} className={`px-2 py-0.5 rounded-lg font-medium ${getAttendancePillClass(s)}`}>
                        {(statusConfig?.[s]?.label || s)}: {(mStats?.[s] || 0)}{s === 'telat' && mStats.totalLateHours > 0 ? ` (${mStats.totalLateHours}j)` : ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="grid grid-cols-7 gap-1">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                      <div key={i} className="text-center text-[8px] text-slate-600 py-0.5">{d}</div>
                    ))}
                    {[...Array(first)].map((_, i) => <div key={`empty-${i}`} className="h-7"></div>)}
                    {[...Array(days)].map((_, i) => {
                      const day = i + 1;
                      const data = yearlyAttendance?.[e.name]?.[currentMonth]?.[day];
                      const hasData = data && data.status && data.status !== 'belum';
                      const hasOvertime = data && data.status === 'lembur';
                      const baseStatus = hasOvertime && data.overtimeBaseStatus ? data.overtimeBaseStatus : data?.status;
                      const baseCalendarBg = statusConfig?.[baseStatus]?.calendarBg || statusConfig?.[baseStatus]?.bg || 'bg-blue-600';
                      const overtimeCalendarBg = statusConfig?.lembur?.calendarBg || statusConfig?.lembur?.bg || 'bg-blue-800';

                      return (
                        <div key={day} className="h-7">
                          {hasData ? (
                            hasOvertime ? (
                              <div className="w-full h-full rounded text-center text-white text-[9px] font-medium hover:scale-110 transition-transform cursor-pointer overflow-hidden relative flex items-center justify-center"
                                onClick={() => { setSelectedDate(new Date(currentYear, currentMonth, day).toDateString()); setStatisticsTab('history'); }}
                                title={`${day}: ${baseStatus === 'telat' ? 'Telat' : 'Hadir'} + Lembur`}>
                                <div className={`absolute inset-0 ${baseCalendarBg}`} style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}></div>
                                <div className={`absolute inset-0 ${overtimeCalendarBg}`} style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                                <span className="relative z-10">{day}</span>
                              </div>
                            ) : (
                              <div className={`w-full h-full ${statusConfig?.[data.status]?.calendarBg || statusConfig?.[data.status]?.bg || 'bg-blue-600'} rounded text-center text-white text-[9px] font-medium hover:scale-110 transition-transform cursor-pointer flex items-center justify-center`}
                                onClick={() => { setSelectedDate(new Date(currentYear, currentMonth, day).toDateString()); setStatisticsTab('history'); }}
                                title={`${day}: ${statusConfig?.[data.status]?.label || data.status}`}>
                                {day}
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full bg-white/[0.02] rounded text-center text-[9px] text-slate-600 border border-dashed border-white/[0.04] flex items-center justify-center">
                              {day}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {mStats.totalLateHours > 0 && (
                  <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px]">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Clock size={12} /> Total Jam Telat:
                    </span>
                    <span className="font-semibold text-amber-300">{mStats.totalLateHours} jam</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

StatisticsPage.displayName = 'StatisticsPage';

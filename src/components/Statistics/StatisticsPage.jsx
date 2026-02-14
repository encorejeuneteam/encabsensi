import React, { useMemo } from 'react';
import {
  Calendar, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight,
  Bell, Play, Square, Pause, Coffee
} from 'lucide-react';

/**
 * StatisticsPage Component
 * 
 * Extracted from App.js monolith
 * Shows task completion history and attendance statistics
 * 
 * @param {Object} props
 * @param {Array} props.employees - Employee data array
 * @param {Array} props.attentions - Attention items array  
 * @param {Object} props.currentTheme - Current theme configuration
 * @param {String} props.selectedDate - Selected date for history view
 * @param {Function} props.setSelectedDate - Selected date setter
 * @param {String} props.statisticsTab - Active tab ('history' or 'attendance')
 * @param {Function} props.setStatisticsTab - Tab setter
 * @param {Number} props.currentMonth - Current month index
 * @param {Function} props.setCurrentMonth - Month setter
 * @param {Number} props.currentYear - Current year
 * @param {Object} props.yearlyAttendance - Yearly attendance data
 * @param {Object} props.statusConfig - Status configuration object
 * @param {Array} props.monthNames - Month names array
 * @param {Function} props.calculateMonthlyStats - Calculate monthly statistics function
 */
export const StatisticsPage = React.memo(({
  employees,
  attentions,
  currentTheme,
  selectedDate,
  setSelectedDate,
  statisticsTab,
  setStatisticsTab,
  currentMonth,
  setCurrentMonth,
  currentYear,
  yearlyAttendance,
  statusConfig,
  monthNames,
  calculateMonthlyStats
}) => {
  const days = new Date(currentYear, currentMonth + 1, 0).getDate();
  const first = new Date(currentYear, currentMonth, 1).getDay();
  const active = attentions.filter(a => !a.completed);

  // Memoize completed tasks to prevent re-render on timer updates
  const employeeCompletedTasks = useMemo(() => {
    return employees.map(emp => {
      const currentTasks = [...emp.workTasks].filter(t => {
        if (!t.completed) return false;
        const taskDate = t.completedAt ? new Date(t.completedAt).toDateString() : null;
        return taskDate === selectedDate;
      });

      // Use shiftDate for archived tasks, fallback to completedAt
      const archivedTasks = emp.completedTasksHistory.filter(t => {
        const taskDate = t.shiftDate || (t.completedAt ? new Date(t.completedAt).toDateString() : null);
        return taskDate === selectedDate;
      });

      return {
        emp,
        completedTasks: [...currentTasks, ...archivedTasks]
      };
    });
  }, [employees, selectedDate]);

  const getPriorityPillClass = (priority) => {
    if (priority === 'urgent') return 'bg-blue-700/55 text-white border border-blue-300/30';
    if (priority === 'high') return 'bg-blue-800/45 text-blue-100 border border-blue-400/25';
    if (priority === 'normal') return 'bg-blue-900/35 text-blue-200 border border-blue-500/20';
    return 'bg-slate-800/60 text-slate-200 border border-white/10';
  };

  const getAttendancePillClass = (statusKey) => {
    return statusConfig?.[statusKey]?.pillClass || 'bg-slate-900/45 text-slate-200';
  };

  return (
    <div className="space-y-8">
      {active.length > 0 && (
        <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-5`}>
          <div className="flex items-center gap-2.5 mb-4">
            <Bell className="text-blue-300" size={20} />
            <h3 className={`text-lg font-semibold ${currentTheme.text}`}>Active Attentions</h3>
          </div>
          <div className="space-y-2.5">
            {active.map(a => (
              <div key={a.id} className={`${currentTheme.badge} border ${currentTheme.borderColor} rounded-xl p-3`}>
                <p className={`text-sm ${currentTheme.text} font-medium mb-1.5 break-words`}>{a.text}</p>
                {a.image && <img src={a.image} alt="Att" className="max-w-sm rounded-lg border border-white/10 mb-1.5" />}
                <p className={`text-xs ${currentTheme.subtext}`}>📝 {a.createdAt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Selector */}
      <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-2`}>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setStatisticsTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all text-xs sm:text-sm ${statisticsTab === 'history'
              ? `${currentTheme.accent} ${currentTheme.accentHover} text-white ${currentTheme.shadow} hover:scale-[1.01] active:scale-[0.99]`
              : `${currentTheme.badge} hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99]`
              }`}
          >
            <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
            History Task Selesai
          </button>
          <button
            onClick={() => setStatisticsTab('attendance')}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all text-xs sm:text-sm ${statisticsTab === 'attendance'
              ? `${currentTheme.accent} ${currentTheme.accentHover} text-white ${currentTheme.shadow} hover:scale-[1.01] active:scale-[0.99]`
              : `${currentTheme.badge} hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99]`
              }`}
          >
            <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
            Statistik Kehadiran
          </button>
        </div>
      </div>

      {/* Task History Section */}
      {statisticsTab === 'history' && (
        <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className={`${currentTheme.accent} p-2 sm:p-2.5 rounded-xl flex-shrink-0`}>
                <CheckCircle className="text-white w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </div>
              <div>
                <h2 className={`text-lg sm:text-xl font-semibold ${currentTheme.text}`}>History Task Selesai</h2>
                <p className={`text-[10px] sm:text-xs ${currentTheme.subtext}`}>
                  {selectedDate === new Date().toDateString()
                    ? 'Task hari ini'
                    : `Task tanggal ${new Date(selectedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </p>
              </div>
            </div>

            {selectedDate !== new Date().toDateString() && (
              <button
                onClick={() => setSelectedDate(new Date().toDateString())}
                className={`px-4 py-2 ${currentTheme.accent} ${currentTheme.accentHover} text-white rounded-lg text-xs font-medium transition-all hover:scale-[1.01] active:scale-[0.99]`}
              >
                Kembali ke Hari Ini
              </button>
            )}
          </div>

          {/* 3 Kolom per Employee */}
          <div className="grid grid-cols-3 gap-6">
            {employeeCompletedTasks.map(({ emp, completedTasks }) => {

              return (
                <div key={emp.id} className={`${currentTheme.card} rounded-xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4`}>
                  <div className="mb-4 pb-3 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 ${currentTheme.accent} rounded-full flex items-center justify-center font-bold text-white`}>
                        {emp.name[0]}
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-base font-bold ${currentTheme.text}`}>{emp.name}</h3>
                        <span className={`text-xs ${currentTheme.subtext}`}>
                          {completedTasks.length} task selesai
                        </span>
                      </div>
                    </div>

                    {/* Shift Info */}
                    {emp.shifts && emp.shifts.length > 0 && (() => {
                      const todayShift = emp.shifts.find(s => s.date === selectedDate);
                      if (todayShift) {
                        return (
                          <div className={`mt-2 pt-2 border-t ${currentTheme.borderColor}`}>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full ${currentTheme.accentSoftBg} ${currentTheme.accentTextStrong} border ${currentTheme.accentSoftBorder}`}>
                                  {todayShift.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}
                                </span>
                                <span className={currentTheme.subtext}>
                                  {todayShift.status === 'telat' ? `⚠️ Telat ${todayShift.lateHours}h` : '✅ Tepat Waktu'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                <Play size={12} className={currentTheme.accentText} />
                                <span>Mulai: <strong>{todayShift.checkInTime}</strong></span>
                              </div>
                              {todayShift.endTime && (
                                <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                  <Square size={12} className={currentTheme.accentText} />
                                  <span>Selesai: <strong>{todayShift.endTime}</strong></span>
                                </div>
                              )}
                              {todayShift.checkInTime && todayShift.endTime && (() => {
                                const [startH, startM] = todayShift.checkInTime.split(':').map(Number);
                                const [endH, endM] = todayShift.endTime.split(':').map(Number);
                                const startMinutes = startH * 60 + startM;
                                const endMinutes = endH * 60 + endM;
                                const durationMinutes = endMinutes - startMinutes;
                                const hours = Math.floor(durationMinutes / 60);
                                const minutes = durationMinutes % 60;
                                return (
                                  <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                    <Clock size={12} className={currentTheme.accentText} />
                                    <span>Durasi: <strong>{hours}h {minutes}m</strong></span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="space-y-2">
                    {completedTasks.map((task, taskIdx) => (
                      <div key={`task-${emp.id}-${task.id}-${taskIdx}`} className={`${currentTheme.badge} rounded-lg p-3 border ${currentTheme.borderColor}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle size={14} className={`${currentTheme.accentText} flex-shrink-0`} />
                              <p className={`text-sm font-medium ${currentTheme.text}`}>{task.task}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {task.completedAtDisplay && (
                                <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                  <Calendar size={12} />
                                  <span>Selesai: {task.completedAtDisplay}</span>
                                </div>
                              )}
                              {task.duration && (
                                <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                  <Clock size={12} />
                                  <span>Durasi: {task.duration}</span>
                                </div>
                              )}
                              {task.startTime && (
                                <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                  <Play size={12} />
                                  <span>Mulai: {task.startTime}</span>
                                </div>
                              )}
                              {task.endTime && (
                                <div className={`flex items-center gap-1 ${currentTheme.subtext}`}>
                                  <Square size={12} />
                                  <span>Selesai: {task.endTime}</span>
                                </div>
                              )}
                            </div>

                            {/* ✅ FIX BUG #2: Display Pause History with detailed info */}
                            {task.pauseHistory && task.pauseHistory.length > 0 && (
                              <div className={`mt-2 pt-2 border-t ${currentTheme.borderColor}`}>
                                <p className={`text-xs font-semibold ${currentTheme.text} mb-1.5 flex items-center gap-1`}>
                                  <Pause size={12} />
                                  Riwayat Pause ({task.pauseHistory.length}x):
                                </p>
                                <div className="space-y-1">
                                  {task.pauseHistory.map((pause, idx) => (
                                    <div key={idx} className={`text-xs ${currentTheme.accentSoftBg} border ${currentTheme.accentSoftBorder} rounded px-2 py-1.5`}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span className={`${currentTheme.accentTextStrong} font-medium`}>
                                          ⏸️ {pause.startTime} → {pause.endTime || 'Belum selesai'}
                                        </span>
                                      </div>
                                      <p className={`text-xs ${currentTheme.subtext}`}>📋 Alasan: {pause.reason}</p>
                                      {pause.dateDisplay && (
                                        <p className={`text-xs ${currentTheme.subtext} mt-0.5`}>📅 {pause.dateDisplay}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityPillClass(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${currentTheme.badge}`}>
                                {task.progress}% progress
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {completedTasks.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle size={40} className="text-slate-300 mx-auto mb-2" />
                        <p className={`text-xs ${currentTheme.subtext}`}>Belum ada task selesai</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {employees.every(emp => [...emp.workTasks].filter(t => t.completed).length === 0) && (
            <div className="text-center py-8">
              <AlertCircle size={48} className="text-slate-300 mx-auto mb-3" />
              <p className={`text-sm ${currentTheme.subtext}`}>Belum ada task yang diselesaikan</p>
            </div>
          )}

          {/* Break History Section */}
          <div className="mt-8">
            <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4 flex items-center gap-2`}>
              <Coffee size={20} />
              Riwayat Istirahat
            </h3>
            {employees.map(emp => {
              // Filter break history by selected date
              const filteredBreaks = emp.breakHistory.filter(brk => {
                if (!brk.date) return false;
                const breakDate = new Date(brk.date).toDateString();
                return breakDate === selectedDate;
              });

              if (filteredBreaks.length === 0) return null;

              return (
                <div key={`break-${emp.id}`} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 ${currentTheme.accent} rounded-full flex items-center justify-center font-bold text-white text-xs`}>
                      {emp.name[0]}
                    </div>
                    <h4 className={`text-sm font-semibold ${currentTheme.text}`}>{emp.name}</h4>
                    <span className={`text-xs ${currentTheme.badge} px-2 py-0.5 rounded-full`}>
                      {filteredBreaks.length} istirahat
                    </span>
                  </div>

                  <div className="space-y-2">
                    {filteredBreaks.map((brk, idx) => (
                      <div key={`break-${emp.id}-${idx}-${brk.date}`} className={`${currentTheme.badge} rounded-lg p-3 border ${brk.isLate ? 'border-blue-500/30' : `${currentTheme.borderColor}`}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Coffee size={14} className={currentTheme.accentText} />
                              <span className={`text-xs font-medium ${currentTheme.accentTextStrong}`}>
                                {brk.shift === 'pagi' ? '☀️ Shift Pagi' : '🌙 Shift Malam'}
                              </span>
                              {brk.isLate && (
                                <span className="text-xs bg-blue-950/30 text-blue-200 px-2 py-0.5 rounded-full font-medium border border-blue-500/15">
                                  Telat {brk.lateDuration} jam
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                              <div className={currentTheme.subtext}>
                                <span className="font-medium">Mulai:</span> {brk.startTime}
                              </div>
                              <div className={currentTheme.subtext}>
                                <span className="font-medium">Selesai:</span> {brk.endTime}
                              </div>
                              <div className={currentTheme.subtext}>
                                <span className="font-medium">Durasi:</span> {brk.duration} menit
                              </div>
                            </div>

                            <div className={`text-xs ${currentTheme.subtext} mt-1`}>
                              {brk.dateDisplay || brk.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {employees.every(emp => emp.breakHistory.length === 0) && (
              <div className="text-center py-6">
                <Coffee size={40} className="text-slate-300 mx-auto mb-2" />
                <p className={`text-sm ${currentTheme.subtext}`}>Belum ada riwayat istirahat</p>
              </div>
            )}
          </div>

          {/* Izin History Section */}
          <div className="mt-8">
            <h3 className={`text-lg font-semibold ${currentTheme.text} mb-4 flex items-center gap-2`}>
              <Bell size={20} />
              Riwayat Izin
            </h3>
            {employees.map(emp => {
              // Filter izin history by selected date
              const filteredIzin = emp.izinHistory.filter(izin => {
                if (!izin.date) return false;
                const izinDate = new Date(izin.date).toDateString();
                return izinDate === selectedDate;
              });

              if (filteredIzin.length === 0) return null;

              return (
                <div key={`izin-${emp.id}`} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 ${currentTheme.accent} rounded-full flex items-center justify-center font-bold text-white text-xs`}>
                      {emp.name[0]}
                    </div>
                    <h4 className={`text-sm font-semibold ${currentTheme.text}`}>{emp.name}</h4>
                    <span className={`text-xs ${currentTheme.badge} px-2 py-0.5 rounded-full`}>
                      {filteredIzin.length} izin
                    </span>
                  </div>

                  <div className="space-y-2">
                    {filteredIzin.map((izin, idx) => (
                      <div key={`izin-${emp.id}-${idx}-${izin.date}`} className={`${currentTheme.badge} rounded-lg p-3 border ${currentTheme.borderColor}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Bell size={14} className={currentTheme.accentText} />
                              <span className={`text-xs font-medium ${currentTheme.accentTextStrong}`}>
                                {izin.shift === 'pagi' ? '☀️ Shift Pagi' : '🌙 Shift Malam'}
                              </span>
                            </div>

                            <div className={`${currentTheme.accentSoftBg} border ${currentTheme.accentSoftBorder} rounded px-2 py-1.5 mb-2`}>
                              <p className={`text-xs ${currentTheme.accentTextStrong} font-medium`}>
                                📋 Alasan: {izin.reason}
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                              <div className={currentTheme.subtext}>
                                <span className="font-medium">Mulai:</span> {izin.startTime}
                              </div>
                              <div className={currentTheme.subtext}>
                                <span className="font-medium">Selesai:</span> {izin.endTime}
                              </div>
                              <div className={currentTheme.subtext}>
                                <span className="font-medium">Durasi:</span> {izin.duration} menit
                              </div>
                            </div>

                            <div className={`text-xs ${currentTheme.subtext} mt-1`}>
                              {izin.dateDisplay || izin.date}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {employees.every(emp => emp.izinHistory.length === 0) && (
              <div className="text-center py-6">
                <Bell size={40} className="text-slate-300 mx-auto mb-2" />
                <p className={`text-sm ${currentTheme.subtext}`}>Belum ada riwayat izin</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance Statistics Section */}
      {statisticsTab === 'attendance' && (
        <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.text}`}>Statistik Kehadiran</h2>
              <p className={`text-xs sm:text-sm ${currentTheme.subtext} mt-1`}>{monthNames[currentMonth]} {currentYear}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))} disabled={currentMonth === 0} className={`p-2 rounded-lg border ${currentTheme.badge} hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:scale-[1.02] active:scale-[0.98]`}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))} disabled={currentMonth === 11} className={`p-2 rounded-lg border ${currentTheme.badge} hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:scale-[1.02] active:scale-[0.98]`}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {employees.map(e => {
            const mStats = calculateMonthlyStats(e.name, currentMonth);
            return (
              <div key={e.id} className="mb-8 last:mb-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                  <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text}`}>{e.name}</h3>
                  <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                    {['hadir', 'telat', 'lembur', 'izin', 'libur', 'sakit', 'alpha'].map(s => (
                      <div key={s} className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap ${getAttendancePillClass(s)}`}>
                        {(statusConfig?.[s]?.label || s)}: {(mStats?.[s] || 0)}{s === 'telat' && mStats.totalLateHours > 0 ? ` (${mStats.totalLateHours}j)` : ''}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 min-w-[320px]">
                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                      <div key={d} className={`text-center text-[10px] sm:text-xs font-medium ${currentTheme.subtext} py-1`}>{d}</div>
                    ))}

                    {/* Empty cells for previous month days */}
                    {[...Array(first)].map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square sm:aspect-auto"></div>
                    ))}

                    {[...Array(days)].map((_, i) => {
                      const day = i + 1;
                      const data = yearlyAttendance?.[e.name]?.[currentMonth]?.[day];

                      // Only show status if there's actual data (not default/empty)
                      const hasData = data && data.status && data.status !== 'belum';

                      // Check if this day has overtime (multiple statuses)
                      const hasOvertime = data && data.status === 'lembur';
                      const baseStatus = hasOvertime && data.overtimeBaseStatus ? data.overtimeBaseStatus : data?.status;
                      const baseCalendarBg = statusConfig?.[baseStatus]?.calendarBg || statusConfig?.[baseStatus]?.bg || 'bg-blue-600';
                      const overtimeCalendarBg = statusConfig?.lembur?.calendarBg || statusConfig?.lembur?.bg || 'bg-blue-800';

                      return (
                        <div key={day} className="relative aspect-square sm:aspect-auto">
                          {hasData ? (
                            hasOvertime ? (
                              // Multi-color for overtime days (hadir/telat + lembur)
                              <div
                                className="calendar-cell w-full h-full sm:h-auto rounded-md sm:rounded-lg p-1.5 sm:p-2.5 text-center text-white text-[10px] sm:text-xs font-medium hover:scale-105 transition-transform cursor-pointer shadow-sm overflow-hidden relative flex items-center justify-center sm:block"
                                onClick={() => {
                                  const clickedDate = new Date(currentYear, currentMonth, day);
                                  setSelectedDate(clickedDate.toDateString());
                                  setStatisticsTab('history');
                                }}
                                title={`${day} ${monthNames[currentMonth]}: ${baseStatus === 'telat' ? 'Telat' : 'Hadir'} + Lembur${data.lateHours > 0 ? ` (${data.lateHours}h telat)` : ''}`}
                              >
                                {/* Base status color (left half) */}
                                <div className={`absolute inset-0 ${baseCalendarBg}`} style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}></div>
                                {/* Overtime color (right half) */}
                                <div className={`absolute inset-0 ${overtimeCalendarBg}`} style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}></div>
                                {/* Day number */}
                                <span className="relative z-10">{day}</span>
                              </div>
                            ) : (
                              // Single color for normal days
                              <div
                                className={`calendar-cell w-full h-full sm:h-auto ${statusConfig?.[data.status]?.calendarBg || statusConfig?.[data.status]?.bg || 'bg-blue-600'} rounded-md sm:rounded-lg p-1.5 sm:p-2.5 text-center text-white text-[10px] sm:text-xs font-medium hover:scale-105 transition-transform cursor-pointer shadow-sm flex items-center justify-center sm:block`}
                                onClick={() => {
                                  const clickedDate = new Date(currentYear, currentMonth, day);
                                  setSelectedDate(clickedDate.toDateString());
                                  setStatisticsTab('history');
                                }}
                                title={`${day} ${monthNames[currentMonth]}: ${(statusConfig?.[data.status]?.label || data.status)}${data.lateHours > 0 ? ` (${data.lateHours}h telat)` : ''}`}
                              >
                                {day}
                              </div>
                            )
                          ) : (
                            <div
                              className={`calendar-cell w-full h-full sm:h-auto ${currentTheme.badge} rounded-md sm:rounded-lg p-1.5 sm:p-2.5 text-center text-[10px] sm:text-xs font-medium border border-dashed ${currentTheme.borderColor} ${currentTheme.text} flex items-center justify-center sm:block`}
                              title={`${day} ${monthNames[currentMonth]}: Tidak ada data`}
                            >
                              {day}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total Late Hours Summary */}
                {mStats.totalLateHours > 0 && (
                  <div className="mt-4 p-3 bg-blue-950/20 border border-blue-500/15 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="text-blue-300" size={16} />
                        <span className="text-sm font-medium text-blue-200">Total Jam Telat:</span>
                      </div>
                      <span className="text-lg font-bold text-blue-200">{mStats.totalLateHours} jam</span>
                    </div>
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

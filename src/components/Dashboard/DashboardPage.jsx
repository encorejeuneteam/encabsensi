import React, { useMemo } from 'react';
import {
  Calendar, Users, Sun, Moon, TrendingUp, CheckCircle, Clock,
  AlertCircle, Zap, GripVertical, Trash2, Play, Square,
  Pause, Coffee, Plus, Bell
} from 'lucide-react';

/**
 * DashboardPage Component
 * 
 * Extracted from App.js monolith
 * Main dashboard showing employee cards with tasks and real-time productivity
 * 
 * @param {Object} props
 * @param {Array} props.employees - Employee data array
 * @param {Object} props.currentTheme - Current theme configuration
 * @param {JSX.Element} props.AttentionSection - Attention section component
 * @param {String} props.selectedEmployee - Selected employee filter
 * @param {Function} props.setSelectedEmployee - Selected employee setter
 * @param {Object} props.newTask - New task input state
 * @param {Function} props.setNewTask - New task input setter
 * @param {Boolean} props.showCompletedTasks - Show completed tasks toggle
 * @param {Boolean} props.isProcessing - Processing state for buttons
 * @param {Object} props.statusConfig - Status configuration
 * @param {Object} props.priorityColors - Priority colors configuration
 * @param {Function} props.detectShift - Detect current shift function
 * @param {Function} props.updateLateHours - Update late hours function
 * @param {Function} props.startBreak - Start break function
 * @param {Function} props.endBreak - End break function
 * @param {Function} props.startIzin - Start izin function
 * @param {Function} props.endIzin - End izin function
 * @param {Function} props.endShift - End shift function
 * @param {Function} props.pauseAllTasks - Pause all running tasks for an employee
 * @param {Function} props.resumeAllTasks - Resume all paused tasks for an employee
 * @param {Function} props.handleDragStart - Drag start handler
 * @param {Function} props.handleDragOver - Drag over handler
 * @param {Function} props.handleDrop - Drop handler
 * @param {Function} props.calculateElapsedTime - Calculate elapsed time
 * @param {Function} props.deleteTask - Delete task function
 * @param {Function} props.updateProgress - Update progress function
 * @param {Function} props.updatePriority - Update priority function
 * @param {Function} props.startTask - Start task function
 * @param {Function} props.pauseTask - Pause task function
 * @param {Function} props.resumeTask - Resume task function
 * @param {Function} props.taskBreak - Task break function
 * @param {Function} props.resumeFromTaskBreak - Resume from task break function
 * @param {Function} props.endTask - End task function
 * @param {Function} props.addTask - Add task function
 */
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
    const shiftPagi = employees.filter(e => e.shift === 'pagi').map(e => e.name);
    const shiftMalam = employees.filter(e => e.shift === 'malam').map(e => e.name);

    // Filter employees based on selection
    // Desta (admin) dapat melihat semua tim, tim lain hanya lihat yang checked in
    const destaUser = employees.find(e => e.isAdmin);
    const isDestaView = selectedEmployee === 'all' || selectedEmployee === destaUser?.name;

    const filteredEmployees = selectedEmployee === 'all'
      ? (destaUser ? employees : employees.filter(e => e.checkedIn))
      : employees.filter(emp => emp.name === selectedEmployee);

    return (
      <div className="space-y-8">
        {AttentionSection}

        <div className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-4 sm:p-6`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${currentTheme.text}`}>ABSENSI ENCOREJEUNE</h1>
              <p className={`text-xs sm:text-sm ${currentTheme.subtext} flex items-center gap-1.5 mt-1`}>
                <Calendar size={14} />
                {date}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                <p className={`text-[10px] sm:text-xs ${currentTheme.subtext} flex items-center gap-1.5`}>
                  {currentShift === 'pagi' ? <Sun size={12} className={currentTheme.accentText} /> : <Moon size={12} className={currentTheme.accentText} />}
                  Shift: <span className="font-semibold">{currentShift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}</span>
                </p>
                <p className={`text-[10px] sm:text-xs ${currentTheme.subtext} flex items-center gap-1.5`}>
                  <Users size={12} />
                  Check-in: <span className="font-semibold">{checkedInCount}/3</span>
                </p>
              </div>
            </div>

            {/* Employee Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              <button
                onClick={() => setSelectedEmployee('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 border-2 font-bold transition-all text-xs sm:text-sm whitespace-nowrap ${selectedEmployee === 'all'
                  ? `${currentTheme.accent} text-white ${currentTheme.shadow} hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0`
                  : `${currentTheme.badge} hover:bg-black hover:text-white`
                  } ${selectedEmployee === 'all' ? `${currentTheme.borderColor}` : 'border-transparent'}`}
              >
                Semua
              </button>
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.name)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 border-2 font-bold transition-all text-xs sm:text-sm whitespace-nowrap ${selectedEmployee === emp.name
                    ? `${currentTheme.accent} text-white ${currentTheme.shadow} hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0`
                    : `${currentTheme.badge} hover:bg-black hover:text-white`
                    } ${selectedEmployee === emp.name ? `${currentTheme.borderColor}` : 'border-transparent'}`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Productivity Dashboard */}
        <div className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} p-4 sm:p-6`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`${currentTheme.accent} border-2 ${currentTheme.borderColor} p-2 sm:p-2.5`}>
              <TrendingUp className="text-white" size={18} />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold ${currentTheme.text}`}>PRODUCTIVITY DASHBOARD</h2>
              <p className={`text-[10px] sm:text-xs ${currentTheme.subtext}`}>Real-time task completion tracking</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredEmployees.map(emp => {
              const allTasks = [...emp.workTasks];
              const completed = allTasks.filter(t => t.completed).length;
              const inProgress = allTasks.filter(t => t.startTime && !t.endTime).length;
              const pending = allTasks.filter(t => !t.startTime && !t.completed).length;
              const completionRate = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;

              return (
                <div key={emp.id} className={`${currentTheme.badge} border-2 ${currentTheme.borderColor} p-4`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 ${currentTheme.accent} border-2 ${currentTheme.borderColor} flex items-center justify-center font-bold text-white text-sm`}>
                      {emp.name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-sm font-bold ${currentTheme.text}`}>{emp.name}</h3>
                      <p className={`text-xs ${currentTheme.subtext}`}>{completionRate}% selesai</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${currentTheme.accentText} flex items-center gap-1`}>
                        <CheckCircle size={12} /> Selesai
                      </span>
                      <span className={`font-semibold ${currentTheme.accentText}`}>{completed}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${currentTheme.accentText} flex items-center gap-1`}>
                        <Zap size={12} /> Progress
                      </span>
                      <span className={`font-semibold ${currentTheme.accentText}`}>{inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${currentTheme.accentText} flex items-center gap-1`}>
                        <Clock size={12} /> Pending
                      </span>
                      <span className={`font-semibold ${currentTheme.accentText}`}>{pending}</span>
                    </div>
                  </div>

                  <div className={`mt-3 ${currentTheme.progressTrack} border-2 ${currentTheme.borderColor} h-2 overflow-hidden`}>
                    <div
                      className={`${currentTheme.accent} h-full transition-all duration-500`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredEmployees.map(emp => (
          <div key={emp.id} className={`${currentTheme.card} border-2 ${currentTheme.borderColor} ${currentTheme.shadow} overflow-hidden`}>
            <div className={`bg-gradient-to-r ${currentTheme.header} p-5`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 border-4 ${currentTheme.borderColor} ${currentTheme.card} flex items-center justify-center font-bold ${currentTheme.text} text-lg`}>
                    {emp.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-white">{emp.name}</h2>
                      {emp.isAdmin && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentTheme.accentSoftBg} ${currentTheme.accentTextStrong} border ${currentTheme.accentSoftBorder}`}>
                          👑 Admin
                        </span>
                      )}
                      {emp.shift && (
                        <span className={`px-2 py-0.5 border-2 ${currentTheme.borderColor} text-xs font-bold ${emp.shift === 'pagi'
                          ? 'bg-yellow-200 text-black'
                          : 'bg-cyan-200 text-black'
                          }`}>
                          {emp.shift === 'pagi' ? '☀️ Pagi' : '🌙 Malam'}
                        </span>
                      )}
                      {emp.overtime && (
                        <span className={`px-2 py-0.5 border-2 ${currentTheme.borderColor} text-xs font-bold bg-fuchsia-100 text-fuchsia-800 animate-pulse`}>
                          ⚡ LEMBUR
                        </span>
                      )}
                      {emp.breakTime && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentTheme.accentSoftBg} ${currentTheme.accentTextStrong} border ${currentTheme.accentSoftBorder}`}>
                          ☕ Istirahat
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 font-bold">EMP-{emp.id.toString().padStart(3, '0')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {['hadir', 'telat', 'lembur', 'izin', 'libur', 'sakit', 'alpha']
                    .filter(s => !emp.isBackup || ['hadir', 'izin'].includes(s))
                    .map(s => (
                      <div key={s} className={`px-3 py-1.5 border-2 ${currentTheme.borderColor} text-xs font-bold ${emp.status === s ? 'bg-fuchsia-600 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : `${currentTheme.badge} ${currentTheme.subtext}`} cursor-not-allowed opacity-70`}>
                        {statusConfig?.[s]?.label || s}
                      </div>
                    ))}
                </div>
              </div>
              {emp.status === 'telat' && (
                <div className={`mt-3 flex items-center gap-2 ${currentTheme.accentSoftBg} border ${currentTheme.accentSoftBorder} rounded-lg p-2.5`}>
                  <AlertCircle className={currentTheme.accentTextStrong} size={16} />
                  <span className={`text-xs ${currentTheme.accentTextStrong}`}>Terlambat</span>
                  <input type="number" min="0" max="12" value={emp.lateHours} onChange={(e) => updateLateHours(emp.id, parseInt(e.target.value) || 0)} className={`w-16 px-2 py-1 rounded-md ${currentTheme.input} border ${currentTheme.borderColor} text-xs text-center focus:outline-none ${currentTheme.focusBorder}`} />
                  <span className={`text-xs ${currentTheme.accentTextStrong}`}>jam</span>
                </div>
              )}

              {/* Pause, Resume, Istirahat, Izin & End Shift */}
              {emp.checkedIn && (
                <>
                  <div className="mt-3 flex gap-2">
                    {/* Pause/Resume All Toggle Button */}
                    {Object.values(emp.workTasks || {}).some(t => t.paused && !t.completed) ? (
                      <button
                        onClick={() => resumeAllTasks(emp.id)}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 bg-green-500/20 border border-green-500/30 rounded-lg p-2.5 text-green-400 text-xs font-medium transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500/30 hover:scale-[1.01] active:scale-[0.99]'}`}
                      >
                        <Play size={16} />
                        Resume All
                      </button>
                    ) : (
                      <button
                        onClick={() => pauseAllTasks(emp.id)}
                        disabled={isProcessing || !emp.workTasks?.some(t => t.startTime && !t.completed && !t.paused)}
                        className={`flex-1 flex items-center justify-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-lg p-2.5 text-orange-400 text-xs font-medium transition-all ${isProcessing || !emp.workTasks?.some(t => t.startTime && !t.completed && !t.paused) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500/30 hover:scale-[1.01] active:scale-[0.99]'}`}
                      >
                        <Pause size={16} />
                        Pause All
                      </button>
                    )}

                    {!emp.breakTime && !emp.hasBreakToday ? (
                      <button
                        onClick={() => startBreak(emp.id)}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 ${currentTheme.primarySoftBg} border ${currentTheme.primarySoftBorder} rounded-lg p-2.5 ${currentTheme.primarySoftText} text-xs font-medium transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : `${currentTheme.primarySoftHover} hover:scale-[1.01] active:scale-[0.99]`
                          }`}
                      >
                        <Coffee size={16} />
                        Istirahat
                      </button>
                    ) : emp.breakTime ? (
                      <button
                        onClick={() => endBreak(emp.id)}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 ${currentTheme.primary} text-white border ${currentTheme.primarySoftBorder} rounded-lg p-2.5 text-xs font-medium transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : `${currentTheme.primaryHover} hover:scale-[1.01] active:scale-[0.99]`
                          }`}
                      >
                        <CheckCircle size={16} />
                        Selesai Istirahat
                      </button>
                    ) : (
                      <button
                        disabled
                        className={`flex-1 flex items-center justify-center gap-2 ${currentTheme.muted} border ${currentTheme.borderColor} rounded-lg p-2.5 ${currentTheme.mutedText} text-xs font-medium cursor-not-allowed`}
                      >
                        <Coffee size={16} />
                        Sudah Istirahat
                      </button>
                    )}

                    {!emp.izinTime ? (
                      <button
                        onClick={() => startIzin(emp.id)}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 ${currentTheme.primarySoftBg} border ${currentTheme.primarySoftBorder} rounded-lg p-2.5 ${currentTheme.primarySoftText} text-xs font-medium transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : `${currentTheme.primarySoftHover} hover:scale-[1.01] active:scale-[0.99]`
                          }`}
                      >
                        <Bell size={16} />
                        Izin
                      </button>
                    ) : (
                      <button
                        onClick={() => endIzin(emp.id)}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-2 ${currentTheme.primary} text-white border ${currentTheme.primarySoftBorder} rounded-lg p-2.5 text-xs font-medium transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : `${currentTheme.primaryHover} hover:scale-[1.01] active:scale-[0.99]`
                          }`}
                      >
                        <CheckCircle size={16} />
                        Selesai Izin
                      </button>
                    )}

                    <button
                      onClick={() => endShift(emp.id)}
                      disabled={isProcessing}
                      className={`flex-1 flex items-center justify-center gap-2 ${currentTheme.primarySoftBg} border ${currentTheme.primarySoftBorder} rounded-lg p-2.5 ${currentTheme.primarySoftText} text-xs font-medium transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : `${currentTheme.primarySoftHover} hover:scale-[1.01] active:scale-[0.99]`
                        }`}
                    >
                      <Square size={16} />
                      End Shift
                    </button>
                  </div>

                  {/* Timer Display */}
                  {(emp.breakTime || emp.izinTime) && (
                    <div className="mt-2 text-xs text-center">
                      {emp.breakTime && (
                        <span className={currentTheme.accentTextStrong}>⏱️ Istirahat dimulai: {emp.breakTime}</span>
                      )}
                      {emp.izinTime && (
                        <span className={currentTheme.accentTextStrong}>⏱️ Izin: {emp.izinReason} (Mulai: {emp.izinTime})</span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-5">
              <div>
                {(() => {
                  const tasks = emp.workTasks;
                  const filtered = tasks.filter(t => showCompletedTasks || !t.completed);

                  return (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className={currentTheme.accentText} size={18} />
                        <h3 className={`text-base font-semibold ${currentTheme.text}`}>
                          Task Pekerjaan
                        </h3>
                      </div>

                      <div className="space-y-2.5 mb-3">
                        {filtered.map(task => (
                          <div
                            key={task.id}
                            className={`rounded-xl border ${priorityColors[task.priority].border} ${priorityColors[task.priority].bg} p-3 cursor-move hover:shadow-md transition-shadow`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, emp.id, 'work', task.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, emp.id, 'work', task.id)}
                          >
                            <div className="flex items-start justify-between mb-2.5">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <GripVertical size={14} className={`${currentTheme.mutedText} mt-0.5 flex-shrink-0`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs ${task.completed ? `${currentTheme.subtext} line-through opacity-60` : currentTheme.text} break-words font-medium`}>{task.task}</p>
                                  {task.createdAt && <p className={`text-xs ${currentTheme.subtext} mt-1`}>📝 {task.createdAt}</p>}
                                  {task.completedAt && <p className={`text-xs ${currentTheme.accentTextStrong} mt-1`}>✅ {task.completedAt}</p>}
                                  {task.startTime && !task.endTime && !task.paused && !task.isPaused && (
                                    <p className={`text-xs ${currentTheme.accentTextStrong} mt-1 flex items-center gap-1 font-semibold`}>
                                      <Clock size={10} />
                                      Running: {calculateElapsedTime(task.startTime)}
                                    </p>
                                  )}
                                  {task.isPaused && (
                                    <p className={`text-xs ${currentTheme.accentTextStrong} mt-1 flex items-center gap-1 font-semibold`}>
                                      <Coffee size={10} />
                                      Break - Progress: {task.progress}%
                                    </p>
                                  )}
                                  {task.paused && (
                                    <p className={`text-xs ${currentTheme.accentTextStrong} mt-1 flex items-center gap-1 font-semibold`}>
                                      <Pause size={10} />
                                      Paused: {task.pauseHistory?.[task.pauseHistory.length - 1]?.reason}
                                    </p>
                                  )}
                                  {task.duration && (
                                    <p className={`text-xs ${currentTheme.subtext} mt-1 flex items-center gap-1`}>
                                      <Clock size={10} />
                                      {task.startTime} - {task.endTime} ({task.duration})
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                <span className={`${priorityColors[task.priority].badge} text-white text-xs px-1.5 py-0.5 rounded-full`}>{task.priority}</span>
                                <button onClick={() => deleteTask(emp.id, 'work', task.id)} className={`${currentTheme.mutedText} ${currentTheme.accentTextHover} p-0.5`}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input type="range" min="0" max="100" value={task.progress} onChange={(e) => updateProgress(emp.id, 'work', task.id, e.target.value)} className={`flex-1 h-1.5 rounded-lg appearance-none ${currentTheme.progressTrack} cursor-pointer`} style={{ background: `linear-gradient(to right, ${currentTheme.accentHex} ${task.progress}%, rgba(255,255,255,0.0) ${task.progress}%)` }} />
                                <span className={`text-xs font-medium ${currentTheme.subtext} w-9 text-right`}>{task.progress}%</span>
                              </div>

                              <div className="flex gap-1.5">
                                <select value={task.priority} onChange={(e) => updatePriority(emp.id, 'work', task.id, e.target.value)} className={`text-xs px-2 py-1 rounded-md border ${currentTheme.borderColor} focus:outline-none ${currentTheme.focusBorder} ${currentTheme.input}`}>
                                  <option value="urgent">Urgent</option>
                                  <option value="high">High</option>
                                  <option value="normal">Normal</option>
                                  <option value="low">Low</option>
                                </select>
                                {!task.startTime ? (
                                  <button onClick={() => startTask(emp.id, 'work', task.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ${currentTheme.primary} text-white ${currentTheme.primaryHover} font-medium`}>
                                    <Play size={10} />
                                    Start
                                  </button>
                                ) : !task.endTime ? (
                                  <>
                                    {task.paused ? (
                                      <button onClick={() => resumeTask(emp.id, 'work', task.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ${currentTheme.primary} text-white ${currentTheme.primaryHover} font-medium`}>
                                        <Play size={10} />
                                        Resume
                                      </button>
                                    ) : (
                                      <button onClick={() => pauseTask(emp.id, 'work', task.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} ${currentTheme.primarySoftHover} font-medium border ${currentTheme.primarySoftBorder}`}>
                                        <Pause size={10} />
                                        Pause
                                      </button>
                                    )}
                                    {!task.onTaskBreak && (
                                      <button onClick={() => taskBreak(emp.id, 'work', task.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} ${currentTheme.primarySoftHover} font-medium border ${currentTheme.primarySoftBorder}`}>
                                        <Coffee size={10} />
                                        Break
                                      </button>
                                    )}
                                    {task.onTaskBreak && (
                                      <button onClick={() => resumeFromTaskBreak(emp.id, 'work', task.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ${currentTheme.primary} text-white ${currentTheme.primaryHover} font-medium`}>
                                        <Play size={10} />
                                        Lanjutkan
                                      </button>
                                    )}
                                    <button onClick={() => endTask(emp.id, 'work', task.id)} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md ${currentTheme.primarySoftBg} ${currentTheme.primarySoftText} ${currentTheme.primarySoftHover} font-medium border ${currentTheme.primarySoftBorder}`}>
                                      <Square size={10} />
                                      End
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-xs ${currentTheme.primarySoftText} px-2.5 py-1 ${currentTheme.primarySoftBg} border ${currentTheme.primarySoftBorder} rounded-md font-medium`}>✓ Done</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input type="text" placeholder="Task pekerjaan baru..." value={newTask[`${emp.id}-work`] || ''} onChange={(e) => setNewTask(prev => ({ ...prev, [`${emp.id}-work`]: e.target.value }))} onKeyPress={(e) => e.key === 'Enter' && addTask(emp.id, 'work')} className={`flex-1 px-3 py-2 rounded-lg border ${currentTheme.borderColor} focus:outline-none ${currentTheme.focusBorder} ${currentTheme.input} text-xs`} />
                        <button onClick={() => addTask(emp.id, 'work')} className={`${currentTheme.primary} text-white px-3 py-2 rounded-lg ${currentTheme.primaryHover} transition-colors`}>
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [
    employees,
    currentTheme,
    AttentionSection,
    selectedEmployee,
    newTask,
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
    addTask,
    setSelectedEmployee,
    setNewTask
  ]);

  return dashboardContent;
});

DashboardPage.displayName = 'DashboardPage';

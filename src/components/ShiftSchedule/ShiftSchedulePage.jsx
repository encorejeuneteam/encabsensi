import React, { useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { dbService } from '../../firebase';

/**
 * ShiftSchedulePage Component - FULL VERSION WITH ALL ORIGINAL LOGIC
 * 
 * Complete shift scheduling with:
 * - Weekly rotation system (2P1M / 1P2M patterns)
 * - Auto-generation based on libur status from attendance
 * - Fair distribution tracking (solo weeks, double shifts)
 * - Libur management with attendance calendar sync
 * - Week-based pagination with localStorage persistence
 */
export const ShiftSchedulePage = React.memo(({
  employees,
  currentTheme,
  shiftScheduleYear,
  setShiftScheduleYear,
  shiftScheduleMonth,
  setShiftScheduleMonth,
  shiftScheduleWeek,
  setShiftScheduleWeek,
  shiftScheduleData,
  setShiftScheduleData,
  currentWeekRef,
  hasLoadedInitialData,
  yearlyAttendance,
  setYearlyAttendance,
  monthNames,
  startSaveOperation,
  endSaveOperation
}) => {
  const regularKaryawan = useMemo(() => employees.filter(e => !e.isBackup).map(e => e.name), [employees]);
  const backupKaryawan = useMemo(() => employees.filter(e => e.isBackup).map(e => e.name), [employees]);
  const allKaryawan = useMemo(() => employees.map(e => e.name), [employees]);
  const karyawan = allKaryawan; // Keep alias for compatibility in some parts
  const daysInMonth = useMemo(() =>
    new Date(shiftScheduleYear, shiftScheduleMonth + 1, 0).getDate(),
    [shiftScheduleYear, shiftScheduleMonth]
  );

  // Calculate shift schedule (define first) - WEEKLY ROTATION FOR BETTER SLEEP
  const calculateShiftSchedule = React.useCallback((scheduleToCalculate, shouldSave = false) => {
    const stats = {};

    allKaryawan.forEach(k => {
      stats[k] = {
        libur: 0,
        pagi: 0,
        malam: 0,
        double: 0,
        weeksAsPagi: 0,    // Track weeks doing morning shift
        weeksAsMalam: 0,   // Track weeks doing night shift
        weeksAsDouble: 0   // Track weeks doing double shift
      };
    });

    // Group days by week (7 days per week)
    const weeks = [];
    for (let i = 0; i < scheduleToCalculate.length; i += 7) {
      weeks.push(scheduleToCalculate.slice(i, i + 7));
    }

    // Assign roles for each week
    const weeklyAssignments = [];

    weeks.forEach((week, weekIdx) => {
      // Count how many days each person has libur this week
      const liburDaysCount = {};
      allKaryawan.forEach(k => liburDaysCount[k] = 0);

      week.forEach(day => {
        if (day.libur !== 'Tidak Ada') {
          liburDaysCount[day.libur]++;
        }
      });

      // Only count regular employees for rotation availability
      const availableRegular = regularKaryawan.filter(k => liburDaysCount[k] < 4);
      const availableForWeek = availableRegular;

      // Determine roles based on available people
      let roles = {};

      if (availableForWeek.length === 3) {
        // 3 people: WEEKLY ROTATION - change solo person every week
        // Always use 2P1M pattern for consistent rotation

        // Find who has done FEWEST solo weeks (combining both pagi and malam solo)
        const soloStats = {};
        availableForWeek.forEach(p => {
          // Count total solo weeks (both morning and night)
          soloStats[p] = stats[p].weeksAsMalam + stats[p].weeksAsPagi;
        });

        let minSoloWeeks = Math.min(...availableForWeek.map(p => soloStats[p]));
        let candidatesForSolo = availableForWeek.filter(p => soloStats[p] === minSoloWeeks);

        // If multiple candidates, use week-based round-robin
        let soloPerson;
        if (candidatesForSolo.length > 1) {
          // Round-robin based on week index
          const rotationIndex = weekIdx % candidatesForSolo.length;
          // Sort candidates alphabetically for consistency
          candidatesForSolo.sort();
          soloPerson = candidatesForSolo[rotationIndex];
        } else {
          soloPerson = candidatesForSolo[0];
        }

        // Alternate between solo malam and solo pagi each week
        const pattern = weekIdx % 2 === 0 ? '2P1M' : '1P2M';

        if (pattern === '2P1M') {
          // Solo person gets malam, others get pagi
          roles[soloPerson] = 'malam';
          availableForWeek.filter(p => p !== soloPerson).forEach(p => {
            roles[p] = 'pagi';
          });

          stats[soloPerson].weeksAsMalam++;
          availableForWeek.filter(p => p !== soloPerson).forEach(p => {
            stats[p].weeksAsPagi++;
          });
        } else {
          // Solo person gets pagi, others get malam
          roles[soloPerson] = 'pagi';
          availableForWeek.filter(p => p !== soloPerson).forEach(p => {
            roles[p] = 'malam';
          });

          stats[soloPerson].weeksAsPagi++;
          availableForWeek.filter(p => p !== soloPerson).forEach(p => {
            stats[p].weeksAsMalam++;
          });
        }

      } else if (availableForWeek.length === 2) {
        // 2 people (Ariel & Robert): Simple rotation
        // Ariel Pagi, Robert Malam on even weeks, vice versa on odd weeks
        if (weekIdx % 2 === 0) {
          roles[availableForWeek[0]] = 'pagi';
          roles[availableForWeek[1]] = 'malam';
          stats[availableForWeek[0]].weeksAsPagi++;
          stats[availableForWeek[1]].weeksAsMalam++;
        } else {
          roles[availableForWeek[0]] = 'malam';
          roles[availableForWeek[1]] = 'pagi';
          stats[availableForWeek[0]].weeksAsMalam++;
          stats[availableForWeek[1]].weeksAsPagi++;
        }
      } else if (availableForWeek.length === 1) {
        // 1 person: Use Desta (if available) as backup for the other shift
        const regular = availableForWeek[0];
        roles[regular] = 'pagi';
        stats[regular].weeksAsPagi++;

        if (backupKaryawan.length > 0) {
          roles[backupKaryawan[0]] = 'malam';
          stats[backupKaryawan[0]].weeksAsMalam++;
        }
      } else {
        // No regular employees available? Use backup for everything
        if (backupKaryawan.length > 0) {
          roles[backupKaryawan[0]] = 'double';
          stats[backupKaryawan[0]].weeksAsDouble++;
        }
      }

      weeklyAssignments.push(roles);
    });

    // Apply weekly assignments to each day
    const newSchedule = scheduleToCalculate.map((row, idx) => {
      const weekIdx = Math.floor(idx / 7);
      const roles = weeklyAssignments[weekIdx] || {};

      const libur = row.libur;
      const available = allKaryawan.filter(k => k !== libur || libur === 'Tidak Ada');

      if (libur !== 'Tidak Ada') {
        stats[libur].libur++;
      }

      const updatedRow = { ...row };

      // Apply weekly role assignments
      const pagiPeople = [];
      const malamPeople = [];

      available.forEach(person => {
        const role = roles[person];

        if (role === 'pagi') {
          pagiPeople.push(person);
        } else if (role === 'malam') {
          malamPeople.push(person);
        } else if (role === 'double') {
          pagiPeople.push(person);
          malamPeople.push(person);
        }
      });

      // Special case: If someone is on leave, fill their gap with a backup
      if (libur !== 'Tidak Ada' && regularKaryawan.includes(libur)) {
        // A regular employee is on leave, assign backup to whatever they were supposed to do
        const backup = backupKaryawan[0];
        if (backup) {
          const originalRole = roles[libur]; // This comes from weeklyAssignments
          if (originalRole === 'pagi') pagiPeople.push(backup);
          else if (originalRole === 'malam') malamPeople.push(backup);
          else if (originalRole === 'double') {
            pagiPeople.push(backup);
            malamPeople.push(backup);
          }
        }
      }

      updatedRow.pagi = pagiPeople;
      updatedRow.malam = malamPeople;

      updatedRow.pagi.forEach(k => stats[k].pagi++);
      updatedRow.malam.forEach(k => stats[k].malam++);

      return updatedRow;
    });

    setShiftScheduleData(newSchedule);

    // ✅ SAVE: If requested (e.g., from manual regeneration)
    if (shouldSave) {
      if (startSaveOperation) startSaveOperation('Shift: Regenerate');
      dbService.saveShiftSchedule({
        month: shiftScheduleMonth,
        year: shiftScheduleYear,
        data: newSchedule
      })
        .then(() => console.log('✅ Schedule regenerated and saved to Firebase'))
        .catch(err => console.error('❌ Error saving regenerated schedule:', err))
        .finally(() => {
          if (endSaveOperation) endSaveOperation('Shift: Regenerate');
        });
    }
  }, [allKaryawan, regularKaryawan, backupKaryawan, setShiftScheduleData, shiftScheduleMonth, shiftScheduleYear, startSaveOperation, endSaveOperation]);

  // Generate schedule function (uses calculateShiftSchedule)
  const generateSchedule = React.useCallback((shouldSave = false) => {
    const startDate = new Date(shiftScheduleYear, shiftScheduleMonth, 1);
    const newSchedule = [];
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      let liburPerson = 'Tidak Ada';
      karyawan.forEach(name => {
        const attendanceData = yearlyAttendance[name]?.[shiftScheduleMonth]?.[i + 1];
        if (attendanceData && attendanceData.status === 'libur') {
          liburPerson = name;
        }
      });

      newSchedule.push({
        day: i + 1,
        date: currentDate.toLocaleDateString('id-ID'),
        dayName: dayNames[currentDate.getDay()],
        libur: liburPerson,
        pagi: [],
        malam: [],
        keterangan: ''
      });
    }

    calculateShiftSchedule(newSchedule, shouldSave);
  }, [shiftScheduleYear, shiftScheduleMonth, daysInMonth, karyawan, yearlyAttendance, calculateShiftSchedule]);

  // Auto-generate schedule when month changes or data is empty
  React.useEffect(() => {
    if (shiftScheduleData.length === 0 && hasLoadedInitialData.current) {
      const monthKey = `${shiftScheduleYear}-${shiftScheduleMonth}`;
      const lastGenerated = sessionStorage.getItem('lastGeneratedMonth');

      if (lastGenerated !== monthKey) {
        sessionStorage.setItem('lastGeneratedMonth', monthKey);
        setTimeout(() => generateSchedule(), 100);
      }
    }
  }, [shiftScheduleData.length, shiftScheduleMonth, shiftScheduleYear, hasLoadedInitialData, generateSchedule]);

  // Restore week position after Firebase update
  React.useEffect(() => {
    if (shiftScheduleData.length > 0 && currentWeekRef.current !== shiftScheduleWeek) {
      // If week was changed by Firebase update, restore it
      setShiftScheduleWeek(currentWeekRef.current);
    }
  }, [shiftScheduleData, currentWeekRef, shiftScheduleWeek, setShiftScheduleWeek]);

  // ✅ PERSIST: Validate saved week is within bounds
  React.useEffect(() => {
    const daysPerPage = 7;
    const totalPages = Math.ceil(daysInMonth / daysPerPage);

    // If saved week is out of bounds, reset to last valid week
    if (shiftScheduleWeek >= totalPages && totalPages > 0) {
      const lastWeek = totalPages - 1;
      console.log(`⚠️ Saved week ${shiftScheduleWeek} out of bounds, resetting to ${lastWeek}`);
      setShiftScheduleWeek(lastWeek);
      currentWeekRef.current = lastWeek;
      localStorage.setItem('shiftScheduleWeek', lastWeek.toString());
    }
  }, [daysInMonth, shiftScheduleWeek, setShiftScheduleWeek, currentWeekRef]);

  const currentWeekData = useMemo(() => {
    if (shiftScheduleData.length === 0) return [];
    const daysPerPage = 7;
    const startIdx = shiftScheduleWeek * daysPerPage;
    const endIdx = Math.min(startIdx + daysPerPage, daysInMonth);
    return shiftScheduleData.slice(startIdx, endIdx);
  }, [shiftScheduleData, shiftScheduleWeek, daysInMonth]);

  // Pagination
  const daysPerPage = 7;
  const totalPages = Math.ceil(daysInMonth / daysPerPage);
  const startIdx = shiftScheduleWeek * daysPerPage;
  const endIdx = Math.min(startIdx + daysPerPage, daysInMonth);

  const liburCount = React.useMemo(() =>
    shiftScheduleData.filter(d => d.libur !== 'Tidak Ada').length,
    [shiftScheduleData]
  );

  const updateLibur = React.useCallback((index, value) => {
    if (!shiftScheduleData[index]) return;

    // Create a copy of the current schedule with the updated libur for this specific day
    const newSchedule = shiftScheduleData.map((row, i) =>
      i === index ? { ...row, libur: value } : row
    );

    const oldLibur = shiftScheduleData[index].libur;
    const day = shiftScheduleData[index].day;

    // Update attendance calendar status
    let updatedYearlyAttendance;
    setYearlyAttendance(prev => {
      const updated = { ...prev };
      karyawan.forEach(name => {
        if (!updated[name]) updated[name] = {};
        if (!updated[name][shiftScheduleMonth]) updated[name][shiftScheduleMonth] = {};

        if (value === name && value !== 'Tidak Ada') {
          updated[name][shiftScheduleMonth][day] = {
            ...updated[name][shiftScheduleMonth][day],
            status: 'libur',
            lateHours: 0
          };
        } else if (oldLibur === name) {
          updated[name][shiftScheduleMonth][day] = {
            ...updated[name][shiftScheduleMonth][day],
            status: 'belum',
            lateHours: 0
          };
        }
      });
      updatedYearlyAttendance = updated;
      return updated;
    });

    // ✅ SMART RE-CALCULATION: 
    // instead of manual redistribution logic here, we call the centralized 
    // pattern-based calculator. This automatically handles Desta (backup) 
    // correctly: adding him if someone is libur, and removing him if everyone is back.
    calculateShiftSchedule(newSchedule, true);

    // Save attendance update separately
    if (startSaveOperation) startSaveOperation('Attendance: Sync Libur');
    dbService.saveYearlyAttendance(updatedYearlyAttendance)
      .finally(() => {
        if (endSaveOperation) endSaveOperation('Attendance: Sync Libur');
      });
  }, [shiftScheduleData, shiftScheduleMonth, shiftScheduleYear, karyawan, setYearlyAttendance, startSaveOperation, endSaveOperation, calculateShiftSchedule]);

  return (
    <div className="space-y-6 relative z-10">
      {/* Header with Navigation */}
      <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4 sm:p-6 relative z-20`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`bg-gradient-to-br from-blue-700 to-blue-500 p-2 sm:p-3 rounded-xl ${currentTheme.shadow}`}>
              <CalendarDays className="text-white w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.text}`}>Jadwal Shift</h2>
              <p className={`text-[10px] sm:text-sm ${currentTheme.subtext} mt-0.5 sm:mt-1`}>
                {karyawan.join(' • ')}
              </p>
            </div>
          </div>

          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 relative z-30">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear data first so new month will auto-generate
                  setShiftScheduleData([]);
                  setShiftScheduleWeek(0);
                  currentWeekRef.current = 0;
                  localStorage.setItem('shiftScheduleWeek', '0'); // ✅ PERSIST: Reset to week 0 when changing month
                  // Then change month
                  if (shiftScheduleMonth === 0) {
                    setShiftScheduleMonth(11);
                    setShiftScheduleYear(shiftScheduleYear - 1);
                  } else {
                    setShiftScheduleMonth(shiftScheduleMonth - 1);
                  }
                }}
                className={`p-1.5 sm:p-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all cursor-pointer relative z-30 hover:scale-[1.01] active:scale-[0.99]`}
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-2">
                {/* Manual Month Selection */}
                <select
                  value={shiftScheduleMonth}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Stop propagation
                    const newMonth = parseInt(e.target.value);
                    setShiftScheduleData([]); // Clear data to trigger regeneration
                    setShiftScheduleMonth(newMonth);
                    setShiftScheduleWeek(0); // Reset to first week
                  }}
                  className={`bg-transparent ${currentTheme.text} font-bold text-sm sm:text-lg focus:outline-none cursor-pointer appearance-none hover:bg-white/5 p-1 rounded`}
                  style={{ textAlignLast: 'center' }}
                >
                  {monthNames.map((m, i) => (
                    <option key={i} value={i} className="text-black">{m}</option>
                  ))}
                </select>

                {/* Year Selection */}
                <select
                  value={shiftScheduleYear}
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const newYear = parseInt(e.target.value);
                    setShiftScheduleData([]); // Clear data to trigger regeneration
                    setShiftScheduleYear(newYear);
                    setShiftScheduleWeek(0);
                  }}
                  className={`bg-transparent ${currentTheme.text} font-bold text-sm sm:text-lg focus:outline-none cursor-pointer appearance-none hover:bg-white/5 p-1 rounded`}
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return <option key={year} value={year} className="text-black">{year}</option>;
                  })}
                </select>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear data first so new month will auto-generate
                  setShiftScheduleData([]);
                  setShiftScheduleWeek(0);
                  currentWeekRef.current = 0;
                  localStorage.setItem('shiftScheduleWeek', '0'); // ✅ PERSIST: Reset to week 0 when changing month
                  // Then change month
                  if (shiftScheduleMonth === 11) {
                    setShiftScheduleMonth(0);
                    setShiftScheduleYear(shiftScheduleYear + 1);
                  } else {
                    setShiftScheduleMonth(shiftScheduleMonth + 1);
                  }
                }}
                className={`p-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all cursor-pointer relative z-30 hover:scale-[1.01] active:scale-[0.99]`}
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Regenerate Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('⚠️ Regenerasi akan menghapus jadwal kustom Anda di bulan ini. Lanjutkan?')) {
                  generateSchedule(true);
                }
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentTheme.badge} text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-all text-xs font-bold hover:scale-[1.02] active:scale-[0.98]`}
              title="Susun ulang jadwal bulan ini"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Regenerasi Jadwal</span>
            </button>
          </div>
        </div>

        {/* Week Pagination */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 relative z-30">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newWeek = Math.max(0, shiftScheduleWeek - 1);
                setShiftScheduleWeek(newWeek);
                currentWeekRef.current = newWeek; // Save to ref
                localStorage.setItem('shiftScheduleWeek', newWeek.toString()); // ✅ PERSIST: Save to localStorage
              }}
              disabled={shiftScheduleWeek === 0}
              className={`p-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer relative z-30 hover:scale-[1.01] active:scale-[0.99]`}
              title="Minggu Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <span className={`text-sm font-medium ${currentTheme.text} px-3`}>
              Minggu {shiftScheduleWeek + 1} dari {totalPages}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newWeek = Math.min(totalPages - 1, shiftScheduleWeek + 1);
                setShiftScheduleWeek(newWeek);
                currentWeekRef.current = newWeek; // Save to ref
                localStorage.setItem('shiftScheduleWeek', newWeek.toString()); // ✅ PERSIST: Save to localStorage
              }}
              disabled={shiftScheduleWeek >= totalPages - 1}
              className={`p-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer relative z-30 hover:scale-[1.01] active:scale-[0.99]`}
              title="Minggu Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={`text-sm ${currentTheme.subtext}`}>
            Hari {startIdx + 1}-{endIdx} dari {daysInMonth} • {liburCount} libur
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentWeekData.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className={`text-lg ${currentTheme.subtext}`}>Tidak ada data jadwal. Silakan generate jadwal terlebih dahulu.</p>
          </div>
        ) : (
          currentWeekData.map((row, idx) => {
            const actualIdx = startIdx + idx;
            const isDoubleShift = row.pagi.some(p => row.malam.includes(p));
            const doubleShiftPerson = isDoubleShift ? row.pagi.find(p => row.malam.includes(p)) : null;

            return (
              <div
                key={actualIdx}
                className={`${currentTheme.card} rounded-xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-4 transition-all hover:shadow-lg ${isDoubleShift ? 'border-blue-400/40 bg-blue-950/15' : ''
                  }`}
              >
                {/* Date Header */}
                <div className={`flex items-center justify-between mb-3 pb-3 border-b-2 ${currentTheme.borderColor}`}>
                  <div>
                    <div className={`text-2xl font-bold ${currentTheme.text}`}>{row.day}</div>
                    <div className={`text-xs ${currentTheme.subtext}`}>
                      {row.dayName}
                    </div>
                  </div>
                  <div className={`text-xs ${currentTheme.subtext}`}>{row.date}</div>
                </div>

                {/* Libur Selector - Button Group */}
                <div className="mb-3">
                  <label className={`text-xs font-semibold ${currentTheme.subtext} mb-1 block`}>
                    Libur:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => updateLibur(actualIdx, 'Tidak Ada')}
                      className={`px-2 py-1 text-[10px] rounded-md transition-all ${row.libur === 'Tidak Ada'
                        ? 'bg-blue-700 text-white font-bold'
                        : `${currentTheme.badge} ${currentTheme.text} hover:bg-white/5`
                        }`}
                    >
                      Tidak Ada
                    </button>
                    {employees.filter(e => !e.isBackup).map(emp => (
                      <button
                        key={emp.name}
                        type="button"
                        onClick={() => updateLibur(actualIdx, emp.name)}
                        className={`px-2 py-1 text-[10px] rounded-md transition-all ${row.libur === emp.name
                          ? 'bg-blue-600 text-white font-bold'
                          : `${currentTheme.badge} ${currentTheme.text} hover:bg-white/5`
                          }`}
                      >
                        {emp.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Pagi */}
                <div className="mb-3">
                  <label className={`text-[10px] font-semibold ${currentTheme.subtext} mb-1 block`}>
                    ☀️ Shift Pagi:
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {row.pagi.length > 0 ? (
                      row.pagi.map((k, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${doubleShiftPerson === k
                            ? `bg-blue-700 text-white ${currentTheme.shadow}`
                            : 'bg-blue-600 text-white'
                            }`}
                        >
                          {k}
                          {doubleShiftPerson === k && <span className="ml-1">⚡</span>}
                        </span>
                      ))
                    ) : (
                      <span className={`text-[10px] ${currentTheme.subtext} italic`}>-</span>
                    )}
                  </div>
                </div>

                {/* Shift Malam */}
                <div>
                  <label className={`text-[10px] font-semibold ${currentTheme.subtext} mb-1 block`}>
                    🌙 Shift Malam:
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {row.malam.length > 0 ? (
                      row.malam.map((k, i) => (
                        <span
                          key={i}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${doubleShiftPerson === k
                            ? `bg-blue-700 text-white ${currentTheme.shadow}`
                            : 'bg-blue-600 text-white'
                            }`}
                        >
                          {k}
                          {doubleShiftPerson === k && <span className="ml-1">⚡</span>}
                        </span>
                      ))
                    ) : (
                      <span className={`text-[10px] ${currentTheme.subtext} italic`}>-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div >
  );
});

ShiftSchedulePage.displayName = 'ShiftSchedulePage';

export default ShiftSchedulePage;

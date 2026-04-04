/* eslint-disable */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { dbService } from '../../supabase';
import { SHIFT_CONSTRAINTS } from '../../config';

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

  // ============================================================================
  // SHIFT SEPARATION CONSTRAINT HELPER
  // Uses SHIFT_CONSTRAINTS.separatedPairs from config (easy to modify)
  // ============================================================================
  const areSeparated = useCallback((personA, personB) => {
    return (SHIFT_CONSTRAINTS?.separatedPairs || []).some(
      ([a, b]) => (a === personA && b === personB) || (a === personB && b === personA)
    );
  }, []);

  // Check if a group of people contains any separated pair
  const containsSeparatedPair = useCallback((people) => {
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        if (areSeparated(people[i], people[j])) return true;
      }
    }
    return false;
  }, [areSeparated]);

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

        // ✅ SEPARATION CONSTRAINT: If separated pair exists, one of them MUST be solo
        // This ensures they are never on the same shift together
        let candidatesForSolo;

        // Check if any separated pair exists among available people
        const separatedInGroup = [];
        for (let i = 0; i < availableForWeek.length; i++) {
          for (let j = i + 1; j < availableForWeek.length; j++) {
            if (areSeparated(availableForWeek[i], availableForWeek[j])) {
              separatedInGroup.push([availableForWeek[i], availableForWeek[j]]);
            }
          }
        }

        if (separatedInGroup.length > 0) {
          // Force solo person to be one of the separated pair
          // This ensures the other one is paired with the non-separated person
          const [sep1, sep2] = separatedInGroup[0];
          const separatedCandidates = [sep1, sep2];

          // Fair rotation: pick who has fewest solo weeks among the separated pair
          const soloStats = {};
          separatedCandidates.forEach(p => {
            soloStats[p] = stats[p].weeksAsMalam + stats[p].weeksAsPagi;
          });

          const minSoloWeeks = Math.min(...separatedCandidates.map(p => soloStats[p]));
          const fairCandidates = separatedCandidates.filter(p => soloStats[p] === minSoloWeeks);

          // If both have same stats, use week-based round-robin
          if (fairCandidates.length > 1) {
            fairCandidates.sort();
            candidatesForSolo = [fairCandidates[weekIdx % fairCandidates.length]];
          } else {
            candidatesForSolo = fairCandidates;
          }
        } else {
          // No separation constraint — use original logic
          // Find who has done FEWEST solo weeks (combining both pagi and malam solo)
          const soloStats = {};
          availableForWeek.forEach(p => {
            soloStats[p] = stats[p].weeksAsMalam + stats[p].weeksAsPagi;
          });

          const minSoloWeeks = Math.min(...availableForWeek.map(p => soloStats[p]));
          candidatesForSolo = availableForWeek.filter(p => soloStats[p] === minSoloWeeks);

          if (candidatesForSolo.length > 1) {
            candidatesForSolo.sort();
            candidatesForSolo = [candidatesForSolo[weekIdx % candidatesForSolo.length]];
          }
        }

        const soloPerson = candidatesForSolo[0];

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

      // ✅ FIX: When someone on leave was solo on their shift, redistribute
      // Move 1 person from the 2-person shift to cover the empty shift
      if (libur !== 'Tidak Ada') {
        if (pagiPeople.length === 0 && malamPeople.length >= 2) {
          // Pagi empty, Malam has 2+ people → move 1 to Pagi
          // ✅ SEPARATION CONSTRAINT: Choose which person to move carefully
          let coverIdx = idx % malamPeople.length;
          let coverPerson = malamPeople[coverIdx];

          // Check if moving this person would leave a separated pair together
          const remainingMalam = malamPeople.filter((_, i) => i !== coverIdx);
          if (containsSeparatedPair(remainingMalam)) {
            // Try moving the other person instead
            for (let ci = 0; ci < malamPeople.length; ci++) {
              if (ci === coverIdx) continue;
              const testRemaining = malamPeople.filter((_, i) => i !== ci);
              if (!containsSeparatedPair(testRemaining)) {
                coverIdx = ci;
                coverPerson = malamPeople[ci];
                break;
              }
            }
          }

          pagiPeople.push(coverPerson);
          malamPeople.splice(coverIdx, 1);
        } else if (malamPeople.length === 0 && pagiPeople.length >= 2) {
          // Malam empty, Pagi has 2+ people → move 1 to Malam
          // ✅ SEPARATION CONSTRAINT: Choose which person to move carefully
          let coverIdx = idx % pagiPeople.length;
          let coverPerson = pagiPeople[coverIdx];

          // Check if moving this person would leave a separated pair together
          const remainingPagi = pagiPeople.filter((_, i) => i !== coverIdx);
          if (containsSeparatedPair(remainingPagi)) {
            // Try moving the other person instead
            for (let ci = 0; ci < pagiPeople.length; ci++) {
              if (ci === coverIdx) continue;
              const testRemaining = pagiPeople.filter((_, i) => i !== ci);
              if (!containsSeparatedPair(testRemaining)) {
                coverIdx = ci;
                coverPerson = pagiPeople[ci];
                break;
              }
            }
          }

          malamPeople.push(coverPerson);
          pagiPeople.splice(coverIdx, 1);
        }
      }

      updatedRow.pagi = pagiPeople;
      updatedRow.malam = malamPeople;

      updatedRow.pagi.forEach(k => stats[k].pagi++);
      updatedRow.malam.forEach(k => stats[k].malam++);

      return updatedRow;
    });

    setShiftScheduleData(newSchedule);

    // ✅ SAVE: If requested (e.g., from auto-generation)
    if (shouldSave) {
      if (startSaveOperation) startSaveOperation('Shift: Regenerate');
      const savePromise = dbService.saveShiftSchedule({
        month: shiftScheduleMonth,
        year: shiftScheduleYear,
        data: newSchedule
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Save timeout')), 10000)
      );
      Promise.race([savePromise, timeoutPromise])
        .then(() => console.log('✅ Schedule regenerated and saved to Firebase'))
        .catch(err => console.warn('⚠️ Schedule save failed (will retry later):', err.message))
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
      setTimeout(() => generateSchedule(true), 100);
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white/90">Jadwal Shift</h1>
          <p className="text-xs text-slate-400 mt-1">{karyawan.join(' · ')}</p>
        </div>

        {/* Month/Year nav */}
        <div className="flex items-center gap-2 relative z-30">
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShiftScheduleData([]); setShiftScheduleWeek(0); currentWeekRef.current = 0; localStorage.setItem('shiftScheduleWeek', '0'); if (shiftScheduleMonth === 0) { setShiftScheduleMonth(11); setShiftScheduleYear(shiftScheduleYear - 1); } else { setShiftScheduleMonth(shiftScheduleMonth - 1); } }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all">
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-1.5">
            <select value={shiftScheduleMonth} onChange={(e) => { e.preventDefault(); e.stopPropagation(); setShiftScheduleData([]); setShiftScheduleMonth(parseInt(e.target.value)); setShiftScheduleWeek(0); }}
              className="bg-transparent text-white/90 font-semibold text-sm focus:outline-none cursor-pointer appearance-none hover:bg-white/[0.04] p-1 rounded" style={{ textAlignLast: 'center' }}>
              {monthNames.map((m, i) => (<option key={i} value={i} className="text-black">{m}</option>))}
            </select>
            <select value={shiftScheduleYear} onChange={(e) => { e.preventDefault(); e.stopPropagation(); setShiftScheduleData([]); setShiftScheduleYear(parseInt(e.target.value)); setShiftScheduleWeek(0); }}
              className="bg-transparent text-white/90 font-semibold text-sm focus:outline-none cursor-pointer appearance-none hover:bg-white/[0.04] p-1 rounded">
              {[...Array(5)].map((_, i) => { const year = new Date().getFullYear() - 2 + i; return <option key={year} value={year} className="text-black">{year}</option>; })}
            </select>
          </div>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShiftScheduleData([]); setShiftScheduleWeek(0); currentWeekRef.current = 0; localStorage.setItem('shiftScheduleWeek', '0'); if (shiftScheduleMonth === 11) { setShiftScheduleMonth(0); setShiftScheduleYear(shiftScheduleYear + 1); } else { setShiftScheduleMonth(shiftScheduleMonth + 1); } }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-all">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 relative z-30">
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const nw = Math.max(0, shiftScheduleWeek - 1); setShiftScheduleWeek(nw); currentWeekRef.current = nw; localStorage.setItem('shiftScheduleWeek', nw.toString()); }} disabled={shiftScheduleWeek === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-20 transition-all">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-white/80 px-2">Minggu {shiftScheduleWeek + 1}/{totalPages}</span>
          <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const nw = Math.min(totalPages - 1, shiftScheduleWeek + 1); setShiftScheduleWeek(nw); currentWeekRef.current = nw; localStorage.setItem('shiftScheduleWeek', nw.toString()); }} disabled={shiftScheduleWeek >= totalPages - 1}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] disabled:opacity-20 transition-all">
            <ChevronRight size={14} />
          </button>
        </div>
        <span className="text-[11px] text-slate-500">Hari {startIdx + 1}–{endIdx} / {daysInMonth} · {liburCount} libur</span>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {currentWeekData.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <CalendarDays size={36} className="text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Tidak ada jadwal</p>
          </div>
        ) : (
          currentWeekData.map((row, idx) => {
            const actualIdx = startIdx + idx;
            const isDoubleShift = row.pagi.some(p => row.malam.includes(p));
            const doubleShiftPerson = isDoubleShift ? row.pagi.find(p => row.malam.includes(p)) : null;

            return (
              <div key={actualIdx}
                className={`bg-slate-900/40 backdrop-blur-sm rounded-xl border transition-all hover:border-white/[0.08] ${isDoubleShift ? 'border-amber-500/15 bg-amber-500/[0.02]' : 'border-white/[0.06]'} p-4`}>

                {/* Date */}
                <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/[0.06]">
                  <div>
                    <div className="text-xl font-bold text-white/90">{row.day}</div>
                    <div className="text-[10px] text-slate-500">{row.dayName}</div>
                  </div>
                  <span className="text-[10px] text-slate-500">{row.date}</span>
                </div>

                {/* Libur */}
                <div className="mb-3">
                  <label className="text-[10px] text-slate-500 mb-1 block">Libur</label>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" onClick={() => updateLibur(actualIdx, 'Tidak Ada')}
                      className={`px-2 py-1 text-[10px] rounded-md transition-all ${row.libur === 'Tidak Ada'
                        ? 'bg-slate-700/50 text-slate-300 ring-1 ring-white/[0.1] font-medium'
                        : 'text-slate-400 hover:bg-white/[0.04]'}`}>
                      Tidak Ada
                    </button>
                    {employees.filter(e => !e.isBackup).map(emp => (
                      <button key={emp.name} type="button" onClick={() => updateLibur(actualIdx, emp.name)}
                        className={`px-2 py-1 text-[10px] rounded-md transition-all ${row.libur === emp.name
                          ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 font-semibold'
                          : 'text-slate-400 hover:bg-white/[0.04]'}`}>
                        {emp.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Pagi */}
                <div className="mb-2.5">
                  <label className="text-[10px] text-slate-500 mb-1 block">☀️ Pagi</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {row.pagi.length > 0 ? row.pagi.map((k, i) => (
                      <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${doubleShiftPerson === k ? 'bg-amber-500/15 text-amber-300' : 'bg-blue-500/15 text-blue-300'}`}>
                        {k}{doubleShiftPerson === k && <span className="ml-0.5">⚡</span>}
                      </span>
                    )) : <span className="text-[10px] text-slate-600">—</span>}
                  </div>
                </div>

                {/* Shift Malam */}
                <div>
                  <label className="text-[10px] text-slate-500 mb-1 block">🌙 Malam</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {row.malam.length > 0 ? row.malam.map((k, i) => (
                      <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${doubleShiftPerson === k ? 'bg-amber-500/15 text-amber-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                        {k}{doubleShiftPerson === k && <span className="ml-0.5">⚡</span>}
                      </span>
                    )) : <span className="text-[10px] text-slate-600">—</span>}
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

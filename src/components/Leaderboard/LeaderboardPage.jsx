/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Trophy, Star, TrendingUp, Clock, CheckCircle, Eye } from 'lucide-react';

export const LeaderboardPage = ({
  employees,
  currentTheme,
  leaderboardPeriod,
  setLeaderboardPeriod,
  leaderboardTaskType,
  setLeaderboardTaskType,
  expandedLeaderboard,
  setExpandedLeaderboard
}) => {
  const now = new Date();
  const today = now.toLocaleDateString('id-ID');
  const todayDate = new Date().toDateString();

  // Fix: Create new Date objects to avoid mutation
  const weekStartDate = new Date();
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
  weekStartDate.setHours(0, 0, 0, 0);

  const monthStartDate = new Date();
  monthStartDate.setDate(1);
  monthStartDate.setHours(0, 0, 0, 0);

  const empStats = employees.map(e => {
    // Only work tasks now (cleaning tasks removed)
    let tasksByType = [];
    if (leaderboardTaskType === 'all' || leaderboardTaskType === 'work') {
      tasksByType = [...e.workTasks, ...(e.completedTasksHistory || [])];
    }

    const all = tasksByType;

    // Filter by period
    let filtered = all;
    const todayDate = new Date().toDateString();

    if (leaderboardPeriod === 'today') {
      filtered = all.filter(t => {
        if (!t.completed) return false;
        if (!t.completedAt) return false;
        const taskDate = new Date(t.completedAt).toDateString();
        return taskDate === todayDate;
      });
    } else if (leaderboardPeriod === 'week') {
      filtered = all.filter(t => {
        if (!t.completed) return false;
        if (!t.completedAt) return false;
        const taskDate = new Date(t.completedAt);
        return taskDate >= weekStartDate;
      });
    } else if (leaderboardPeriod === 'month') {
      filtered = all.filter(t => {
        if (!t.completed) return false;
        if (!t.completedAt) return false;
        const taskDate = new Date(t.completedAt);
        return taskDate >= monthStartDate;
      });
    } else if (leaderboardPeriod === 'total') {
      filtered = all.filter(t => t.completed);
    }

    const completed = filtered;
    const withDur = completed.filter(t => t.duration);
    let avgMin = 0;
    if (withDur.length > 0) {
      const total = withDur.reduce((sum, t) => {
        const d = t.duration;
        let min = 0;
        if (d.includes('j')) {
          const parts = d.split(' ');
          min = parseInt(parts[0].replace('j', '')) * 60 + (parts[1] ? parseInt(parts[1].replace('m', '')) : 0);
        } else {
          min = parseInt(d.replace('m', ''));
        }

        // Subtract pause/break time from total duration
        if (t.pauseHistory && t.pauseHistory.length > 0) {
          const pauseTime = t.pauseHistory.reduce((pauseSum, pause) => {
            if (pause.duration) {
              const pauseMin = parseInt(pause.duration.replace('m', ''));
              return pauseSum + pauseMin;
            }
            return pauseSum;
          }, 0);
          min = Math.max(0, min - pauseTime);
        }

        return sum + min;
      }, 0);
      avgMin = Math.round(total / withDur.length);
    }

    return {
      name: e.name,
      id: e.id,
      count: completed.length,
      avgMin,
      tasks: completed.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    };
  });

  const sorted = empStats.sort((a, b) => b.count - a.count || a.avgMin - b.avgMin);
  const medals = ['🥇', '🥈', '🥉'];

  const periodLabels = {
    today: 'Hari Ini',
    week: 'Minggu Ini',
    month: 'Bulan Ini',
    total: 'Total Keseluruhan'
  };

  const taskTypeLabels = {
    all: 'Semua Task',
    work: 'Task Kerja'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`${currentTheme.accent} p-3 rounded-xl`}>
            <Trophy className="text-white" size={24} />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${currentTheme.text}`}>Leaderboard</h1>
            <p className={`text-sm ${currentTheme.subtext}`}>Ranking produktivitas tim</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Period Filter */}
          <div className="flex gap-2">
            {['today', 'week', 'month', 'total'].map(period => (
              <button
                key={period}
                onClick={() => setLeaderboardPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${leaderboardPeriod === period
                  ? `${currentTheme.accent} ${currentTheme.accentHover} text-white ${currentTheme.shadow} hover:scale-[1.01] active:scale-[0.99]`
                  : `${currentTheme.badge} hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99]`
                  }`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>

          {/* Task Type Filter */}
          <div className="flex gap-2">
            {['all', 'work'].map(type => (
              <button
                key={type}
                onClick={() => setLeaderboardTaskType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${leaderboardTaskType === type
                  ? `${currentTheme.accent} ${currentTheme.accentHover} text-white ${currentTheme.shadow} hover:scale-[1.01] active:scale-[0.99]`
                  : `${currentTheme.badge} hover:bg-white/5 hover:scale-[1.01] active:scale-[0.99]`
                  }`}
              >
                {taskTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-4">
        {sorted.map((emp, idx) => {
          const isExpanded = expandedLeaderboard === emp.id;
          const medal = medals[idx] || `${idx + 1}.`;

          return (
            <div
              key={emp.id}
              className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-5 transition-all ${isExpanded ? `ring-2 ${currentTheme.ringAccent}` : ''
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="text-3xl font-bold w-12 text-center">
                    {medal}
                  </div>

                  {/* Name & Stats */}
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${currentTheme.text}`}>{emp.name}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className={`text-sm ${currentTheme.subtext} flex items-center gap-1`}>
                        <CheckCircle size={14} />
                        {emp.count} tasks selesai
                      </span>
                      {emp.avgMin > 0 && (
                        <span className={`text-sm ${currentTheme.subtext} flex items-center gap-1`}>
                          <Clock size={14} />
                          Avg: {emp.avgMin}m
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Star Rating */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= Math.min(5, Math.ceil(emp.count / 2))
                            ? `${currentTheme.accentText} ${currentTheme.accentFill}`
                            : 'text-slate-500'
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* Toggle Details */}
                <button
                  onClick={() => setExpandedLeaderboard(isExpanded ? null : emp.id)}
                  className={`ml-4 p-2 rounded-lg ${currentTheme.badge} hover:bg-white/5 transition-all hover:scale-[1.03] active:scale-[0.97]`}
                >
                  <Eye size={18} />
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && emp.tasks.length > 0 && (
                <div className={`mt-4 pt-4 border-t-2 ${currentTheme.borderColor}`}>
                  <h4 className={`text-sm font-bold ${currentTheme.text} mb-3`}>
                    Riwayat Task ({emp.tasks.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {emp.tasks.map((task, idx) => (
                      <div key={idx} className={`${currentTheme.badge} rounded-lg p-3`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`font-medium ${currentTheme.text}`}>{task.task}</p>
                            <div className="flex gap-3 mt-1 text-xs">
                              <span className={currentTheme.subtext}>
                                ✅ {new Date(task.completedAt).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {task.duration && (
                                <span className={currentTheme.subtext}>
                                  ⏱️ {task.duration}
                                </span>
                              )}
                              {task.pauseHistory && task.pauseHistory.length > 0 && (
                                <span className={currentTheme.accentTextStrong}>
                                  ⏸️ {task.pauseHistory.length} pause
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className={`${currentTheme.card} rounded-2xl ${currentTheme.shadow} border-2 ${currentTheme.borderColor} p-12 text-center`}>
          <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
          <p className={`text-lg font-medium ${currentTheme.subtext}`}>Belum ada data</p>
          <p className={`text-sm ${currentTheme.subtext} mt-2`}>
            Task yang diselesaikan akan muncul di sini
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;

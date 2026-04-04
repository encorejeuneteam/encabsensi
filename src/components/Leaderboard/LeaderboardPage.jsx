/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Trophy, Star, TrendingUp, Clock, CheckCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';

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

  const weekStartDate = new Date();
  weekStartDate.setDate(weekStartDate.getDate() - weekStartDate.getDay());
  weekStartDate.setHours(0, 0, 0, 0);

  const monthStartDate = new Date();
  monthStartDate.setDate(1);
  monthStartDate.setHours(0, 0, 0, 0);

  const empStats = employees.map(e => {
    let tasksByType = [];
    if (leaderboardTaskType === 'all' || leaderboardTaskType === 'work') {
      tasksByType = [...e.workTasks, ...(e.completedTasksHistory || [])];
    }

    const all = tasksByType;
    let filtered = all;
    const todayDate = new Date().toDateString();

    if (leaderboardPeriod === 'today') {
      filtered = all.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return new Date(t.completedAt).toDateString() === todayDate;
      });
    } else if (leaderboardPeriod === 'week') {
      filtered = all.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return new Date(t.completedAt) >= weekStartDate;
      });
    } else if (leaderboardPeriod === 'month') {
      filtered = all.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        return new Date(t.completedAt) >= monthStartDate;
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
        if (t.pauseHistory && t.pauseHistory.length > 0) {
          const pauseTime = t.pauseHistory.reduce((pauseSum, pause) => {
            if (pause.duration) return pauseSum + parseInt(pause.duration.replace('m', ''));
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
    total: 'Total'
  };

  // Medal background colors
  const medalBg = [
    'bg-amber-500/10 border-amber-500/15',
    'bg-slate-400/10 border-slate-400/15',
    'bg-orange-500/10 border-orange-500/15'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white/90">Leaderboard</h1>
          <p className="text-xs text-slate-400 mt-1">Ranking produktivitas tim</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex gap-1.5">
            {['today', 'week', 'month', 'total'].map(period => (
              <button
                key={period}
                onClick={() => setLeaderboardPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${leaderboardPeriod === period
                  ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
              >
                {periodLabels[period]}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {['all', 'work'].map(type => (
              <button
                key={type}
                onClick={() => setLeaderboardTaskType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${leaderboardTaskType === type
                  ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'}`}
              >
                {type === 'all' ? 'Semua' : 'Kerja'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="space-y-3">
        {sorted.map((emp, idx) => {
          const isExpanded = expandedLeaderboard === emp.id;
          const medal = medals[idx] || `${idx + 1}`;
          const maxCount = sorted[0]?.count || 1;
          const barWidth = maxCount > 0 ? (emp.count / maxCount) * 100 : 0;

          return (
            <div
              key={emp.id}
              className={`bg-slate-900/40 backdrop-blur-sm rounded-xl border transition-all ${isExpanded ? 'border-blue-500/20 ring-1 ring-blue-500/10' : 'border-white/[0.06]'}`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Rank */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold border ${medalBg[idx] || 'bg-slate-800/40 border-white/[0.06]'}`}>
                  {medal}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white/90">{emp.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <CheckCircle size={11} className="text-emerald-400" />
                      {emp.count} selesai
                    </span>
                    {emp.avgMin > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock size={11} />
                        Avg {emp.avgMin}m
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500/40 to-indigo-500/40 transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= Math.min(5, Math.ceil(emp.count / 2))
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'}
                    />
                  ))}
                </div>

                {/* Toggle */}
                <button
                  onClick={() => setExpandedLeaderboard(isExpanded ? null : emp.id)}
                  className="p-2 rounded-lg hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 transition-all"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && emp.tasks.length > 0 && (
                <div className="px-4 pb-4 pt-1 border-t border-white/[0.06]">
                  <h4 className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
                    Riwayat ({emp.tasks.length})
                  </h4>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
                    {emp.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-200 truncate">{task.task}</p>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-[10px] text-slate-500">
                              ✅ {new Date(task.completedAt).toLocaleString('id-ID', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            {task.duration && (
                              <span className="text-[10px] text-slate-500">⏱ {task.duration}</span>
                            )}
                            {task.pauseHistory && task.pauseHistory.length > 0 && (
                              <span className="text-[10px] text-amber-400/60">⏸ {task.pauseHistory.length}x</span>
                            )}
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
        <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/[0.06] p-12 text-center">
          <Trophy size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-sm text-slate-400">Belum ada data</p>
          <p className="text-xs text-slate-500 mt-1">Task yang diselesaikan akan muncul di sini</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;

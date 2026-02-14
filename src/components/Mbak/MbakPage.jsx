import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

export const MbakPage = ({ currentTheme, tasks, addTask, deleteTask, toggleTask }) => {
    const [newTaskText, setNewTaskText] = useState('');

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        addTask(newTaskText);
        setNewTaskText('');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className={`${currentTheme.card} rounded-2xl shadow-md border-2 ${currentTheme.borderColor} p-4 sm:p-6`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2.5 sm:p-3 rounded-xl shadow-lg">
                        <Sparkles className="text-white w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                        <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.text}`}>Mbak Page</h2>
                        <p className={`text-[10px] sm:text-sm ${currentTheme.subtext}`}>Manajemen task mandiri dan terpisah.</p>
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <div className={`${currentTheme.card} rounded-2xl shadow-md border-2 ${currentTheme.borderColor} p-4 sm:p-6`}>
                <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        placeholder="Tambah task baru untuk Mbak..."
                        className={`flex-1 px-4 py-2.5 sm:py-3 rounded-xl border-2 ${currentTheme.input} focus:outline-none focus:border-purple-500 transition-all font-medium text-sm`}
                    />
                    <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 sm:py-3 rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2 font-bold text-sm"
                    >
                        <Plus className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                        Tambah
                    </button>
                </form>
            </div>

            {/* Task Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Tasks */}
                <div className={`${currentTheme.card} rounded-2xl shadow-md border-2 ${currentTheme.borderColor} p-4 sm:p-6`}>
                    <h3 className={`text-base sm:text-lg font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}>
                        <Clock className="text-purple-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Task Aktif ({tasks.filter(t => !t.completed).length})
                    </h3>
                    <div className="space-y-3">
                        {tasks.filter(t => !t.completed).length === 0 ? (
                            <p className={`text-center py-6 sm:py-8 text-xs sm:text-sm ${currentTheme.subtext} italic`}>Tidak ada task aktif</p>
                        ) : (
                            tasks.filter(t => !t.completed).map(task => (
                                <div key={task.id} className={`${currentTheme.badge} rounded-xl p-3 sm:p-4 border-2 border-transparent hover:border-purple-500/30 transition-all group`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 sm:gap-3 flex-1">
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-purple-400 flex-shrink-0 hover:bg-purple-400/20 transition-all"
                                            />
                                            <div>
                                                <p className={`text-xs sm:text-sm font-bold ${currentTheme.text}`}>{task.task}</p>
                                                <p className={`text-[9px] sm:text-[10px] ${currentTheme.subtext} mt-1`}>🕒 {task.createdAt}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="text-slate-400 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Completed Tasks */}
                <div className={`${currentTheme.card} rounded-2xl shadow-md border-2 ${currentTheme.borderColor} p-4 sm:p-6`}>
                    <h3 className={`text-base sm:text-lg font-bold ${currentTheme.text} mb-4 flex items-center gap-2`}>
                        <CheckCircle className="text-green-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                        Selesai ({tasks.filter(t => t.completed).length})
                    </h3>
                    <div className="space-y-3">
                        {tasks.filter(t => t.completed).length === 0 ? (
                            <p className={`text-center py-6 sm:py-8 text-xs sm:text-sm ${currentTheme.subtext} italic`}>Belum ada task selesai</p>
                        ) : (
                            tasks.filter(t => t.completed).map(task => (
                                <div key={task.id} className={`${currentTheme.badge} rounded-xl p-3 sm:p-4 opacity-70 border-2 border-transparent transition-all group`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-2 sm:gap-3 flex-1">
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className="mt-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
                                            >
                                                <CheckCircle className="text-white w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            </button>
                                            <div>
                                                <p className={`text-xs sm:text-sm font-bold ${currentTheme.text} line-through`}>{task.task}</p>
                                                <p className={`text-[9px] sm:text-[10px] ${currentTheme.subtext} mt-1`}>✅ Selesai pada: {task.completedAt}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="text-slate-400 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

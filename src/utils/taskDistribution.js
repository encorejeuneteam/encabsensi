/**
 * Task Distribution Utilities
 * Handles task-related utilities (cleaning tasks feature removed)
 */

/**
 * Shuffle array with seed for consistent randomization
 * @param {Array} array - Array to shuffle
 * @param {number} seed - Seed for randomization
 * @returns {Array} Shuffled array
 */
export const shuffleWithSeed = (array, seed) => {
  const arr = [...array];
  let currentIndex = arr.length;

  const seededRandom = (max, s) => {
    const x = Math.sin(s++) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };

  while (currentIndex > 0) {
    const randomIndex = seededRandom(currentIndex, seed++);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }

  return arr;
};

/**
 * Calculate task completion percentage
 * @param {Array} tasks - Array of tasks
 * @returns {number} Completion percentage (0-100)
 */
export const getTaskCompletionRate = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.completed).length;
  return Math.round((completed / tasks.length) * 100);
};

/**
 * Get task priority color
 * @param {string} priority - Task priority
 * @returns {string} Tailwind color class
 */
export const getPriorityColor = (priority) => {
  const colors = {
    low: 'text-slate-300',
    medium: 'text-blue-300',
    high: 'text-blue-200',
    urgent: 'text-blue-100'
  };
  return colors[priority] || colors.medium;
};

/**
 * Get task priority badge color
 * @param {string} priority - Task priority
 * @returns {string} Tailwind badge color class
 */
export const getPriorityBadge = (priority) => {
  const badges = {
    low: 'bg-slate-800/60 text-slate-200 border border-white/10',
    medium: 'bg-blue-900/35 text-blue-200 border border-blue-500/20',
    high: 'bg-blue-800/45 text-blue-100 border border-blue-400/25',
    urgent: 'bg-blue-700/55 text-white border border-blue-300/30'
  };
  return badges[priority] || badges.medium;
};

/**
 * Sort tasks by priority
 * @param {Array} tasks - Array of tasks
 * @returns {Array} Sorted tasks
 */
export const sortTasksByPriority = (tasks) => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return [...tasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority] ?? 2;
    const bPriority = priorityOrder[b.priority] ?? 2;
    return aPriority - bPriority;
  });
};

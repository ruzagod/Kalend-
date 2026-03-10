import React from 'react';
import { useTasks } from '../context/TaskContext';
import { Star, Clock, Circle } from 'lucide-react';

export default function WeeklyOverview() {
    const { tasks, currentDate, setCurrentDate } = useTasks();

    // Helper to get Monday of the current week (based on currentDate)
    const getWeekDays = () => {
        const curr = new Date(currentDate);
        const day = curr.getDay(); // 0 (Sun) - 6 (Sat)
        // Adjust for Monday start (if day is 0/Sun, treat is as 7)
        const diff = curr.getDate() - (day === 0 ? 6 : day - 1);

        const monday = new Date(curr.setDate(diff));
        const days = [];

        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            days.push(nextDay.toISOString().split('T')[0]);
        }
        return days;
    };

    const weekDays = getWeekDays();

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('cs-CZ', { weekday: 'long' });
    };

    const getTasksForDay = (dateStr) => {
        return tasks.filter(t => t.date === dateStr);
    };

    return (
        <div className="weekly-overview mt-12 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Týdenní Přehled</h2>

            <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
                {weekDays.map(dayDate => {
                    const dayTasks = getTasksForDay(dayDate);
                    const isToday = dayDate === currentDate;

                    return (
                        <div
                            key={dayDate}
                            onClick={() => {
                                setCurrentDate(dayDate);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col min-h-[160px] relative overflow-hidden group
                                ${isToday
                                    ? 'bg-purple-900/20 border-2 border-purple-500 shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transform scale-105 z-10'
                                    : 'bg-[#1a1a1a]/40 border border-white/5 hover:bg-[#1a1a1a]/80 hover:border-purple-500/30 hover:-translate-y-1'
                                }`}
                        >
                            {/* Decorative glow for the active day */}
                            {isToday && <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none"></div>}

                            <div className="relative z-20">
                                <h3 className={`font-bold capitalize mb-1 ${isToday ? 'text-purple-300 text-lg' : 'text-gray-200 text-base group-hover:text-purple-300 transition-colors'}`}>
                                    {getDayName(dayDate)}
                                </h3>
                                <div className={`text-xs mb-4 font-medium ${isToday ? 'text-purple-200/90' : 'text-gray-400'}`}>
                                    {new Date(dayDate).getDate()}. {new Date(dayDate).getMonth() + 1}.
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 relative z-20">
                                {dayTasks.length === 0 && <span className="text-gray-400/70 text-xs italic block text-center mt-4">Prázdno</span>}
                                {dayTasks.slice(0, 4).map(task => ( // Show max 4 tasks to avoid overflow
                                    <div key={task.id} className={`text-[11px] px-2 py-1.5 rounded-lg border truncate font-medium
                                        ${task.completed ? 'opacity-60 line-through bg-gray-900 border-transparent text-gray-300' : ''} 
                                        ${!task.completed && task.type === 'priority' ? 'bg-red-950/50 border-red-500/40 text-red-200' :
                                            !task.completed && task.type === 'deadline' ? 'bg-orange-950/50 border-orange-500/40 text-orange-200' :
                                                !task.completed ? 'bg-blue-950/40 border-blue-500/30 text-blue-200' : ''}`}
                                    >
                                        <span className="opacity-80 mr-1">{task.type === 'priority' ? '🔥' : task.type === 'deadline' ? '⏰' : '•'}</span>
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > 4 && (
                                    <div className="text-[10px] text-center text-gray-400 mt-2 font-bold tracking-wider uppercase">
                                        + další {dayTasks.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

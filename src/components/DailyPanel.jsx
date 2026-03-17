import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTasks } from '../context/TaskContext';
import SmartInput from './SmartInput';
import EnergyMap from './EnergyMap';
import TaskItem from './TaskItem';
import SharePanel from './SharePanel';
import CalendarManager from './CalendarManager';
import { Star, Circle, Clock, LogOut } from 'lucide-react';

export default function DailyPanel() {
    const { tasks, toggleTask, enterFocusMode, currentDate, user } = useTasks();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error logging out:", error);
    };

    // Date formatting
    const dateObj = new Date(currentDate);
    const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'long' });
    const fullDate = dateObj.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
    const title = `${dayName} ${fullDate}`;

    // Filter tasks
    const todayTasks = tasks.filter(t => t.date === currentDate);
    const completedCount = todayTasks.filter(t => t.completed).length;
    const totalCount = todayTasks.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    // Bucketing Logic:
    // 1. Priority: Any active task marked as 'priority' or 'deadline', max 5
    const activeTasks = todayTasks.filter(t => !t.completed);
    const priorityTasks = activeTasks.filter(t => t.type === 'priority' || t.type === 'deadline').slice(0, 5);

    // 2. Plán Dne: All other active tasks that aren't in Priority
    const activeOtherTasks = activeTasks.filter(t => !priorityTasks.includes(t));

    // 3. Hotovo: Completed tasks for today
    const completedTasksList = todayTasks.filter(t => t.completed);

    return (
        <div className="daily-panel max-w-4xl mx-auto">
            {/* TOP BAR: Kalendáře + Sdílení + Logout */}
            <div className="flex justify-between items-start mb-6 gap-4">
                <CalendarManager />
                <div className="flex items-center gap-4">
                    <SharePanel />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/5 hover:bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/10 transition-colors text-sm font-medium text-red-400"
                    >
                        <LogOut size={18} />
                        <span>Odhlásit se</span>
                    </button>
                </div>
            </div>

            {/* HEADER: Datum + Progress */}
            <header className="mb-8">
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-4xl font-bold text-gray-100 capitalize">{title}</h2>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-[var(--accent-purple)]">{progress}%</span>
                        <span className="text-gray-300 text-sm block font-medium">hotovo</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-gray-900/50 rounded-full overflow-hidden mb-8 border border-white/5">
                    <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <SmartInput />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 🟥 Sekce 1: PRIORITY (RED) */}
                <section className="glass-panel p-6 rounded-2xl border-red-500/10 bg-gradient-to-b from-red-900/5 to-transparent">
                    <h3 className="text-xl font-bold text-red-400 mb-6 flex items-center gap-2 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(248,113,113,0.5)]">
                        <Star size={24} className="fill-red-400" /> Priority
                    </h3>
                    <div className="space-y-4">
                        {priorityTasks.length === 0 && <p className="text-red-400/60 text-sm italic text-center py-4">Žádné hořící termíny 🔥</p>}
                        {priorityTasks.map(task => (
                            <TaskItem key={task.id} task={task} variant="priority" />
                        ))}
                    </div>
                </section>

                {/* 🟨 Sekce 2: PLÁN DNE (ALL OTHER ACTIVE TASKS) */}
                <section className="glass-panel p-6 rounded-2xl border-yellow-500/10 bg-gradient-to-b from-yellow-900/5 to-transparent">
                    <h3 className="text-xl font-bold text-yellow-400 mb-6 flex items-center gap-2 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                        <Clock size={24} /> Plán dne
                    </h3>

                    <div className="space-y-3">
                        {activeOtherTasks.length === 0 && <p className="text-yellow-400/60 text-sm italic text-center py-4">Žádné další úkoly ✨</p>}

                        {/* Render tasks, optionally sorting by time if they have one */}
                        {activeOtherTasks.sort((a, b) => (a.time || '23:59').localeCompare(b.time || '23:59')).map(task => (
                            <div key={task.id} className="relative group/time">
                                <TaskItem task={task} variant={task.time ? 'timeline' : 'simple'} />
                            </div>
                        ))}

                        <div
                            onClick={() => document.getElementById('smart-input')?.focus()}
                            className="text-yellow-300/60 text-sm italic p-3 mt-4 text-center border border-dashed border-yellow-500/20 rounded-xl hover:bg-yellow-500/10 hover:text-yellow-200 transition-colors cursor-pointer"
                        >
                            + Rychlý úkol
                        </div>
                    </div>
                </section>

                {/* 🟩 Sekce 3: HOTOVO (COMPLETED) */}
                <section className="glass-panel p-6 rounded-2xl border-green-500/10 bg-gradient-to-b from-green-900/5 to-transparent flex flex-col">
                    <h3 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2 uppercase tracking-wider drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                        <Circle size={24} /> Hotovo
                    </h3>
                    <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                        {completedTasksList.length === 0 && <p className="text-green-400/60 text-sm italic text-center py-4 mt-auto">Zatím nic...</p>}
                        {completedTasksList.map(task => (
                            <TaskItem key={task.id} task={task} variant="simple" />
                        ))}
                    </div>
                </section>
            </div>

            <div className="mt-12">
                <EnergyMap />
            </div>
        </div >
    );
}

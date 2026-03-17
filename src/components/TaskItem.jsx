import React, { useState, useEffect, useRef } from 'react';
import { Star, Clock, CheckCircle, ArrowRight, Play, Calendar, X, ArrowUp, Trash2, BellRing } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export default function TaskItem({ task, variant = 'simple' }) {
    const { toggleTask, enterFocusMode, rescheduleTask, deleteTask } = useTasks();
    const [isExiting, setIsExiting] = useState(null); // 'left' or 'right'

    const [isUrgent, setIsUrgent] = useState(false);
    const hasNotified = useRef(false);

    useEffect(() => {
        if (task.completed || !task.time || !task.date) return;

        const checkUrgency = () => {
            const now = new Date();
            const taskDateTime = new Date(`${task.date}T${task.time}`);

            if (isNaN(taskDateTime.getTime())) return;

            const diffMs = taskDateTime - now;
            const diffMins = Math.floor(diffMs / 60000);

            // Within 1 hour and hasn't started yet
            if (diffMins > 0 && diffMins <= 60) {
                if (!isUrgent) setIsUrgent(true);

                if (!hasNotified.current) {
                    hasNotified.current = true;
                    if ('Notification' in window) {
                        if (Notification.permission === 'granted') {
                            new Notification("Blíží se úkol!", {
                                body: `Úkol "${task.title}" začíná za ${diffMins} minut.`,
                                icon: '/vite.svg'
                            });
                        } else if (Notification.permission !== 'denied') {
                            Notification.requestPermission().then(permission => {
                                if (permission === 'granted') {
                                    new Notification("Blíží se úkol!", {
                                        body: `Úkol "${task.title}" začíná za ${diffMins} minut.`,
                                        icon: '/vite.svg'
                                    });
                                }
                            });
                        }
                    }
                }
            } else {
                if (isUrgent) setIsUrgent(false);
                if (diffMins > 60) hasNotified.current = false;
            }
        };

        checkUrgency();
        const interval = setInterval(checkUrgency, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [task, isUrgent]);

    const handleComplete = (e) => {
        e.stopPropagation();
        setIsExiting('left'); // Trigger slide left animation
        setTimeout(() => {
            toggleTask(task.id);
            setIsExiting(null);
        }, 400);
    };

    const handleReschedule = (e) => {
        e.stopPropagation();
        setIsExiting('right'); // Trigger slide right animation
        setTimeout(() => {
            rescheduleTask(task.id);
            setIsExiting(null);
        }, 400);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        setIsExiting('left'); // Or standard fade out
        setTimeout(() => {
            deleteTask(task.id);
        }, 300); // Faster exit for delete
    };

    // Styles based on variant

    const getContainerStyle = () => {
        let base = "relative group rounded-xl p-4 mb-3 transition-all duration-300 border backdrop-blur-md ";

        if (task.completed) {
            return base + "bg-gray-900/30 border-gray-800 opacity-40 grayscale";
        }

        if (isUrgent) {
            base += "animate-[pulse_2s_ease-in-out_infinite] ";
            return base + "bg-red-950/40 border-red-500/50 hover:border-red-500/80 shadow-[0_0_20px_0_rgba(248,113,113,0.3)] hover:shadow-[0_0_25px_0_rgba(248,113,113,0.5)]";
        }

        switch (variant) {
            case 'priority': // YELLOW - Neon Glow
                return base + "bg-yellow-950/20 border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-[0_0_15px_-3px_rgba(250,204,21,0.2)]";
            case 'timeline': // GREEN - Neon Glow
                return base + "bg-green-950/20 border-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)]";
            default: // BLUE/Simple - Glass
                if (task.type === 'deadline') {
                    return base + "bg-green-950/20 border-green-500/20 hover:border-green-500/40 hover:bg-[#1a1a1a]/60";
                }
                return base + "bg-[#1a1a1a]/40 border-blue-400/10 hover:border-blue-400/30 hover:bg-[#1a1a1a]/60";
        }
    };

    // Animation Styles
    const getAnimationProps = () => {
        if (isExiting === 'left') return { transform: 'translateX(-120%)', opacity: 0 };
        if (isExiting === 'right') return { transform: 'translateX(120%)', opacity: 0 };
        return {};
    };

    return (
        <div
            className={getContainerStyle()}
            style={getAnimationProps()}
        >
            {/* Progress Bar / Swipe Hints (Visual Flair) */}
            {!task.completed && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            )}

            <div className="flex flex-col gap-3">
                {/* Header: Title & Actions */}
                <div className="flex justify-between items-start gap-3 w-full">
                    <div className="flex-1">
                        <h4 className={`font-medium leading-tight ${task.completed ? 'text-gray-400 line-through' : (isUrgent ? 'text-red-100 flex items-center gap-2' : 'text-gray-50')} ${variant === 'priority' ? 'text-lg' : 'text-base'}`}>
                            {isUrgent && <BellRing size={16} className="text-red-400 animate-pulse" />}
                            {task.title}
                        </h4>

                        {task.description && !task.completed && (
                            <p className="text-sm text-gray-400 mt-2 leading-relaxed whitespace-pre-wrap">
                                {task.description}
                            </p>
                        )}
                    </div>

                    {/* Actions - The "Buttons" requested */}
                    <div className="flex items-center gap-2 shrink-0">
                        {!task.completed ? (
                            <>
                                {/* Complete Action (Green) */}
                                <button
                                    onClick={handleComplete}
                                    className="group/btn p-2 rounded-lg bg-gray-800/50 hover:bg-green-500/20 text-gray-400 hover:text-green-400 border border-transparent hover:border-green-500/30 transition-all"
                                    title="Hotovo (Swipe Left)"
                                >
                                    <CheckCircle size={20} className="group-hover/btn:scale-110 transition-transform" />
                                </button>

                                {/* Reschedule Action (Orange) */}
                                <button
                                    onClick={handleReschedule}
                                    className="group/btn p-2 rounded-lg bg-gray-800/50 hover:bg-orange-500/20 text-gray-400 hover:text-orange-400 border border-transparent hover:border-orange-500/30 transition-all"
                                    title="Přesunout na zítra (Swipe Right)"
                                >
                                    <Calendar size={20} className="group-hover/btn:scale-110 transition-transform" />
                                </button>

                                {/* Delete Action (Red) */}
                                <button
                                    onClick={handleDelete}
                                    className="group/btn p-2 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
                                    title="Smazat úkol"
                                >
                                    <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                </button>

                                {/* Focus Action (Purple) */}
                                <button
                                    onClick={() => enterFocusMode(task)}
                                    className="group/btn p-2 rounded-lg bg-gray-800/50 hover:bg-purple-500/20 text-gray-400 hover:text-purple-400 border border-transparent hover:border-purple-500/30 transition-all"
                                    title="Focus Mode"
                                >
                                    <Play size={20} className="group-hover/btn:scale-110 transition-transform ml-0.5" />
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Delete Completed Action (Red) */}
                                <button
                                    onClick={handleDelete}
                                    className="p-2 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 mr-1"
                                    title="Smazat úkol"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <button
                                    onClick={() => toggleTask(task.id)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </>
                        )}

                    </div>
                </div>

                {/* Metadata Footer */}
                {!task.completed && (
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                        {task.time && variant !== 'timeline' && ( // Don't show time in timeline card if redundant, but user might want it
                            <span className="flex items-center gap-1.5 text-yellow-300 bg-yellow-900/40 px-2 py-0.5 rounded">
                                <Clock size={12} /> {task.time}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <ArrowRight size={12} /> {task.duration} min
                        </span>

                        {variant === 'priority' && <span className="text-yellow-400/80 ml-auto flex items-center gap-1"><Star size={10} fill="currentColor" /> Priorita</span>}
                        {task.type === 'deadline' && variant !== 'priority' && <span className="text-green-400/80 ml-auto flex items-center gap-1"><Clock size={10} /> Deadline</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

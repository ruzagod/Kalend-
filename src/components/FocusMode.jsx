import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { X, Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';

export default function FocusMode() {
    const { activeFocusTask, exitFocusMode, toggleTask } = useTasks();
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 min default
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(25 * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (!activeFocusTask) return null;

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 animate-fade-in">
            <button
                onClick={exitFocusMode}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <X size={32} className="text-gray-500" />
            </button>

            <div className="text-center max-w-2xl w-full">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-medium text-sm mb-6">
                    FOCUS MODE
                </span>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight">
                    {activeFocusTask.title}
                </h1>

                <div className="text-[8rem] font-mono font-bold text-gray-800 mb-12 tabular-nums tracking-tighter loading-none">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={toggleTimer}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                        {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                    </button>

                    <button
                        onClick={resetTimer}
                        className="w-14 h-14 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <RotateCcw size={24} />
                    </button>
                </div>

                <div className="mt-16">
                    <button
                        onClick={() => {
                            toggleTask(activeFocusTask.id);
                            exitFocusMode();
                        }}
                        className="px-8 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
                    >
                        <CheckCircle size={20} /> Hotovo, ukončit focus
                    </button>
                </div>
            </div>
        </div>
    );
}

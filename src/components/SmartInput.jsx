import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Send, Zap, Calendar, AlertCircle, Clock } from 'lucide-react';

export default function SmartInput() {
    const [input, setInput] = useState('');
    const { addTask, currentDate } = useTasks();

    // Manual overrides
    const [selectedTime, setSelectedTime] = useState(''); // New time state
    const [isAllDay, setIsAllDay] = useState(true); // Toggle for all-day
    const [urgency, setUrgency] = useState('normal'); // normal, priority, deadline
    const [description, setDescription] = useState(''); // New description state
    const [isExpanded, setIsExpanded] = useState(false);


    const handleSmartAdd = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Use current date context if no specific date selected, or the selected date
        let taskDate = selectedDate || currentDate;

        // Mock parsing logic
        let title = input;
        let type = urgency; // Use manual urgency if set
        let shape = 'circle';
        let time = null;
        let duration = 30;

        // 1. Detect priority (if not manually set to something else)
        if (urgency === 'normal' && (input.toLowerCase().includes('důležité') || input.includes('!'))) {
            type = 'priority';
            title = title.replace(/důležité|!/gi, '').trim();
        }

        // Determine shape based on type
        if (type === 'priority') shape = 'star';
        if (type === 'deadline') shape = 'triangle';
        if (type === 'normal') shape = 'circle';

        // 2. Detect duration (optional parsing)
        const durationMatch = input.match(/(\d+)\s*(min|h|hod)/i);
        if (durationMatch) {
            const val = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            if (unit.startsWith('h')) {
                duration = val * 60;
            } else {
                duration = val;
            }
        }

        // 3. Time logic
        // If user manually selected a time, use it
        if (!isAllDay && selectedTime) {
            time = selectedTime;
        } else {
            // Fallback to NLP parsing if not manually set
            const timeMatch = input.match(/(\d{1,2}:\d{2})/);
            if (timeMatch) {
                time = timeMatch[1];
            }
        }

        addTask({
            title: title,
            description: description.trim() || null,
            type,
            shape,
            time,
            duration,
            date: taskDate
        });

        setInput('');
        // Reset manual overrides
        setSelectedDate('');
        setSelectedTime('');
        setDescription('');
        setIsAllDay(true);
        setUrgency('normal');
        setIsExpanded(false);

    };

    return (
        <form onSubmit={handleSmartAdd} className="mb-8 relative z-20">
            <div
                className={`relative flex flex-col bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] transition-all ${isExpanded ? 'p-4' : 'p-2'}`}
            >
                <div className="flex items-center">
                    <div className="pl-3 text-purple-500">
                        <Zap size={24} />
                    </div>
                    <input
                        id="smart-input"
                        type="text"
                        value={input}
                        onFocus={() => setIsExpanded(true)}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Napiš úkol... (např. 'Dodělat prezentaci')"
                        className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-gray-200 text-lg placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2 font-medium"
                    >
                        <span>Přidat</span> <Send size={18} />
                    </button>
                </div>

                {/* Expanded controls */}
                {isExpanded && (
                    <div className="mt-3 pt-4 border-t border-[var(--border-color)] flex flex-col gap-4 animate-fade-in">

                        <div className="flex flex-wrap gap-4 items-center">
                            {/* Date Picker */}
                            <div className="flex items-center gap-2 bg-[#262626] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                                <Calendar size={16} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-sm text-gray-200 color-scheme-dark"
                                />
                            </div>

                            {/* Time Picker / All Day Toggle */}
                            <div className="flex items-center gap-2 bg-[#262626] px-3 py-1.5 rounded-lg border border-[var(--border-color)]">
                                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer pr-2 border-r border-[#404040]">
                                    <input
                                        type="checkbox"
                                        checked={isAllDay}
                                        onChange={(e) => {
                                            setIsAllDay(e.target.checked);
                                            if (e.target.checked) setSelectedTime('');
                                        }}
                                        className="accent-purple-500 rounded"
                                    />
                                    Celý den
                                </label>

                                {!isAllDay && (
                                    <>
                                        <Clock size={16} className="text-gray-400 ml-2" />
                                        <input
                                            type="time"
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm text-gray-200 color-scheme-dark"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description Field */}
                        <div className="bg-[#262626] rounded-lg border border-[var(--border-color)] overflow-hidden">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Podrobnější popis úkolu (volitelné)..."
                                rows="2"
                                className="w-full bg-transparent px-3 py-2 border-none outline-none text-sm text-gray-200 resize-none custom-scrollbar"
                            />
                        </div>

                        {/* Urgency Toggles */}

                        <div className="flex bg-[#262626] rounded-lg p-1 w-fit">
                            <button
                                type="button"
                                onClick={() => setUrgency('normal')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${urgency === 'normal' ? 'bg-[var(--bg-primary)] text-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Běžný
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrgency('priority')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${urgency === 'priority' ? 'bg-[var(--bg-primary)] text-red-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <AlertCircle size={14} /> Priorita
                            </button>
                            <button
                                type="button"
                                onClick={() => setUrgency('deadline')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${urgency === 'deadline' ? 'bg-[var(--bg-primary)] text-orange-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Clock size={14} /> Deadline
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {!isExpanded && (
                <div className="absolute -bottom-6 left-4 flex gap-4 text-xs text-gray-400 opacity-0 md:opacity-100 transition-opacity">
                    <span>💡 Tip: Klikni pro více možností</span>
                </div>
            )}
        </form>
    );
}

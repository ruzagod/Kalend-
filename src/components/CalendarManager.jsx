import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { supabase } from '../lib/supabaseClient';
import { Calendar as CalendarIcon, Plus, X, Loader2, Users } from 'lucide-react';

export default function CalendarManager() {
    const {
        calendars,
        activeCalendarId,
        setActiveCalendarId,
        fetchCalendars,
        user
    } = useTasks();

    // Extract username from pseudo-email
    const username = user?.email?.split('@')[0] || 'Uživatel';


    const [isCreating, setIsCreating] = useState(false);
    const [newCalName, setNewCalName] = useState('');
    const [isShared, setIsShared] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newCalName.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // 1. Create calendar
            const { data: calData, error: calError } = await supabase
                .from('calendars')
                .insert([{
                    name: newCalName.trim(),
                    owner_id: user.id,
                    is_shared: isShared
                }])
                .select()
                .single();

            if (calError) throw calError;

            // 2. Add owner to calendar_members
            const { error: memberError } = await supabase
                .from('calendar_members')
                .insert([{
                    calendar_id: calData.id,
                    user_id: user.id
                }]);

            if (memberError) throw memberError;

            setIsCreating(false);
            setNewCalName('');
            setIsShared(false);

            // Refresh calendars and select the new one
            await fetchCalendars();
            setActiveCalendarId(calData.id);

        } catch (err) {
            setError("Nepodařilo se vytvořit kalendář: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!calendars) return <div className="animate-pulse bg-white/5 h-12 rounded-xl"></div>;

    const activeCal = calendars.find(c => c.id === activeCalendarId);

    // Group calendars
    const myCalendars = calendars.filter(c => c.owner_id === user.id && !c.is_shared);
    const sharedCalendars = calendars.filter(c => c.is_shared);

    return (
        <div className="relative group/manager">
            {/* User Info Display */}
            <div className="absolute -top-6 left-1 text-xs text-gray-400 flex items-center gap-1.5 opacity-60">
                <Users size={12} /> Přihlášen jako: <strong className="text-gray-200">{username}</strong>
            </div>

            {/* Active Calendar Display */}
            <div className="flex items-center gap-3 bg-[#1a1a1a]/80 border border-white/10 px-4 py-3 rounded-2xl cursor-pointer hover:bg-[#222] transition-colors shadow-lg">
                <div className={`p-2 rounded-xl ${activeCal?.is_shared ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {activeCal?.is_shared ? <Users size={20} /> : <CalendarIcon size={20} />}
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Aktivní kalendář</p>
                    <p className="font-bold text-gray-100">{activeCal?.name || 'Načítání...'}</p>
                </div>
                <div className="text-gray-500 group-hover/manager:text-gray-300">▼</div>
            </div>

            {/* Dropdown / Menu */}
            <div className="absolute top-full left-0 right-0 mt-2 glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl z-50 opacity-0 invisible group-hover/manager:opacity-100 group-hover/manager:visible transition-all duration-200 origin-top w-72">
                <div className="max-h-80 overflow-y-auto space-y-4 p-2 custom-scrollbar">

                    {/* My Calendars Section */}
                    {myCalendars.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                                <CalendarIcon size={12} /> Moje kalendáře
                            </div>
                            <div className="space-y-1">
                                {myCalendars.map(cal => (
                                    <button
                                        key={cal.id}
                                        onClick={() => setActiveCalendarId(cal.id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${activeCalendarId === cal.id ? 'bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30' : 'hover:bg-white/5 text-gray-300 border border-transparent'}`}
                                    >
                                        <CalendarIcon size={16} className={activeCalendarId === cal.id ? 'text-purple-400' : 'text-gray-500'} />
                                        <span className="truncate">{cal.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shared Calendars Section */}
                    {sharedCalendars.length > 0 && (
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2 mt-2">
                                <Users size={12} /> Sdílené kalendáře
                            </div>
                            <div className="space-y-1">
                                {sharedCalendars.map(cal => (
                                    <button
                                        key={cal.id}
                                        onClick={() => setActiveCalendarId(cal.id)}
                                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${activeCalendarId === cal.id ? 'bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30' : 'hover:bg-white/5 text-gray-300 border border-transparent'}`}
                                    >
                                        <Users size={16} className={activeCalendarId === cal.id ? 'text-blue-400' : 'text-gray-500'} />
                                        <span className="truncate">{cal.name}</span>
                                        {cal.owner_id === user.id && <span className="ml-auto text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded">Vlastník</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 px-1">
                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Plus size={16} /> Vytvořit nový kalendář
                        </button>
                    ) : (
                        <form onSubmit={handleCreate} className="p-2 space-y-3 bg-black/40 rounded-xl border border-white/5 mt-1">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase">Nový kalendář</span>
                                <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
                            </div>

                            <input
                                type="text"
                                value={newCalName}
                                onChange={(e) => setNewCalName(e.target.value)}
                                placeholder="Název (např. Práce, Rodina)"
                                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                autoFocus
                                required
                            />

                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isShared}
                                    onChange={(e) => setIsShared(e.target.checked)}
                                    className="rounded border-white/20 bg-black/50 text-purple-500 focus:ring-purple-500/50"
                                />
                                Bude to sdílený kalendář
                            </label>

                            {error && <p className="text-[10px] text-red-400 leading-tight">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading || !newCalName.trim()}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-2 rounded-lg text-sm font-bold flex justify-center items-center transition-colors shadow-lg shadow-purple-900/20"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Vytvořit'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

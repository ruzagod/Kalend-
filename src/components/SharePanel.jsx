import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Share2, Mail, Check, UserPlus, Users, X, Loader2 } from 'lucide-react';

export default function SharePanel() {
    const { user, activeCalendarId, calendars } = useTasks();
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);
    const [error, setError] = useState(null);

    const activeCal = calendars?.find(c => c.id === activeCalendarId);
    const isOwner = activeCal?.owner_id === user?.id;

    useEffect(() => {
        if (isOpen && activeCalendarId && activeCal?.is_shared) {
            fetchMembers();
        }
    }, [isOpen, activeCalendarId, activeCal]);

    const fetchMembers = async () => {
        // Fetch users who are members of this calendar
        const { data, error } = await supabase
            .from('calendar_members')
            .select(`
                user_id,
                profiles:user_id ( username )
            `)
            .eq('calendar_id', activeCalendarId);

        if (error) {
            console.error("Error fetching members:", error);
        } else {
            setMembers(data || []);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const targetUsername = username.toLowerCase().trim();

        if (targetUsername === user?.user_metadata?.username) {
            setError("Nemůžete pozvat sami sebe.");
            setLoading(false);
            return;
        }

        try {
            // 1. Verify username exists
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', targetUsername)
                .single();

            if (profileError || !profile) {
                throw new Error("Uživatel s tímto jménem neexistuje.");
            }

            // 2. Check if already a member
            const existingMember = members.find(m => m.user_id === profile.id);
            if (existingMember) {
                throw new Error("Tento uživatel už je členem kalendáře.");
            }

            // 3. Add to calendar_members
            const { error: inviteError } = await supabase
                .from('calendar_members')
                .insert([{ calendar_id: activeCalendarId, user_id: profile.id }]);

            if (inviteError) throw inviteError;

            setUsername('');
            fetchMembers();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!activeCal?.is_shared) return null; // Only show on shared calendars


    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5 transition-colors text-sm font-medium"
            >
                <Users size={18} className="text-purple-400" />
                <span>Sdílení</span>
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-80 glass-panel p-6 rounded-2xl border border-purple-500/20 shadow-2xl z-50 bg-[#111]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Share2 size={20} className="text-purple-400" /> Pozvat ke sdílení
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {isOwner ? (
                        <form onSubmit={handleInvite} className="space-y-4 mb-6">
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Uživatelské jméno přítele"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-3 focus:border-purple-500 outline-none text-sm transition-all"
                                    required
                                />
                            </div>
                            <button
                                disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> Poslat pozvánku</>}
                            </button>
                        </form>
                    ) : (
                        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                            <p className="text-xs text-blue-400">Jste hostem tohoto kalendáře. Můžete upravovat úkoly, ale pozvánky může posílat jen majitel.</p>
                        </div>
                    )}

                    {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Členové kalendáře</h4>
                        {members.length === 0 ? (
                            <p className="text-gray-600 text-xs italic">Zatím nikoho nepozval...</p>
                        ) : (
                            members.map(member => (
                                <div key={member.user_id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                    <span className="text-xs text-gray-300 truncate max-w-[140px]">
                                        {member.profiles?.username || 'Neznámý uživatel'}
                                        {member.user_id === user?.id && " (Vy)"}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            )}
        </div>
    );
}

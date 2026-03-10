import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Share2, Mail, Check, UserPlus, Users, X, Loader2 } from 'lucide-react';

export default function SharePanel({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [shares, setShares] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchShares();
        }
    }, [isOpen]);

    const fetchShares = async () => {
        const { data, error } = await supabase
            .from('calendar_shares')
            .select('*')
            .eq('owner_id', user.id);
        
        if (error) {
            console.error("Error fetching shares:", error);
        } else {
            setShares(data || []);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('calendar_shares')
                .insert([{ owner_id: user.id, shared_with_email: email, status: 'pending' }]);

            if (error) throw error;
            setEmail('');
            fetchShares();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

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

                    <form onSubmit={handleInvite} className="space-y-4 mb-6">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="E-mail přítele"
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

                    {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aktivní sdílení</h4>
                        {shares.length === 0 ? (
                            <p className="text-gray-600 text-xs italic">Zatím nikoho nepozval...</p>
                        ) : (
                            shares.map(share => (
                                <div key={share.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                    <span className="text-xs text-gray-300 truncate max-w-[140px]">{share.shared_with_email}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${share.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                        {share.status === 'accepted' ? 'Přijato' : 'Čeká'}
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

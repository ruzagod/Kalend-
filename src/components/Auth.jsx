import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [username, setUsername] = useState('');
    const [error, setError] = useState(null);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Normalize username: lowercase, no spaces
        const normalizedUsername = username.toLowerCase().trim().replace(/\s+/g, '');
        if (normalizedUsername.length < 3) {
            setError("Uživatelské jméno musí mít alespoň 3 znaky.");
            setLoading(false);
            return;
        }

        // We use a pseudo-email and a hardcoded secure password for Supabase Auth
        // This allows us to use Supabase without actually requiring users to input passwords/emails.
        const pseudoEmail = `${normalizedUsername}@energymap.local`;
        const defaultPassword = 'SecurePassword123!@#';

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email: pseudoEmail,
                    password: defaultPassword,
                    options: { data: { username: normalizedUsername } }
                });

                if (error) {
                    if (error.message.includes('already registered') || error.message.includes('User already registered') || error.status === 422) {
                        throw new Error("Toto uživatelské jméno už existuje. Zvolte prosím jiné.");
                    }
                    if (error.message.includes('Database error')) {
                        throw new Error("Chyba při vytváření profilu v databázi.");
                    }
                    throw new Error("Při registraci nastala chyba. Zkuste to prosím znovu.");
                }
                alert('Registrace proběhla úspěšně! Nyní jste přihlášeni.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: pseudoEmail,
                    password: defaultPassword
                });

                if (error) {
                    if (error.message.includes('Invalid login credentials')) {
                        throw new Error("Toto uživatelské jméno neexistuje. Zkuste se nejdříve zaregistrovat.");
                    }
                    throw new Error("Nepodařilo se přihlásit. Zkuste to prosím znovu.");
                }
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 font-sans text-gray-100">
            <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-purple-500/20 shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)] bg-gradient-to-b from-[#111] to-[#050505]">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <LogIn className="text-purple-400" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent italic">EnergyMap</h2>
                    <p className="text-gray-400 mt-2">{isSignUp ? 'Vytvořte si nový účet' : 'Přihlaste se ke svému kalendáři'}</p>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">Uživatelské jméno</label>
                        <div className="relative group">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[#1a1a1a]/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-600"
                                placeholder="např. jakub123"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-pulse">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : isSignUp ? (
                            <>
                                <UserPlus size={20} /> Registrovat se
                            </>
                        ) : (
                            <>
                                <LogIn size={20} /> Přihlásit se
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-gray-400 text-sm">
                        {isSignUp ? 'Již máte účet?' : 'Ještě nemáte účet?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors underline underline-offset-4 cursor-pointer"
                        >
                            {isSignUp ? 'Přihlaste se' : 'Zaregistrujte se'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

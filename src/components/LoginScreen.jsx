'use client';
import React, { useState, useContext } from 'react';
import Swal from 'sweetalert2';
import { AuthContext } from '../context/AuthContext';

const LoginScreen = () => {
    const { login } = useContext(AuthContext);
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(user, pass);
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: error.message || 'Usuario o contraseña incorrectos.',
                background: '#1e1e1e', 
                color: '#ffffff',
                confirmButtonColor: '#dc2626',
                confirmButtonText: 'Intentar de nuevo'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Fondo decorativo (Gradiente radial sutil) */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black opacity-80"></div>

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 animate-fade-in-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Marketing OS</h1>
                    <p className="text-slate-400 text-sm">Panel de Administración Enterprise</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Usuario
                        </label>
                        <input
                            type="text"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            placeholder="Ej. admin"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 px-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all transform active:scale-95 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Verificando...' : 'Acceder al Sistema'}
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-slate-600">
                    &copy; 2024 Secure System v2.0
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
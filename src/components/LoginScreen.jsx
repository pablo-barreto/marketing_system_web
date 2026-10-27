'use client';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Button, Field, inputClass } from './ui';

const LoginScreen = () => {
    const { login } = useContext(AuthContext);
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(user, pass);
        } catch (err) {
            setError(err.message || 'Usuario o contraseña incorrectos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-[#F5F6F8] px-4">
            <div className="w-full max-w-sm flex flex-col gap-6">
                <div className="flex items-center gap-3 justify-center">
                    <div aria-hidden="true" className="w-10 h-10 rounded-[10px] bg-blue-600 text-white flex items-center justify-center font-bold text-lg">M</div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-slate-900">Marketing OS</span>
                        <span className="text-xs text-slate-500">CR Consultores Colombia</span>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col gap-4">
                    <h1 className="m-0 text-xl font-bold text-slate-900">Iniciar sesión</h1>
                    <Field label="Usuario">
                        <input type="text" autoComplete="username" required value={user} onChange={(e) => setUser(e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Contraseña">
                        <input type="password" autoComplete="current-password" required value={pass} onChange={(e) => setPass(e.target.value)} className={inputClass} />
                    </Field>
                    {error && <p role="alert" className="m-0 text-sm text-red-700">{error}</p>}
                    <Button type="submit" variant="primary" size="lg" disabled={loading}>{loading ? 'Verificando…' : 'Entrar'}</Button>
                </form>
                <p className="m-0 text-center text-xs text-slate-500">La sesión dura 8 horas.</p>
            </div>
        </main>
    );
};

export default LoginScreen;

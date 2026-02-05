import React, { useState } from 'react';
import { Lock, X, Loader2, User } from 'lucide-react';
import { database } from '../services/database';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [validating, setValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidating(true);
    setErrorMsg('');
    
    try {
      await database.login(email, password);
      onSuccess();
      onClose();
      // Clear fields
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Login falhou. Verifique suas credenciais.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#7000e0] p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h2 className="font-medium">Login Administrador</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            Entre com sua conta Supabase para editar as configurações.
          </p>
          
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMsg(''); }}
                placeholder="seu@email.com"
                disabled={validating}
                className="w-full p-2 border border-gray-300 rounded outline-none focus:border-[#7000e0]"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                placeholder="••••••"
                disabled={validating}
                className="w-full p-2 border border-gray-300 rounded outline-none focus:border-[#7000e0]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs p-2 rounded mb-4 border border-red-100">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={validating}
            className="w-full bg-[#7000e0] hover:bg-[#5f00be] text-white font-medium py-2 rounded shadow-sm transition-colors uppercase text-sm tracking-wide flex items-center justify-center gap-2"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { CalculatorCard } from './components/CalculatorCard';
import { StoreLogo } from './components/StoreLogo';
import { database, supabase, KEYS } from './services/database';

const RateConfig = lazy(() => import('./components/RateConfig').then(module => ({ default: module.RateConfig })));
const PasswordModal = lazy(() => import('./components/PasswordModal').then(module => ({ default: module.PasswordModal })));

const App: React.FC = () => {
  const [view, setView] = useState<'calculator' | 'admin'>('calculator');
  const [customLogo, setCustomLogo] = useState<string | null>(() => database.getCachedLogo());
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const logoClickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  useEffect(() => {
    // Busca assíncrona que não bloqueia a UI
    database.getLogo().then(logo => {
      if (logo) setCustomLogo(logo);
    }).catch(() => { });

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      }).catch(() => { });

      const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      const channel = supabase.channel('logo-updates')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'istore_config' }, (payload) => {
          if (payload.new && typeof payload.new.logo !== 'undefined') {
            const newLogo = payload.new.logo || null;
            setCustomLogo(newLogo);
            if (newLogo) localStorage.setItem(KEYS.LOGO, newLogo);
            else localStorage.removeItem(KEYS.LOGO);
          }
        }).subscribe();

      return () => {
        supabase.removeChannel(channel);
        authListener.unsubscribe();
      };
    }
  }, []);

  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) logoClickCountRef.current += 1;
    else logoClickCountRef.current = 1;
    lastClickTimeRef.current = now;

    if (logoClickCountRef.current >= 5) {
      if (user) setView('admin');
      else setIsLoginModalOpen(true);
      logoClickCountRef.current = 0;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#b599d6] overflow-x-hidden">
      <div className="mb-8 relative flex items-center justify-center w-full max-w-[400px]">
        <div className="cursor-pointer select-none w-full flex justify-center" onClick={handleLogoClick}>
          {customLogo ? (
            <img src={customLogo} alt="Logo Customizado" className="h-24 max-w-full object-contain drop-shadow-md" />
          ) : (
            <StoreLogo />
          )}
        </div>
      </div>

      <Suspense fallback={<div className="text-white">Carregando...</div>}>
        {view === 'calculator' ? (
          <CalculatorCard onOpenAdminLogin={() => user ? setView('admin') : setIsLoginModalOpen(true)} />
        ) : (
          <RateConfig onBack={() => setView('calculator')} onLogout={() => { database.logout(); setView('calculator'); }} />
        )}

        <PasswordModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => setView('admin')}
        />
      </Suspense>
    </div>
  );
};

export default App;
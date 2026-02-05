import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://vycjtatixnebrmksmumq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DN_lZjiN_75PFbCnimXQHg_23aL5Bxg';

// Inicialização segura
let supabaseInstance: any = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn("Supabase load failed - running in offline mode.");
}

export const supabase = supabaseInstance;

export const KEYS = {
  RATES: 'istore_rates',
  LOGO: 'istore_custom_logo'
};

const DEFAULT_RATES: Record<number, number> = {
  1: 0, 2: 4.0, 3: 4.5, 4: 5.0, 5: 6.0, 6: 7.0, 
  10: 10.0, 12: 12.0, 18: 15.0
};

// Timeout para evitar travamentos de rede
const withTimeout = async <T>(promise: Promise<T> | any, ms: number = 2000): Promise<T> => {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Timeout')), ms);
  });
  
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const getConfigRowId = async (): Promise<number | null> => {
  if (!supabase) return null;
  try {
    const { data }: any = await withTimeout(supabase.from('istore_config').select('id').limit(1).maybeSingle());
    return data ? data.id : null;
  } catch {
    return null;
  }
};

export const database = {
  login: async (email: string, password: string) => {
    if (!supabase) throw new Error("Offline");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut();
  },

  isAuthenticated: async () => {
    if (!supabase) return false;
    try {
      const { data }: any = await withTimeout(supabase.auth.getSession());
      return !!data?.session;
    } catch {
      return false;
    }
  },

  updatePassword: async (newPassword: string) => {
    if (!supabase) return false;
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  },

  checkConnection: async (): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error }: any = await withTimeout(supabase.from('istore_config').select('id').limit(1));
      return !error;
    } catch {
      return false;
    }
  },

  getCachedRates: (): Record<number, number> => {
    try {
      const stored = localStorage.getItem(KEYS.RATES);
      return stored ? JSON.parse(stored) : DEFAULT_RATES;
    } catch {
      return DEFAULT_RATES;
    }
  },

  getRates: async (): Promise<Record<number, number>> => {
    const cached = database.getCachedRates();
    if (!supabase) return cached;
    try {
      const { data, error }: any = await withTimeout(supabase.from('istore_config').select('rates').limit(1).maybeSingle());
      if (!error && data?.rates) {
        localStorage.setItem(KEYS.RATES, JSON.stringify(data.rates));
        return data.rates;
      }
    } catch (e) {}
    return cached;
  },

  saveRates: async (rates: Record<number, number>) => {
    localStorage.setItem(KEYS.RATES, JSON.stringify(rates));
    if (!supabase) return { success: false, error: "Offline" };
    try {
      const currentId = await getConfigRowId();
      const res = currentId 
        ? await supabase.from('istore_config').update({ rates }).eq('id', currentId)
        : await supabase.from('istore_config').insert({ rates });
      return res.error ? { success: false, error: res.error.message } : { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  getCachedLogo: (): string | null => {
    try {
      return localStorage.getItem(KEYS.LOGO);
    } catch {
      return null;
    }
  },

  getLogo: async (): Promise<string | null> => {
    const local = database.getCachedLogo();
    if (!supabase) return local;
    try {
        const { data, error }: any = await withTimeout(supabase.from('istore_config').select('logo').limit(1).maybeSingle());
        if (!error && data?.logo) {
            localStorage.setItem(KEYS.LOGO, data.logo);
            return data.logo;
        }
    } catch (e) {}
    return local;
  },

  saveLogo: async (base64Image: string) => {
    localStorage.setItem(KEYS.LOGO, base64Image);
    if (!supabase) return { success: false, error: "Offline" };
    try {
      const currentId = await getConfigRowId();
      const res = currentId 
        ? await supabase.from('istore_config').update({ logo: base64Image }).eq('id', currentId)
        : await supabase.from('istore_config').insert({ logo: base64Image });
      return res.error ? { success: false, error: res.error.message } : { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  removeLogo: async () => {
    localStorage.removeItem(KEYS.LOGO);
    if (!supabase) return true;
    try {
      const currentId = await getConfigRowId();
      if (currentId) await supabase.from('istore_config').update({ logo: "" }).eq('id', currentId);
      return true;
    } catch {
      return false;
    }
  }
};
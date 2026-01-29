
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Chaves padrão para fallback inicial
const DEFAULT_URL = 'https://qiafgsigctmizdrgrdls.supabase.co';
const DEFAULT_KEY = 'sb_publishable_PUkC5A7ZPTKRhqRQsPEddA_1UQ26Jt8';

// Função para obter as credenciais salvas no LocalStorage
const getStoredCredentials = () => {
  try {
    const settingsStr = localStorage.getItem('govflow_local_settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      const url = settings.find((s: any) => s.key === 'supabase_url')?.value;
      const key = settings.find((s: any) => s.key === 'supabase_key')?.value;
      if (url && key) return { url, key };
    }
  } catch (e) {}
  return { url: DEFAULT_URL, key: DEFAULT_KEY };
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getStoredCredentials();
  
  // Validação básica para evitar erros de inicialização com strings vazias
  if (!url || !key || url.includes('exemplo.com')) return null;
  
  try {
    return createClient(url, key);
  } catch (e) {
    console.warn("Falha ao instanciar cliente Supabase:", e);
    return null;
  }
};

// Mantemos a exportação estática para compatibilidade, mas agora ela é uma função de conveniência
export const supabase = getSupabaseClient();
export const isSupabaseConfigured = !!supabase;


import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hook para gerenciar a inicialização e acesso ao cliente Supabase.
 * Retorna o cliente, se está configurado e se a inicialização foi concluída.
 */
export const useSupabaseClient = () => {
  const [isReady, setIsReady] = useState(false);
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    // Inicializa o cliente baseado na configuração estática do serviço
    if (isSupabaseConfigured && supabase) {
      setClient(supabase);
    }
    setIsReady(true);
  }, []);

  return {
    supabase: client,
    isConfigured: isSupabaseConfigured,
    isReady
  };
};

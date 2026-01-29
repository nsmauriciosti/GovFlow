import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Import process explicitly to ensure the cwd method is correctly typed in the Vite configuration environment
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env (incluindo as que não possuem prefixo VITE_)
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 3000,
      host: true
    }
  };
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Use named import for cwd to avoid potential type conflicts with the global process object in the Vite configuration environment
import { cwd } from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env (incluindo as que não possuem prefixo VITE_)
  const env = loadEnv(mode, cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 3000,
      host: true,
      allowedHosts: ['nota.mauriciosti.xyz']
    }
  };
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import the process object instead of a named 'cwd' export which may not be available in all Node.js environments
import process from 'node:process';

export default defineConfig(({ mode }) => {
  // Carrega variáveis do .env (incluindo as que não possuem prefixo VITE_)
  // Fix: Call process.cwd() instead of the removed named import
  const env = loadEnv(mode, process.cwd(), '');
  
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
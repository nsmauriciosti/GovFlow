
import { createClient } from '@supabase/supabase-js';

/**
 * INSTRUÇÕES PARA O SQL EDITOR DO SUPABASE:
 * 
 * CREATE TABLE IF NOT EXISTS users (
 *   id TEXT PRIMARY KEY,
 *   name TEXT,
 *   email TEXT UNIQUE,
 *   password TEXT,
 *   role TEXT,
 *   status TEXT,
 *   last_login TEXT
 * );
 * 
 * CREATE TABLE IF NOT EXISTS invoices (
 *   id TEXT PRIMARY KEY,
 *   secretaria TEXT,
 *   fornecedor TEXT,
 *   ne TEXT,
 *   nf TEXT,
 *   valor NUMERIC,
 *   vcto DATE,
 *   pgto DATE,
 *   situacao TEXT,
 *   history JSONB
 * );
 * 
 * CREATE TABLE IF NOT EXISTS import_errors (
 *   id TEXT PRIMARY KEY,
 *   date TIMESTAMPTZ DEFAULT now(),
 *   fileName TEXT,
 *   errorType TEXT,
 *   details TEXT,
 *   userEmail TEXT
 * );
 * 
 * ALTER TABLE users ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Permitir tudo para anon" ON users FOR ALL USING (true) WITH CHECK (true);
 * ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Permitir tudo para anon" ON invoices FOR ALL USING (true) WITH CHECK (true);
 * ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Permitir tudo para anon" ON import_errors FOR ALL USING (true) WITH CHECK (true);
 */

const supabaseUrl = 'https://qiafgsigctmizdrgrdls.supabase.co';
const supabaseAnonKey = 'sb_publishable_PUkC5A7ZPTKRhqRQsPEddA_1UQ26Jt8';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

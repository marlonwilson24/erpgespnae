import React from 'react';
import { GestaoUsuariosSection } from './GestaoUsuariosSection';

/**
 * Gestão de Usuários e Controle de Acesso (RBAC).
 * Delega para a GestaoUsuariosSection, que opera 100% via Supabase Auth
 * (serverless function com service role) — sem dados de demonstração.
 */
export const UsuariosManager: React.FC = () => {
  return <GestaoUsuariosSection />;
};

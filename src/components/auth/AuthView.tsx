import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { UserRole } from '../../types';
import { enviarLinkRecuperacao, traduzirErroAuth } from '../../lib/auth';
import {
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login } = usePNAE();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCarregando, setForgotCarregando] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCarregando(true);

    try {
      const resultado = await login(email, senha);
      if (!resultado.success) {
        setError(resultado.error || traduzirErroAuth(resultado.error || 'Falha na autenticação.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao autenticar.');
    } finally {
      setCarregando(false);
    }
  };

  const handleRecuperarSenha = async () => {
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Informe o e-mail cadastrado.');
      return;
    }
    setForgotCarregando(true);
    try {
      const resultado = await enviarLinkRecuperacao(forgotEmail.trim());
      if (resultado.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(resultado.error || 'Não foi possível enviar o link de recuperação.');
      }
    } catch {
      setForgotError('Erro inesperado ao enviar o link de recuperação.');
    } finally {
      setForgotCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-700 text-white shadow-md font-bold text-2xl mb-3">
          PN
        </div>
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          ERP PNAE - Alimentação Escolar
        </h2>
        <p className="text-sm text-stone-600 mt-1 flex items-center justify-center gap-1">
          <Building2 className="w-4 h-4 text-stone-400" />
          <span>Município de Santa Clara do Sul - RS</span>
          <span className="text-stone-300">•</span>
          <span>Lei nº 11.947/2009</span>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-stone-200/50 sm:rounded-2xl sm:px-10 border border-stone-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-stone-700">
                E-mail Institucional / Cadastrado
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="seu.email@santaclara.rs.gov.br"
                  className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-stone-700">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(email);
                    setForgotSuccess(false);
                    setForgotError('');
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2 border border-stone-300 rounded-xl text-sm placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 transition"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {carregando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando via Supabase...</span>
                </>
              ) : (
                <>
                  <span>Acessar Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-stone-500 font-medium">ou</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="mt-6 text-center text-xs text-stone-500 space-y-1">
          <p>Sistema em conformidade com o <strong>FNDE</strong> e Resolução CD/FNDE nº 06/2020.</p>
          <p>Controle de 30% da Agricultura Familiar e Teto de R$ 40 mil por DAP/CAF.</p>
        </div>
      </div>

      {/* Modal Esqueci a Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200">
            <h3 className="text-base font-bold text-stone-900">Recuperação de Senha</h3>
            <p className="text-xs text-stone-500 mt-1">
              Informe seu e-mail cadastrado no sistema municipal para receber as instruções de redefinição via Supabase Auth.
            </p>

            {forgotSuccess ? (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Link de recuperação enviado com sucesso para o seu e-mail!</span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="email"
                  placeholder="seu.email@santaclara.rs.gov.br"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                {forgotError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{forgotError}</span>
                  </div>
                )}
                <button
                  onClick={handleRecuperarSenha}
                  disabled={forgotCarregando}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {forgotCarregando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <span>Enviar Link de Recuperação</span>
                  )}
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-100 text-right">
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
                  setForgotError('');
                }}
                className="text-xs text-stone-500 hover:text-stone-800 font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { usePNAE } from '../../context/PNAEContext';
import { mockUsers } from '../../data/mockData';
import { UserRole } from '../../types';
import { 
  Shield, 
  Apple, 
  School, 
  Tractor, 
  Scale, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2,
  HelpCircle,
  Building2
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, switchRole } = usePNAE();
  const [email, setEmail] = useState('gestor.pnae@santaclara.rs.gov.br');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email);
    if (!success) {
      setError('E-mail não localizado no cadastro municipal. Selecione um perfil demonstrativo abaixo.');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    switchRole(role);
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
                  onClick={() => setShowForgotModal(true)}
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
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="block w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl text-sm placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition"
            >
              <span>Acessar Painel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divisor */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-stone-500 font-medium">
                  Ou acesse rapidamente por Perfil
                </span>
              </div>
            </div>

            {/* Quick Login Tiles */}
            <div className="mt-4 grid grid-cols-1 gap-2">
              {mockUsers.map(user => {
                const getRoleIcon = (role: UserRole) => {
                  switch (role) {
                    case 'ADMIN': return <Shield className="w-4 h-4 text-emerald-700" />;
                    case 'NUTRICIONISTA': return <Apple className="w-4 h-4 text-teal-700" />;
                    case 'ESCOLA': return <School className="w-4 h-4 text-blue-700" />;
                    case 'FORNECEDOR': return <Tractor className="w-4 h-4 text-amber-700" />;
                    case 'CAE': return <Scale className="w-4 h-4 text-indigo-700" />;
                  }
                };

                return (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user.role)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-stone-100 group-hover:bg-white transition">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{user.name}</p>
                        <p className="text-[11px] text-stone-500">{user.cargo || user.role}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                      Entrar →
                    </span>
                  </button>
                );
              })}
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
                  defaultValue={email}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                <button
                  onClick={() => setForgotSuccess(true)}
                  className="w-full py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
                >
                  Enviar Link de Recuperação
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-100 text-right">
              <button
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSuccess(false);
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Car, Mail, Lock, User, Phone, CheckCircle, ArrowRight, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AuthScreen: React.FC = () => {
  const { loginEmail, registerEmail, recoverPassword, authError, resetSent } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [isRecover, setIsRecover] = useState(false);
  
  // Forms states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setLoadingLocal(true);

    try {
      if (isRecover) {
        if (!email) {
          setErrorLocal("Por favor, introduza o seu email.");
          setLoadingLocal(false);
          return;
        }
        await recoverPassword(email);
      } else if (isRegister) {
        if (!email || !password || !nome || !telefone) {
          setErrorLocal("Todos os campos de registo são obrigatórios.");
          setLoadingLocal(false);
          return;
        }
        if (password.length < 6) {
          setErrorLocal("A palavra-passe deve ter pelo menos 6 caracteres.");
          setLoadingLocal(false);
          return;
        }
        await registerEmail(email, password, nome, telefone);
      } else {
        if (!email || !password) {
          setErrorLocal("Por favor, preencha o email e a palavra-passe.");
          setLoadingLocal(false);
          return;
        }
        await loginEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setErrorLocal(err.message || "Ocorreu um erro. Verifique os dados introduzidos.");
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="absolute top-4 right-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-full flex items-center shadow-sm">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-2"></span>
        Modo Demonstração Ativo (Testes Rápidos!)
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Car className="h-9 w-9 stroke-[2]" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Crianças à Boleia
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Boleias partilhadas e seguras entre pais da mesma escola ou atividade
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 rounded-2xl sm:px-10">
          <AnimatePresence mode="wait">
            {isRecover ? (
              <motion.div
                key="recover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <h3 className="text-lg font-medium text-slate-900 mb-4">Recuperar Palavra-passe</h3>
                {resetSent ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm mb-6 flex items-start">
                    <CheckCircle className="h-5 w-5 mr-3 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Email de recuperação enviado!</p>
                      <p className="mt-1">Se este email estiver registado, receberá instruções para redefinir a palavra-passe em instantes.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="recover-email" className="block text-sm font-medium text-slate-700">
                        Endereço de Email
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <input
                          id="recover-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="exemplo@email.com"
                          className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {(errorLocal || authError) && (
                      <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                        {errorLocal || authError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loadingLocal}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loadingLocal ? "A enviar..." : "Enviar Email de Recuperação"}
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <button
                    onClick={() => { setIsRecover(false); setErrorLocal(null); }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </motion.div>
            ) : isRegister ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Registar Nova Conta</h3>
                  <button
                    onClick={() => { setIsRegister(false); setErrorLocal(null); }}
                    className="text-xs text-blue-600 font-semibold"
                  >
                    Já tenho conta
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="reg-nome" className="block text-sm font-medium text-slate-700">
                      Nome Completo
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        id="reg-nome"
                        type="text"
                        required
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome Sobrenome"
                        className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700">
                      Endereço de Email
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ritacampina@gmail.com"
                        className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-telef" className="block text-sm font-medium text-slate-700">
                      Telemóvel (Portugal)
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        id="reg-telef"
                        type="tel"
                        required
                        placeholder="911 223 344"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-pass" className="block text-sm font-medium text-slate-700">
                      Palavra-passe (mínimo 6 chars)
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        id="reg-pass"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {(errorLocal || authError) && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                      {errorLocal || authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingLocal}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loadingLocal ? "A registar..." : "Registar e Iniciar Sessão"}
                  </button>
                </form>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-center flex items-center justify-center text-xs text-slate-500">
                  <Shield className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                  Os seus dados estão seguros e ficam estritamente confidenciais.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Iniciar Sessão</h3>
                  <button
                    onClick={() => { setIsRegister(true); setErrorLocal(null); }}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Criar nova conta
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
                      Endereço de Email
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        id="login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ritacampina@gmail.com"
                        className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <label htmlFor="login-pass" className="block text-sm font-medium text-slate-700">
                        Palavra-passe
                      </label>
                      <button
                        type="button"
                        onClick={() => { setIsRecover(true); setErrorLocal(null); }}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Esqueceu-se?
                      </button>
                    </div>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        id="login-pass"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  {(errorLocal || authError) && (
                    <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-3 rounded-lg">
                      {errorLocal || authError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingLocal}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loadingLocal ? "A aceder..." : "Entrar de Forma Segura"}
                  </button>
                </form>

                <div className="mt-6 flex flex-col space-y-3">
                  <div className="text-xs text-slate-500 text-center">
                    Demonstração imediata pré-preenchida com email de teste.
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
                    <span>Acesso rápido sugerido:</span>
                    <button 
                      onClick={() => {
                        setEmail("ritacampina@gmail.com");
                        setPassword("123456");
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 text-blue-600 rounded hover:bg-blue-50 font-semibold"
                    >
                      Preencher Rita
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

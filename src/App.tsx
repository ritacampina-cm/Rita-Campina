/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Agenda } from './components/Agenda';
import { Pedidos } from './components/Pedidos';
import { Notificacoes } from './components/Notificacoes';
import { Grupo } from './components/Grupo';
import { Perfil } from './components/Perfil';
import { Sparkles, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { currentUser, loading } = useApp();
  const [activeTab, setActiveTab] = useState<string>('inicio');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Quick navigation helpers linking Dashboard prompts to the ride manager forms
  const handleOpenCreateModalDirectly = () => {
    setActiveTab('pedidos');
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="space-y-4 text-center">
          <div className="relative">
            <div className="h-12 w-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">🚗</div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Crianças à Boleia</p>
            <p className="text-xs text-slate-400">A carregar rotas escolares...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Authentication check
  if (!currentUser) {
    return <AuthScreen />;
  }

  // Active view router
  const renderActiveView = () => {
    switch (activeTab) {
      case 'inicio':
        return <Dashboard setActiveTab={setActiveTab} openCreateModalDirectly={handleOpenCreateModalDirectly} />;
      case 'agenda':
        return <Agenda />;
      case 'pedidos':
        return <Pedidos isCreateModalOpen={isCreateModalOpen} setCloseCreateModal={handleCloseCreateModal} />;
      case 'notificacoes':
        return <Notificacoes />;
      case 'grupo':
        return <Grupo />;
      case 'perfil':
        return <Perfil />;
      default:
        return <Dashboard setActiveTab={setActiveTab} openCreateModalDirectly={handleOpenCreateModalDirectly} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-blue-100">
      
      {/* Dynamic top bar navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderActiveView()}
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

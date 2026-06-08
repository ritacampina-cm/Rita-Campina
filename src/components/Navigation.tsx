/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Calendar, Car, Bell, Users, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { getInitials } from '../utils/initials';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, logout, notifications, isFirebaseActive } = useApp();
  const unreadCount = notifications.filter(n => !n.lida && n.userId === currentUser?.id).length;

  const navItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'pedidos', label: 'Pedidos', icon: Car },
    { id: 'notificacoes', label: 'Notificações', icon: Bell, badge: unreadCount },
    { id: 'grupo', label: 'Famílias', icon: Users },
    { id: 'perfil', label: 'O Meu Perfil', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
            <Car className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Crianças à Boleia</h1>
            <p className="text-xs text-slate-500 font-medium">Boleias escolares partilhadas</p>
          </div>
        </div>

        {/* Central tabs */}
        <nav className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full scale-90 border border-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User profile dropdown and status */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-slate-900">{currentUser?.nome}</span>
            <span className="text-xs font-medium text-slate-500">{currentUser?.telefone || 'Sem telemóvel'}</span>
          </div>

          {currentUser?.foto ? (
            <img
              src={currentUser.foto}
              alt={currentUser.nome}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-xl object-cover ring-2 ring-blue-500/10"
            />
          ) : (
            <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center border border-blue-200">
              {getInitials(currentUser?.nome || '')}
            </div>
          )}

          <button
            onClick={logout}
            title="Sair"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-colors duration-150"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MOBILE MOBILE TOP BAR */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Car className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900 text-base">Crianças à Boleia</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-lg">
            {!isFirebaseActive ? "Demo" : "Nuvem"}
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-rose-600"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* RESPONSIVE BOTTOM NAVIGATION (MOBILE) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 px-2 py-1 flex justify-around items-center z-50 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-2.5 px-3 min-w-[64px] rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 font-bold transform scale-102'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className={`h-5 w-5 stroke-[2] ${isActive ? 'text-blue-600 fill-blue-50/20' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-1 tracking-tight font-medium">
                {item.label.split(' ')[0]} {/* shortened labels for mobile fit */}
              </span>
              
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1.5 right-3 bg-rose-500 text-white font-extrabold text-[9px] min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full border border-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

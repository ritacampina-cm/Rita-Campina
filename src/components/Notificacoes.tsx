/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, Trash2, Calendar, Clock, Smile, Inbox } from 'lucide-react';

export const Notificacoes: React.FC = () => {
  const { notifications, currentUser, markNotificationAsRead, clearAllNotifications } = useApp();

  // Filter only notifications specific to this user
  const myNotifications = notifications.filter(n => n.userId === currentUser?.id);
  const unreadCount = myNotifications.filter(n => !n.lida).length;

  return (
    <div className="space-y-6 pb-24">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Bell className="h-6 w-6 text-blue-600" />
            <span>Notificações</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Fique a par de novos pedidos e aceitações de boleia no seu grupo
          </p>
        </div>

        {myNotifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="px-4 py-2 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Limpar Tudo</span>
          </button>
        )}
      </div>

      {/* Stats bar */}
      {myNotifications.length > 0 && (
        <div className="text-xs font-semibold text-slate-500">
          Tem <span className="text-blue-600 font-bold">{unreadCount} notificações por ler</span> de um total de {myNotifications.length}.
        </div>
      )}

      {/* Notifications feed */}
      {myNotifications.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 shadow-sm">
          <Inbox className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">A sua caixa de entrada está vazia</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Não tem novas notificações de momento. Quando houver pedidos ou aceitações na escola, avisá-lo-emos aqui! 😊
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {myNotifications.map((notif) => {
            const timeFormatted = new Date(notif.createdAt).toLocaleTimeString('pt-PT', {
              hour: '2-digit',
              minute: '2-digit'
            });
            const dateFormatted = new Date(notif.createdAt).toLocaleDateString('pt-PT', {
              day: 'numeric',
              month: 'short'
            });

            return (
              <div
                key={notif.id}
                className={`p-4 bg-white border rounded-2xl shadow-sm transition-all flex items-start justify-between space-x-3 ${
                  !notif.lida 
                    ? 'border-l-4 border-l-blue-600 border-slate-100' 
                    : 'border-slate-100 opacity-75'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${!notif.lida ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className={`text-sm ${!notif.lida ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {notif.titulo}
                    </h4>
                    <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                      {notif.mensagem}
                    </p>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-bold pt-1">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {dateFormatted}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {timeFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                {!notif.lida && (
                  <button
                    onClick={() => markNotificationAsRead(notif.id)}
                    title="Marcar como lida"
                    className="p-1.5 hover:bg-slate-50 text-blue-600 hover:text-blue-800 rounded-lg transition-colors border border-blue-100 shrink-0 cursor-pointer"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

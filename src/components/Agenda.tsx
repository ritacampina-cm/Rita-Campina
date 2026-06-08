/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils/initials';
import { getChildColor } from '../utils/childColors';
import { 
  MapPin, 
  Clock, 
  Calendar as CalendarIcon, 
  Info, 
  User, 
  Layers, 
  Grid, 
  ListIcon, 
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { Activity, Child } from '../types';

export const Agenda: React.FC = () => {
  const { activities, children: allChildren, users } = useApp();
  
  // Scope selector
  const [scope, setScope] = useState<'meus' | 'grupo'>('meus');
  // View selector: 'calendar' | 'list'
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  // Selected day for mobile filtering in calendar view (Tudo / specific day)
  const [mobileActiveDay, setMobileActiveDay] = useState<string>("Tudo");
  // Selected Activity for Detail Modal
  const [selectedActDetails, setSelectedActDetails] = useState<Activity | null>(null);

  const weekdays = [
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
    "Domingo"
  ];

  // Helper to get child information
  const getChildDetails = (childId: string) => {
    return allChildren.find(c => c.id === childId);
  };

  const getParentName = (childId: string) => {
    const child = getChildDetails(childId);
    if (!child) return "Desconhecido";
    const parent = users.find(u => u.id === child.userId);
    return parent ? parent.nome : "Pai/Mãe";
  };

  // Filter activities by scope
  const getFilteredActivitiesForScope = () => {
    return activities.filter(act => {
      const child = getChildDetails(act.childId);
      if (!child) return false;

      // Filter by own children or group
      if (scope === 'meus') {
        const currentUserStr = localStorage.getItem('cab_current_user') || '{}';
        let currentUserId = 'user-me';
        try {
          currentUserId = JSON.parse(currentUserStr).id || 'user-me';
        } catch (_) {}
        if (child.userId !== currentUserId) return false;
      }
      return true;
    });
  };

  const activeActivities = getFilteredActivitiesForScope();

  // Sort activities by hour Helper
  const sortActivitiesByHour = (actList: Activity[]) => {
    return [...actList].sort((a, b) => a.hora.localeCompare(b.hora));
  };

  return (
    <div className="space-y-6 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <CalendarIcon className="h-6 w-6 text-blue-600" />
            <span>Calendário Semanal</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Planeie as boleias e rotas extracurriculares das crianças na agenda do grupo
          </p>
        </div>

        {/* View and Scope selectors in a single flex container for slick visual alignment */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setScope('meus')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                scope === 'meus'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Meus Filhos
            </button>
            <button
              onClick={() => setScope('grupo')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                scope === 'grupo'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todo o Grupo
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              title="Formato de Calendário"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid className="h-4 w-4" />
              <span className="text-xs font-bold px-1 hidden md:inline">Calendário</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Formato de Lista"
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1 ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ListIcon className="h-4 w-4" />
              <span className="text-xs font-bold px-1 hidden md:inline">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEWPORT CONTROLLER */}
      {viewMode === 'calendar' ? (
        <div className="space-y-5">
          {/* Calendar specific instructions */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/20 border border-blue-50 p-4 rounded-2xl flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-extrabold text-blue-800">Dica Prática:</span>
              <p>Clique em qualquer cartão de atividade na grelha do calendário para ver todos os detalhes das crianças, rotas, observações do trajeto e encarregados de educação.</p>
            </div>
          </div>

          {/* Mobile Fast-Toggle Day Filter (Only visible on small devices up to lg to avoid grid clutter) */}
          <div className="lg:hidden bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto scrollbar-none flex space-x-1">
            <button
              onClick={() => setMobileActiveDay("Tudo")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                mobileActiveDay === "Tudo"
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Todos os Dias
            </button>
            {weekdays.map((day) => {
              const count = activeActivities.filter(a => a.diaSemana === day).length;
              return (
                <button
                  key={day}
                  onClick={() => setMobileActiveDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
                    mobileActiveDay === day
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{day.replace('-feira', '')}</span>
                  {count > 0 && (
                    <span className={`h-4 min-w-[16px] px-1 text-[9px] rounded-full flex items-center justify-center font-black ${
                      mobileActiveDay === day ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* THE 7-COLUMN PLANNER BOARD & CALENDAR GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-start">
            {weekdays.map((day) => {
              const dayActs = sortActivitiesByHour(activeActivities.filter(a => a.diaSemana === day));
              const isMobileHidden = mobileActiveDay !== "Tudo" && mobileActiveDay !== day;

              return (
                <div 
                  key={day} 
                  className={`flex flex-col bg-slate-50/50 border border-slate-100 rounded-2xl p-3 space-y-3 min-h-[220px] transition-all ${
                    isMobileHidden ? 'hidden lg:flex' : 'flex'
                  }`}
                >
                  {/* Calendar Day Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/50">
                    <span className="text-xs font-black text-slate-700 tracking-wide uppercase">
                      {day.replace('-feira', '')}
                    </span>
                    <span className={`text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full`}>
                      {dayActs.length}
                    </span>
                  </div>

                  {/* Day Activities List */}
                  <div className="space-y-2.5 flex-1">
                    {dayActs.map((act) => {
                      const child = getChildDetails(act.childId);
                      return (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActDetails(act)}
                          className="bg-white border border-slate-150 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-blue-200 hover:translate-y-[-1px] transition-all cursor-pointer text-left space-y-2 relative"
                        >
                          {/* Time & Mini Badge */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex items-center">
                              <Clock className="h-2.5 w-2.5 mr-0.5" />
                              {act.hora}
                            </span>
                            
                            {(() => {
                              const kidColor = getChildColor(child?.cor);
                              return child?.foto ? (
                                <img
                                  src={child.foto}
                                  alt={child.nome}
                                  referrerPolicy="no-referrer"
                                  className={`h-5 w-5 rounded-full object-cover ring-1 ring-offset-0.5 ${kidColor.borderClass}`}
                                />
                              ) : (
                                <div className={`h-5 w-5 rounded-full font-black flex items-center justify-center text-[8px] ${kidColor.bgClass} ${kidColor.textClass}`}>
                                  {getInitials(child?.nome || '')}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Activity Title & Location */}
                          <div className="space-y-0.5">
                            <h5 className="text-[11px] font-black text-slate-800 leading-tight line-clamp-1">
                              {act.nome}
                            </h5>
                            <p className="text-[9px] text-slate-400 font-bold truncate flex items-center">
                              <MapPin className="h-2.5 w-2.5 mr-0.5 flex-shrink-0" />
                              {act.local}
                            </p>
                          </div>

                          {/* Indicators info */}
                          {act.observacoes && (
                            <span className="absolute bottom-1 right-2 inline-block w-1 h-1 rounded-full bg-indigo-500" title="Contém requisitos de trajeto" />
                          )}
                        </div>
                      );
                    })}

                    {dayActs.length === 0 && (
                      <div className="py-8 text-center text-slate-400/80 italic text-[10px] border border-dashed border-slate-200 rounded-xl flex flex-col justify-center items-center h-full">
                        <span className="text-slate-300 font-semibold mb-0.5">Sem rotinas</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {activeActivities.length === 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Info className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Não há atividades na agenda</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {scope === 'meus' 
                  ? "Ainda não adicionou nenhuma atividade extracurricular para os seus filhos. Adicione-as na aba Perfil para as ver representadas no calendário."
                  : "Nenhuma família registada no grupo adicionou atividades ainda."}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* TRADITIONAL DETAILED LIST VIEW (For fast reading of all details) */
        <div className="space-y-6">
          {weekdays.map((day) => {
            const dayActs = sortActivitiesByHour(activeActivities.filter(a => a.diaSemana === day));
            if (dayActs.length === 0) return null;

            return (
              <div key={day} className="space-y-3">
                <h3 className="text-sm font-extrabold text-slate-400 uppercase tracking-widest pl-1">
                  {day}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayActs.map((act) => {
                    const child = getChildDetails(act.childId);
                    return (
                      <div 
                        key={act.id}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                      >
                        <div className="space-y-3.5">
                          {/* Card Header & Kid details */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              {(() => {
                                const kidColor = getChildColor(child?.cor);
                                return (
                                  <>
                                    {child?.foto ? (
                                      <img
                                        src={child.foto}
                                        alt={child.nome}
                                        referrerPolicy="no-referrer"
                                        className={`h-9 w-9 rounded-xl object-cover ring-2 ring-offset-1 ${kidColor.borderClass}`}
                                      />
                                    ) : (
                                      <div className={`h-9 w-9 rounded-xl font-extrabold flex items-center justify-center text-xs ${kidColor.bgClass} ${kidColor.textClass}`}>
                                        {getInitials(child?.nome || '')}
                                      </div>
                                    )}
                                    <div>
                                      <div className="flex items-center space-x-1.5">
                                        <h4 className="text-sm font-bold text-slate-800 leading-tight">
                                          {child?.nome}
                                        </h4>
                                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] font-black tracking-wider uppercase border ${kidColor.badgeClass}`}>
                                          {kidColor.nome.split(' ')[0]}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-bold">
                                        {scope === 'meus' ? 'Meu filho' : `Encarregado: ${getParentName(act.childId)}`}
                                      </p>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>

                            <span className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md flex items-center shrink-0">
                              <Clock className="h-3.5 w-3.5 mr-0.5 text-slate-400" />
                              <span>{act.hora}</span>
                            </span>
                          </div>

                          {/* Activity Details */}
                          <div className="space-y-1">
                            <h5 className="text-sm font-bold text-slate-800">{act.nome}</h5>
                            <div className="text-xs text-slate-500 flex items-center space-x-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{act.local}</span>
                            </div>
                          </div>

                          {/* Comments block */}
                          {act.observacoes && (
                            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100/50 p-2.5 rounded-xl italic">
                              "{act.observacoes}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {activeActivities.length === 0 && (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Info className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Não há atividades registadas</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adicione atividades semanais dos seus filhos na aba Perfil para as ver representadas na agenda.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PREMIUM DETAILS DIALOG/MODAL FOR ACTIVE CALENDAR CARD */}
      {selectedActDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Detalhes da Atividade</span>
              </div>
              <button
                onClick={() => setSelectedActDetails(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Kid Identity & Profile Card */}
            {(() => {
              const child = getChildDetails(selectedActDetails.childId);
              return (
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center space-x-3 border border-slate-100">
                  {(() => {
                    const kidColor = getChildColor(child?.cor);
                    return (
                      <>
                        {child?.foto ? (
                          <img
                            src={child.foto}
                            alt={child.nome}
                            referrerPolicy="no-referrer"
                            className={`h-12 w-12 rounded-xl object-cover ring-2 ring-offset-1 ${kidColor.borderClass} shadow-sm`}
                          />
                        ) : (
                          <div className={`h-12 w-12 rounded-xl font-extrabold flex items-center justify-center text-sm border ${kidColor.bgClass} ${kidColor.textClass} ${kidColor.borderClass}/30`}>
                            {getInitials(child?.nome || '')}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                              {child?.nome}
                            </h4>
                            <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] font-black tracking-wider uppercase border ${kidColor.badgeClass}`}>
                              {kidColor.nome.split(' ')[0]}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-bold flex items-center mt-0.5">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400 mr-1" />
                            Encarregado: {getParentName(selectedActDetails.childId)}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Activity Info Block */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  Atividade Extracurricular
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {selectedActDetails.nome}
                </h3>
              </div>

              {/* Day, Hour, and Venue specs */}
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dia & Hora</span>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 flex items-center">
                      <CalendarIcon className="h-3.5 w-3.5 text-blue-500 mr-1 shrink-0" />
                      {selectedActDetails.diaSemana}
                    </p>
                    <p className="font-bold text-slate-600 flex items-center pl-4.5 bg-blue-50/50 rounded w-fit px-1">
                      {selectedActDetails.hora}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/60 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Coordenada / Local</span>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800 truncate flex items-center" title={selectedActDetails.local}>
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 mr-1 shrink-0" />
                      {selectedActDetails.local}
                    </p>
                  </div>
                </div>
              </div>

              {/* Trajectory and Ride requirements */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Dicas e Requisitos de Trajeto (Boleias)
                </span>
                {selectedActDetails.observacoes ? (
                  <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl italic">
                    "{selectedActDetails.observacoes}"
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-xl">
                    Sem requisitos de trajeto especiais introduzidos para esta atividade. Pode ser combinada livremente pelas famílias do grupo.
                  </p>
                )}
              </div>
            </div>

            {/* Call Action button */}
            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setSelectedActDetails(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


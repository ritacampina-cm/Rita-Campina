/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils/initials';
import { getChildColor } from '../utils/childColors';
import { 
  Car, 
  MapPin, 
  Calendar, 
  Clock, 
  Heart, 
  AlertCircle, 
  Plus, 
  ArrowRight, 
  User, 
  Sparkles, 
  Check, 
  ChevronRight 
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  openCreateModalDirectly: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, openCreateModalDirectly }) => {
  const { 
    currentUser, 
    myChildren, 
    activities, 
    rideRequests, 
    users, 
    children: allChildren,
    acceptRideRequest,
    completeRideRequest,
    declineRideRequest
  } = useApp();

  const [filterMode, setFilterMode] = useState<'tudo' | 'meus' | 'outros'>('tudo');

  // Find users and childrens helpers
  const getParentNameByChildId = (childId: string) => {
    const child = allChildren.find(c => c.id === childId);
    if (!child) return "Pai/Mãe";
    const parent = users.find(u => u.id === child.userId);
    return parent ? parent.nome : "Pai/Mãe";
  };

  const getChildName = (childId: string) => {
    const child = allChildren.find(c => c.id === childId);
    return child ? child.nome : "Criança";
  };

  const getChildFoto = (childId: string) => {
    const child = allChildren.find(c => c.id === childId);
    return child?.foto;
  };

  const getActivityName = (activityId: string, req?: any) => {
    if (activityId === "outro" && req) return req.outroNome || "Atividade não programada";
    const act = activities.find(a => a.id === activityId);
    return act ? act.nome : "Atividade";
  };

  const getActivityLocal = (activityId: string, req?: any) => {
    if (activityId === "outro" && req) return req.outroLocal || "Local não programado";
    const act = activities.find(a => a.id === activityId);
    return act ? act.local : "Localização";
  };

  // 1. FILTER RIDE REQUESTS
  const pendingRequests = rideRequests.filter(r => r.estado === "Pendente");
  const acceptedRequests = rideRequests.filter(r => r.estado === "Aceite");

  // Requests I made
  const myRequests = rideRequests.filter(r => r.userId === currentUser?.id);
  // Requests from others that I accepted to drive
  const requestsIAmDriving = rideRequests.filter(r => r.estado === "Aceite" && r.acceptedBy === currentUser?.id);
  // Requests I made that others accepted
  const myAcceptedRequests = rideRequests.filter(r => r.userId === currentUser?.id && r.estado === "Aceite");

  return (
    <div className="space-y-6 pb-24">
      {/* 2. WELCOME BANNER WITH CTAs */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/15 relative overflow-hidden">
        {/* Dynamic decorative backdrop */}
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/5 blur-xl"></div>
        <div className="absolute right-1/4 -top-10 h-32 w-32 rounded-full bg-white/10 blur-lg"></div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
            <span>Cooperação Ativa de Famílias</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Olá, {currentUser?.nome.split(' ')[0]}! 👋
          </h2>
          <p className="text-blue-50/90 text-sm md:text-base leading-relaxed font-medium">
            Tem <span className="font-bold underline">{myChildren.length} crianças</span> e <span className="font-bold underline">{activities.filter(a => myChildren.some(mc => mc.id === a.childId)).length} rotas semanais</span> registadas no seu agregado familiar.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={openCreateModalDirectly}
              className="px-5 py-3 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-all duration-150 shadow-md inline-flex items-center space-x-2"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Pedir uma Boleia</span>
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm rounded-xl transition-all duration-150 inline-flex items-center space-x-2"
            >
              <span>Ver Agenda Semanal</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. CORE SUB-DASHBOARD IN TWO COLUMNS (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE BOLEIAS AND REQUESTS */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          
          {/* INTERACTIVE STATE SELECT BAR */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-600" />
              <span>Coordenação de Viagens</span>
            </h3>

            <div className="bg-slate-100 p-0.5 rounded-lg flex space-x-1">
              <button 
                onClick={() => setFilterMode('tudo')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filterMode === 'tudo' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Todas ({pendingRequests.length + acceptedRequests.length})
              </button>
              <button 
                onClick={() => setFilterMode('meus')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filterMode === 'meus' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Minhas Pedidas ({myRequests.length})
              </button>
              <button 
                onClick={() => setFilterMode('outros')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filterMode === 'outros' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Para Ajudar ({pendingRequests.filter(r => r.userId !== currentUser?.id).length})
              </button>
            </div>
          </div>

          {/* LIST OF PENDING REQUESTS IN THE NETWORK */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Procuras Ativas (Falta de Boleia)
            </h4>

            {pendingRequests.filter(r => {
              if (filterMode === 'meus') return r.userId === currentUser?.id;
              if (filterMode === 'outros') return r.userId !== currentUser?.id;
              return true;
            }).length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
                Nenhum pedido de boleia pendente nesta categoria. Todo o grupo está coordenado! 🎯
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests
                  .filter(r => {
                    if (filterMode === 'meus') return r.userId === currentUser?.id;
                    if (filterMode === 'outros') return r.userId !== currentUser?.id;
                    return true;
                  })
                  .map((req) => {
                    const targetChild = allChildren.find(c => c.id === req.childId);
                    const kidColor = getChildColor(targetChild?.cor);
                    const childFoto = targetChild?.foto;
                    const isMyRequest = req.userId === currentUser?.id;
                    
                    return (
                      <div 
                        key={req.id}
                        className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {/* Request Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2.5">
                              {childFoto ? (
                                <img
                                  src={childFoto}
                                  alt={getChildName(req.childId)}
                                  referrerPolicy="no-referrer"
                                  className={`h-9 w-9 rounded-lg object-cover ring-2 ring-offset-1 ${kidColor.borderClass}`}
                                />
                              ) : (
                                <div className={`h-9 w-9 rounded-lg font-bold flex items-center justify-center text-xs ${kidColor.bgClass} ${kidColor.textClass}`}>
                                  {getInitials(getChildName(req.childId))}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <h4 className="text-sm font-bold text-slate-800">
                                    {getChildName(req.childId)}
                                  </h4>
                                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] font-black tracking-wider uppercase border ${kidColor.badgeClass}`}>
                                    {kidColor.nome.split(' ')[0]}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  família de {getParentNameByChildId(req.childId)}
                                </p>
                              </div>
                            </div>

                            <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200/50">
                              Pendente
                            </span>
                          </div>

                          {/* Request Timing Info */}
                          <div className="space-y-1.5 py-1 text-slate-600 text-xs">
                            <div className="flex items-center space-x-1.5 font-semibold text-slate-700">
                              <span className="text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded font-bold">
                                {getActivityName(req.activityId, req)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{getActivityLocal(req.activityId, req)}</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{req.data} (Dia de atividade)</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>Às <strong className="text-slate-900">{req.hora}</strong></span>
                            </div>
                            {req.observacao && (
                              <p className="mt-2 text-[11px] text-slate-500 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100/30">
                                "{req.observacao}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Coordinate Action */}
                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end space-x-2">
                          {isMyRequest ? (
                            <span className="text-xs text-indigo-600 font-semibold italic">
                              Emitido por si
                            </span>
                          ) : (
                            <button
                              onClick={() => acceptRideRequest(req.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                              <span>Vou dar boleia!</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* SECURED CONFIRMED BOLEIAS SECTION */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Boleias Agendadas (Confirmadas)
            </h4>

            {acceptedRequests.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
                Ainda não há boleias programadas para esta semana no grupo. 🚗
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acceptedRequests.map((req) => {
                  const isDriver = req.acceptedBy === currentUser?.id;
                  const isForMyKid = req.userId === currentUser?.id;
                  const driverName = users.find(u => u.id === req.acceptedBy)?.nome || "Outro pai";
                  const driverTelef = users.find(u => u.id === req.acceptedBy)?.telefone || "Não fornecido";
                  const driverFoto = users.find(u => u.id === req.acceptedBy)?.foto;

                  return (
                    <div 
                      key={req.id}
                      className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${isDriver ? 'border-l-4 border-l-emerald-500 border-slate-100' : 'border-l-4 border-l-blue-500 border-slate-100'}`}
                    >
                      <div>
                        {/* Title bar */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
                            <span>Aceite</span>
                          </span>

                          <span className="text-[10px] text-slate-400 font-semibold">
                            {req.data} @ {req.hora}
                          </span>
                        </div>

                        <div className="py-1 space-y-2">
                          {(() => {
                            const targetChild = allChildren.find(c => c.id === req.childId);
                            const kidColor = getChildColor(targetChild?.cor);
                            return (
                              <p className="text-sm text-slate-800 flex flex-wrap items-center gap-1.5">
                                <span>Boleira para</span>
                                <strong className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black tracking-wider uppercase border ${kidColor.badgeClass}`}>
                                  {getChildName(req.childId)}
                                </strong>
                                <span>para <strong className="text-slate-900">{getActivityName(req.activityId, req)}</strong>.</span>
                              </p>
                            );
                          })()}
                          <p className="text-xs text-slate-500 flex items-center space-x-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{getActivityLocal(req.activityId, req)}</span>
                          </p>

                          {/* Driver identification banner */}
                          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {driverFoto ? (
                                <img
                                  src={driverFoto}
                                  alt={driverName}
                                  referrerPolicy="no-referrer"
                                  className="h-7 w-7 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                                  {getInitials(driverName)}
                                </div>
                              )}
                              <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                  Motorista Responsável
                                </p>
                                <p className="text-xs font-bold text-slate-800">
                                  {isDriver ? "Você próprio" : driverName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-100 px-2 py-0.5 rounded shadow-sm shrink-0">
                                {driverTelef}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* State Complete/Back Operations */}
                      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                        {isForMyKid ? (
                          <button
                            onClick={() => completeRideRequest(req.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-colors shrink-0"
                          >
                            Marcar como Conclída
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold italic">
                            É o motorista desta rota 🚗
                          </span>
                        )}

                        {!isDriver && isForMyKid && (
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-md">
                            Filho em segurança
                          </span>
                        )}

                        {isDriver && (
                          <button
                            onClick={() => declineRideRequest(req.id)}
                            className="text-[11px] text-rose-500 hover:text-rose-700 font-bold underline"
                          >
                            Já não consigo dar boleia
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: MY CHILDREN AND INTELLIGENCE AND HELP */}
        <div className="col-span-1 lg:col-span-4 space-y-6">

          {/* MY CHILDREN QUICK BAR */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Os Meus Filhos ({myChildren.length})
              </h3>
              <button
                onClick={() => setActiveTab('perfil')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center space-x-1"
              >
                <span>Gerir</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {myChildren.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                Ainda não registou os seus filhos. Por favor, adicione-os no seu perfil para pedir boleias.
              </div>
            ) : (
              <div className="space-y-3">
                {myChildren.map((kid) => {
                  const kidActs = activities.filter(a => a.childId === kid.id);
                  return (
                    <div 
                      key={kid.id}
                      className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100/50"
                    >
                      <div className="flex items-center space-x-3">
                        {kid.foto ? (
                          <img
                            src={kid.foto}
                            alt={kid.nome}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                            {getInitials(kid.nome)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{kid.nome}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Nasc: {kid.dataNascimento}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full">
                          {kidActs.length} rotas
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MICRO INTEL - SIMPLICIDADE APPS SUGGESTION (RULE 11) */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-amber-800 flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500 animate-bounce" />
              <span>Dicas Inteligentes do Grupo</span>
            </h4>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-white border border-amber-100 rounded-2xl">
                <p className="font-bold text-amber-900 mb-1">📅 Atividade Coincidente Encontrada</p>
                <p>O <strong>Gonçalo</strong> e o <strong>Tiago</strong> frequentam Futebol no Estádio Municipal às segundas-feiras às 18h. Se precisar de pedir boleia nesse dia, a família da Ana Costa costuma estar disponível!</p>
              </div>

              <div className="p-3 bg-white border border-amber-100 rounded-2xl">
                <p className="font-bold text-amber-900 mb-1 font-sans">🚗 Solidariedade de Combustível</p>
                <p>Dar ou receber uma boleia no grupo poupa cerca de <strong>1.5kg de CO2</strong> por percurso e divide o tempo de transporte entre pais em 50%! 🌍</p>
              </div>
            </div>
          </div>

          {/* APP STATS / INFORMATION */}
          <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Car className="h-28 w-28 translate-x-4 translate-y-4" />
            </div>
            <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400 mb-3">
              Como funciona o Grupo?
            </h3>
            <ol className="text-xs text-slate-200 space-y-2.5 list-decimal pl-4.5 font-medium">
              <li>Registe os seus filhos e as respetivas atividades semanais.</li>
              <li>Sempre que não puder assegurar o trajeto, clique em <strong>Pedir Boleia</strong>.</li>
              <li>Qualquer pai do grupo pode aceitar e notificá-lo-á na hora.</li>
              <li>Acompanhe o estado das viagens diretamente na Agenda ou Início.</li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
};

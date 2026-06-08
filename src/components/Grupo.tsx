/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils/initials';
import { getChildColor } from '../utils/childColors';
import { Users, Phone, Mail, Award, Smile, ChevronRight, Car } from 'lucide-react';

export const Grupo: React.FC = () => {
  const { groupMembers, currentUser, rideRequests, activities, children } = useApp();

  return (
    <div className="space-y-6 pb-24 font-sans">
      {/* Header bar */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <Users className="h-6 w-6 text-blue-600" />
          <span>Famílias do Grupo</span>
        </h2>
        <p className="text-slate-500 text-sm">
          Conheça as famílias parceiras que organizam boleias desportivas e escolares
        </p>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupMembers.map((member) => {
          const isMe = member.user.id === currentUser?.id;
          return (
            <div 
              key={member.user.id}
              className={`bg-white border rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isMe ? 'ring-2 ring-blue-600/10 border-blue-500/30' : 'border-slate-100'
              }`}
            >
              <div>
                {/* Me tag banner */}
                {isMe && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white font-black text-[9px] px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                    O Meu Agregado
                  </div>
                )}

                {/* Profile header */}
                <div className="flex items-center space-x-3 pb-4 border-b border-slate-50">
                  {member.user.foto ? (
                    <img
                      src={member.user.foto}
                      alt={member.user.nome}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-lg">
                      {getInitials(member.user.nome)}
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center">
                      <span>{member.user.nome}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                {/* Contacts Block */}
                <div className="py-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-extrabold text-slate-800">
                      {member.user.telefone || "Telefone não registado"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Contacto Principal</span>
                  </div>
                </div>

                {/* Associated Children listings */}
                <div className="pt-3 border-t border-slate-50 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Crianças Inscritas
                  </h4>
                  
                  {member.children.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhuma criança registada neste agregado.</p>
                  ) : (
                    <div className="space-y-2">
                      {member.children.map((child) => {
                        const kidColor = getChildColor(child.cor);
                        return (
                          <div 
                            key={child.id}
                            className="flex items-center justify-between p-2 bg-slate-50/50 rounded-xl border border-slate-150"
                          >
                            <div className="flex items-center space-x-2">
                              {child.foto ? (
                                <img
                                  src={child.foto}
                                  alt={child.nome}
                                  referrerPolicy="no-referrer"
                                  className={`h-7 w-7 rounded-lg object-cover ring-2 ring-offset-1 ${kidColor.borderClass}`}
                                />
                              ) : (
                                <div className={`h-7 w-7 rounded-lg font-black text-[10px] flex items-center justify-center ${kidColor.bgClass} ${kidColor.textClass}`}>
                                  {getInitials(child.nome)}
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                                  <span>{child.nome}</span>
                                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[7px] font-black uppercase tracking-wider border leading-none ${kidColor.badgeClass}`}>
                                    {kidColor.nome.split(' ')[0]}
                                  </span>
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium">Nasc: {child.dataNascimento}</p>
                              </div>
                            </div>
                            
                            <Smile className="h-4 w-4 text-slate-300" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Accepted Rides (Boleias Saudáveis e Cooperativas) */}
                {(() => {
                  const parentRides = rideRequests.filter(r => r.acceptedBy === member.user.id && (r.estado === "Aceite" || r.estado === "Concluído"));
                  if (parentRides.length === 0) return null;
                  
                  return (
                    <div className="pt-3.5 border-t border-slate-50 space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center space-x-1">
                        <Car className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span>Boleias que vai Dar ({parentRides.length})</span>
                      </h4>
                      <div className="space-y-1.5">
                        {parentRides.map((req) => {
                          const passengerChild = children.find(c => c.id === req.childId);
                          const routeName = req.activityId === "outro" ? (req.outroNome || "Atividade Não Programada") : (activities.find(a => a.id === req.activityId)?.nome || "Atividade");
                          return (
                            <div key={req.id} className="text-[11px] bg-emerald-50/30 border border-emerald-100/30 p-2 rounded-xl flex flex-col space-y-0.5 text-left">
                              <div className="font-extrabold text-slate-800 flex items-center justify-between">
                                <span className="truncate">Para {passengerChild?.nome || "Criança"}</span>
                                <span className="text-[9px] text-emerald-600 font-extrabold shrink-0 bg-emerald-50 px-1 py-0.2 rounded">{req.hora}</span>
                              </div>
                              <div className="text-[9.5px] text-slate-500 font-medium truncate">
                                Destino: <strong className="text-slate-700">{routeName}</strong>
                              </div>
                              <div className="text-[9px] text-slate-400 font-bold">
                                Dia {req.data}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

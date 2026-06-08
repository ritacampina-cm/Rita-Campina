/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils/initials';
import { getChildColor } from '../utils/childColors';
import { 
  Car, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Filter, 
  FileText, 
  AlertCircle, 
  X, 
  Check, 
  Trash2, 
  Sparkles, 
  CheckSquare 
} from 'lucide-react';

interface PedidosProps {
  isCreateModalOpen: boolean;
  setCloseCreateModal: () => void;
}

export const Pedidos: React.FC<PedidosProps> = ({ isCreateModalOpen, setCloseCreateModal }) => {
  const { 
    currentUser, 
    myChildren, 
    activities, 
    rideRequests, 
    children: allChildren, 
    users,
    createRideRequest,
    cancelRideRequest,
    completeRideRequest,
    getSuggestionsForActivity
  } = useApp();

  const [filterState, setFilterState] = useState<string>("Todos");
  const [showAddForm, setShowAddForm] = useState(false);

  // Hook into dashboard call triggers
  useEffect(() => {
    if (isCreateModalOpen) {
      setShowAddForm(true);
    }
  }, [isCreateModalOpen]);

  // Form registration states
  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [customActivityName, setCustomActivityName] = useState('');
  const [customActivityLocal, setCustomActivityLocal] = useState('');
  const [rideDate, setRideDate] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Intel suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Update suggestions dynamically
  useEffect(() => {
    if (selectedChildId && selectedActivityId) {
      if (selectedActivityId === "outro") {
        setSuggestions([]);
        return;
      }
      const segs = getSuggestionsForActivity(selectedChildId, selectedActivityId);
      setSuggestions(segs);

      // Autofill hour if a matched activity exists
      const targetAct = activities.find(a => a.id === selectedActivityId);
      if (targetAct) {
        setRideTime(targetAct.hora);
      }
    } else {
      setSuggestions([]);
    }
  }, [selectedChildId, selectedActivityId, activities]);

  // Reset form
  const handleCloseForm = () => {
    setShowAddForm(false);
    setCloseCreateModal();
    setSelectedChildId('');
    setSelectedActivityId('');
    setCustomActivityName('');
    setCustomActivityLocal('');
    setRideDate('');
    setRideTime('');
    setObservation('');
    setErrorMessage(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    if (!selectedChildId || !selectedActivityId || !rideDate || !rideTime) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      setIsSubmitting(false);
      return;
    }

    if (selectedActivityId === "outro" && (!customActivityName || !customActivityLocal)) {
      setErrorMessage("Por favor, introduza o nome e local da outra atividade.");
      setIsSubmitting(false);
      return;
    }

    try {
      await createRideRequest(
        selectedChildId, 
        selectedActivityId, 
        rideDate, 
        rideTime, 
        observation,
        selectedActivityId === "outro" ? customActivityName : undefined,
        selectedActivityId === "outro" ? customActivityLocal : undefined
      );
      handleCloseForm();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao registar o pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper getters
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

  const getParentName = (userId: string) => {
    const parent = users.find(u => u.id === userId);
    return parent ? parent.nome : "Pãe/Mãe";
  };

  // Filter requests
  const filteredRequests = rideRequests.filter(req => {
    if (filterState === "Todos") return true;
    return req.estado === filterState;
  });

  return (
    <div className="space-y-6 pb-24">
      
      {/* HEADER BAR AND TRIGGERS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Car className="h-6 w-6 text-blue-600" />
            <span>Pedidos de Boleia</span>
          </h2>
          <p className="text-slate-500 text-sm">
            Gerencie procuras ativas e consulte o histórico de viagens
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="self-start md:self-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Novo Pedido</span>
        </button>
      </div>

      {/* MODAL / BOTTOM FORM SHEET DIALOG FOR CREATING A REQUEST */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">Novo Pedido de Boleia</h3>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleCreate} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="text-red-600 text-xs bg-red-50 border border-red-100 p-3 rounded-xl flex items-center space-x-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step 1: Select Child */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Criança *
                </label>
                <select
                  required
                  value={selectedChildId}
                  onChange={(e) => {
                    setSelectedChildId(e.target.value);
                    setSelectedActivityId('');
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 sm:text-sm"
                >
                  <option value="">-- Selecione uma criança --</option>
                  {myChildren.map((child) => (
                    <option key={child.id} value={child.id}>{child.nome}</option>
                  ))}
                </select>
                {myChildren.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1 font-semibold">
                    Primeiro precisa de registar as suas crianças no perfil!
                  </p>
                )}
              </div>

              {/* Step 2: Select Child's Activity */}
              {selectedChildId && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Atividade Relacionada *
                    </label>
                    <select
                      required
                      value={selectedActivityId}
                      onChange={(e) => {
                        setSelectedActivityId(e.target.value);
                        if (e.target.value === "outro") {
                          setRideTime('');
                        }
                      }}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 sm:text-sm shadow-sm"
                    >
                      <option value="">-- Selecione a atividade associada --</option>
                      {activities.filter(a => a.childId === selectedChildId).map((act) => (
                        <option key={act.id} value={act.id}>
                          {act.nome} ({act.diaSemana} às {act.hora})
                        </option>
                      ))}
                      <option value="outro" className="text-blue-600 font-semibold bg-blue-50/50">
                        ➕ Outra Atividade (Não Programada)
                      </option>
                    </select>
                    {activities.filter(a => a.childId === selectedChildId).length === 0 && (
                      <p className="text-xs text-blue-600 mt-1 font-semibold">
                        Esta criança não tem rotas permanentes agendadas. Selecione "Outra Atividade (Não Programada)" para fazer um pedido pontual ou vá ao Perfil para associar atividades semanais.
                      </p>
                    )}
                  </div>

                  {/* Custom Activity Fields */}
                  {selectedActivityId === "outro" && (
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-3 animate-fadeIn">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                        <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>Atividade Não Programada</span>
                      </p>
                      
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Nome da Atividade *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Consulta Médica, Explicações, Aniversário"
                          value={customActivityName}
                          onChange={(e) => setCustomActivityName(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Localização do Destino *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Clínica das Amoreiras, Escola de Inglês"
                          value={customActivityLocal}
                          onChange={(e) => setCustomActivityLocal(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* INTELLIGENCE RULES (RULE 11 SUGGESTIONS BOX) */}
              {suggestions.length > 0 && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/50 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs text-amber-900 font-extrabold uppercase tracking-wide">
                    <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span>Dicas Inteligentes de Rota</span>
                  </div>
                  {suggestions.map((seg, idx) => (
                    <p key={idx} className="text-xs text-slate-700 font-medium leading-relaxed">
                      • {seg.message}
                    </p>
                  ))}
                </div>
              )}

              {/* Step 3: Logistics (Date and Hour) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Data da Viagem *
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={rideDate}
                      onChange={(e) => setRideDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Hora do Trajeto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="17:00"
                    value={rideTime}
                    onChange={(e) => setRideTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Preenchido auto pela atividade</p>
                </div>
              </div>

              {/* Step 4: Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Observações Opcionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Por exemplo: 'Precisa de cadeirinha', 'Eu posso levar, mas preciso de boleia para a volta'."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm placeholder-slate-400"
                ></textarea>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-50 flex items-center justify-end space-x-3 bg-white sticky bottom-0">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || myChildren.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "A registar..." : "Publicar Pedido de Boleia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTER CHIPS GRID */}
      <div className="flex border-b border-slate-100 space-x-4 pb-1 overflow-x-auto scrollbar-none">
        {["Todos", "Pendente", "Aceite", "Concluído", "Cancelado"].map((status) => {
          // Count metrics
          const count = rideRequests.filter(r => status === "Todos" ? true : r.estado === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterState(status)}
              className={`pb-3 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center space-x-1.5 ${
                filterState === status
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{status}</span>
              <span className={`h-4 px-1.5 text-[9px] font-black rounded-full ${filterState === status ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* LIST OF CURRENT REQUESTS */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3 shadow-sm">
          <FileText className="h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Nenhum pedido de boleia encontrado</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Não existem pedidos de boleia que correspondam ao estado selecionado nesta semana de cooperação escolar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((req) => {
            const isMyReq = req.userId === currentUser?.id;
            const childFoto = getChildFoto(req.childId);
            const driver = users.find(u => u.id === req.acceptedBy);

            return (
              <div 
                key={req.id}
                className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Row 1: Kid & state */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const targetChild = allChildren.find(c => c.id === req.childId);
                        const kidColor = getChildColor(targetChild?.cor);
                        return (
                          <>
                            {childFoto ? (
                              <img
                                src={childFoto}
                                alt={getChildName(req.childId)}
                                referrerPolicy="no-referrer"
                                className={`h-10 w-10 rounded-xl object-cover ring-2 ring-offset-1 ${kidColor.borderClass}`}
                              />
                            ) : (
                              <div className={`h-10 w-10 rounded-xl font-extrabold flex items-center justify-center text-xs ${kidColor.bgClass} ${kidColor.textClass}`}>
                                {getInitials(getChildName(req.childId))}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                                  {getChildName(req.childId)}
                                </h4>
                                <span className={`inline-flex items-center px-1.5 py-0.2 rounded-md text-[8px] font-black tracking-wider uppercase border ${kidColor.badgeClass}`}>
                                  {kidColor.nome.split(' ')[0]}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                Pais: {getParentName(req.userId)}
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      req.estado === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                      req.estado === 'Aceite' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                      req.estado === 'Concluído' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/50' :
                      'bg-rose-50 text-rose-600 border-rose-200/50'
                    }`}>
                      {req.estado}
                    </span>
                  </div>

                  {/* Row 2: Route, hours */}
                  <div className="space-y-2 py-1.5 text-slate-600 text-xs font-semibold leading-relaxed">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-xs font-bold">
                        {getActivityName(req.activityId, req)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{getActivityLocal(req.activityId, req)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{req.data}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-500">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Às <strong className="text-slate-900">{req.hora}</strong></span>
                    </div>
                    
                    {req.observacao && (
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl italic font-normal text-slate-500 text-[11px] mt-3">
                        "{req.observacao}"
                      </div>
                    )}
                  </div>

                  {/* Driver summary if Aceite */}
                  {req.estado === 'Aceite' && driver && (
                    <div className="mt-4 p-2.5 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {driver.foto ? (
                          <img
                            src={driver.foto}
                            alt={driver.nome}
                            referrerPolicy="no-referrer"
                            className="h-7 w-7 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center">
                            {getInitials(driver.nome)}
                          </div>
                        )}
                        <div>
                          <p className="text-[9px] text-emerald-700 font-bold uppercase shrink-0">Boleia por</p>
                          <p className="font-bold text-slate-800">{driver.nome}</p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-white border border-slate-100 px-2 py-0.5 rounded font-black text-slate-600">
                        {driver.telefone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Operations */}
                {isMyReq && req.estado === 'Pendente' && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end">
                    <button
                      onClick={() => cancelRideRequest(req.id)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Cancelar Pedido</span>
                    </button>
                  </div>
                )}

                {isMyReq && req.estado === 'Aceite' && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => completeRideRequest(req.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl"
                    >
                      Boleia Concluída! 👍
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

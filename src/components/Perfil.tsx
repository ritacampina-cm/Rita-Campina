/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getInitials } from '../utils/initials';
import { CHILD_COLORS, getChildColor } from '../utils/childColors';
import { 
  User, 
  Phone, 
  Camera, 
  Baby, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Bookmark, 
  RotateCcw, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle,
  Pencil,
  Car
} from 'lucide-react';

const DIAS_SEMANA_LISTA: Array<"Segunda-feira" | "Terça-feira" | "Quarta-feira" | "Quinta-feira" | "Sexta-feira" | "Sábado" | "Domingo"> = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo"
];

export const Perfil: React.FC = () => {
  const { 
    currentUser, 
    updateProfile, 
    myChildren, 
    activities, 
    addChild, 
    updateChild,
    removeChild, 
    addActivity, 
    updateActivity,
    removeActivity,
    resetDemoData,
    isFirebaseActive,
    rideRequests,
    children: allChildren,
    users,
    declineRideRequest
  } = useApp();

  // Profile forms
  const [nome, setNome] = useState(currentUser?.nome || '');
  const [telefone, setTelefone] = useState(currentUser?.telefone || '');
  const [foto, setFoto] = useState(currentUser?.foto || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // New kid states
  const [showKidForm, setShowKidForm] = useState(false);
  const [kidNome, setKidNome] = useState('');
  const [kidNascimento, setKidNascimento] = useState('');
  const [kidFoto, setKidFoto] = useState('');
  const [kidCor, setKidCor] = useState('blue');

  // New activity form states mapped to kids
  const [activeKidIdForActivity, setActiveKidIdForActivity] = useState<string | null>(null);
  const [actNome, setActNome] = useState('');
  const [actLocal, setActLocal] = useState('');
  const [actDias, setActDias] = useState<Array<"Segunda-feira" | "Terça-feira" | "Quarta-feira" | "Quinta-feira" | "Sexta-feira" | "Sábado" | "Domingo">>([ 'Segunda-feira' ]);
  const [actHora, setActHora] = useState('');
  const [actObs, setActObs] = useState('');

  // Editing activity state
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [editActNome, setEditActNome] = useState('');
  const [editActLocal, setEditActLocal] = useState('');
  const [editActDia, setEditActDia] = useState<any>('Segunda-feira');
  const [editActHora, setEditActHora] = useState('');
  const [editActObs, setEditActObs] = useState('');

  // Editing child state
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildNome, setEditChildNome] = useState('');
  const [editChildNascimento, setEditChildNascimento] = useState('');
  const [editChildFoto, setEditChildFoto] = useState('');
  const [editChildCor, setEditChildCor] = useState('blue');

  const handleStartEditChild = (kid: any) => {
    setEditingChildId(kid.id);
    setEditChildNome(kid.nome);
    setEditChildNascimento(kid.dataNascimento);
    setEditChildFoto(kid.foto || '');
    setEditChildCor(kid.cor || 'blue');
  };

  const handleUpdateChild = async (e: React.FormEvent, childId: string) => {
    e.preventDefault();
    if (!editChildNome || !editChildNascimento) return;
    try {
      await updateChild(childId, editChildNome, editChildNascimento, editChildFoto || undefined, editChildCor);
      setEditingChildId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditActivity = (act: any) => {
    setEditingActivityId(act.id);
    setEditActNome(act.nome);
    setEditActLocal(act.local);
    setEditActDia(act.diaSemana);
    setEditActHora(act.hora);
    setEditActObs(act.observacoes || '');
  };

  const handleUpdateActivity = async (e: React.FormEvent, activityId: string) => {
    e.preventDefault();
    if (!editActNome || !editActLocal || !editActDia || !editActHora) return;
    try {
      await updateActivity(activityId, editActNome, editActLocal, editActDia, editActHora, editActObs || undefined);
      setEditingActivityId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    try {
      await updateProfile(nome, telefone, foto || undefined);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kidNome || !kidNascimento) return;
    try {
      await addChild(kidNome, kidNascimento, kidFoto || undefined, kidCor);
      setKidNome('');
      setKidNascimento('');
      setKidFoto('');
      setKidCor('blue');
      setShowKidForm(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddActivity = async (e: React.FormEvent, childId: string) => {
    e.preventDefault();
    if (!actNome || !actLocal || actDias.length === 0 || !actHora) return;
    try {
      for (const dia of actDias) {
        await addActivity(childId, actNome, actLocal, dia, actHora, actObs || undefined);
      }
      setActNome('');
      setActLocal('');
      setActDias(['Segunda-feira']);
      setActHora('');
      setActObs('');
      setActiveKidIdForActivity(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-24 font-sans">
      
      {/* SECTION 1: PROFILE INFORMATION */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-50 flex items-center space-x-2">
          <User className="h-5 w-5 text-blue-600" />
          <span>Informações do Encarregado de Educação</span>
        </h3>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                Telemóvel de Contacto *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="911 223 344"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="pl-9 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Fotografia de Perfil (URL)
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com/suafoto.jpg"
              value={foto}
              onChange={(e) => setFoto(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSuccess ? (
              <span className="text-xs text-emerald-600 font-extrabold flex items-center space-x-1">
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Perfil guardado com sucesso!</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-semibold italic">
                Preencha o telemóvel para que outros pais possam ligar e coordenar.
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Guardar Alterações
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: REGISTERED CHILDREN AND ACTIVITIES */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
          <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Baby className="h-5 w-5 text-blue-600" />
            <span>Inscrição das Crianças</span>
          </h3>
          <button
            onClick={() => setShowKidForm(true)}
            className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-blue-700 font-bold text-xs rounded-xl flex items-center space-x-1"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Adicionar Filho</span>
          </button>
        </div>

        {/* MODAL / NESTED CARD FOR NEW CHILD FORM */}
        {showKidForm && (
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative">
            <button
              onClick={() => setShowKidForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-wider">Registar Nova Criança</h4>
            
            <form onSubmit={handleAddKid} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Nome *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome próprio ou apelido"
                    value={kidNome}
                    onChange={(e) => setKidNome(e.target.value)}
                    className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Data de Nascimento *</label>
                  <input
                    type="date"
                    required
                    value={kidNascimento}
                    onChange={(e) => setKidNascimento(e.target.value)}
                    className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">Fotografia da Criança (URL opcional)</label>
                <input
                  type="url"
                  placeholder="https://exemplo.com/fotofilho.jpg"
                  value={kidFoto}
                  onChange={(e) => setKidFoto(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-200 px-3.5 py-2 text-slate-800 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Cor de Identificação * (para visualização rápida nos pedidos e agendas)
                </label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {CHILD_COLORS.map((col) => {
                    const isSelected = kidCor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setKidCor(col.id)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                          isSelected 
                            ? `${col.badgeClass} ${col.borderClass} ring-2 ring-offset-1 ${col.ringClass} scale-102` 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span 
                          className="h-3 w-3 rounded-full shrink-0 border border-slate-300/50" 
                          style={{ backgroundColor: col.hex }}
                        />
                        <span>{col.nome}</span>
                        {isSelected && <Check className="h-3 w-3 text-current ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end space-x-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowKidForm(false)}
                  className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                >
                  Confirmar Registo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LIST REGISTERED KIDS AND THEIR INDIVUDUAL ACTIVITIES */}
        {myChildren.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
            Ainda não tem nenhuma criança registada. Adicione os seus filhos para gerir as suas atividades e pedir boleia semanal.
          </div>
        ) : (
          <div className="space-y-6">
            {myChildren.map((kid) => {
              const kidActs = activities.filter(a => a.childId === kid.id);
              return (
                <div 
                  key={kid.id}
                  className="border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden bg-slate-50/10"
                >
                  {editingChildId === kid.id ? (
                    <form onSubmit={(e) => handleUpdateChild(e, kid.id)} className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-200/65 shadow-xs">
                      <h5 className="text-[10px] font-black uppercase text-slate-500">Editar Dados de {kid.nome}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nome *</label>
                          <input
                            type="text"
                            required
                            value={editChildNome}
                            onChange={(e) => setEditChildNome(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Data de Nascimento *</label>
                          <input
                            type="date"
                            required
                            value={editChildNascimento}
                            onChange={(e) => setEditChildNascimento(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Fotografia da Criança (URL opcional)</label>
                        <input
                          type="url"
                          value={editChildFoto}
                          onChange={(e) => setEditChildFoto(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                        />
                      </div>

                      {/* Edit Color Selector */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Cor de Identificação *
                        </label>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {CHILD_COLORS.map((col) => {
                            const isSelected = editChildCor === col.id;
                            return (
                              <button
                                key={col.id}
                                type="button"
                                onClick={() => setEditChildCor(col.id)}
                                className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                  isSelected 
                                    ? `${col.badgeClass} ${col.borderClass} ring-1 ring-offset-0.5 ${col.ringClass} scale-102` 
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <span 
                                  className="h-2.5 w-2.5 rounded-full shrink-0 border border-slate-300/50" 
                                  style={{ backgroundColor: col.hex }}
                                />
                                <span>{col.nome.split(' ')[0]}</span>
                                {isSelected && <Check className="h-2.5 w-2.5 text-current ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingChildId(null)}
                          className="px-2.5 py-1 bg-slate-250 hover:bg-slate-350 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        {(() => {
                          const kidColor = getChildColor(kid.cor);
                          return (
                            <>
                              {kid.foto ? (
                                <img
                                  src={kid.foto}
                                  alt={kid.nome}
                                  referrerPolicy="no-referrer"
                                  className={`h-11 w-11 rounded-xl object-cover ring-2 ring-offset-1 ${kidColor.borderClass}`}
                                />
                              ) : (
                                <div className={`h-11 w-11 rounded-xl font-extrabold flex items-center justify-center text-sm border-b ${kidColor.bgClass} ${kidColor.textClass} border-${kidColor.id}-300`}>
                                  {getInitials(kid.nome)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{kid.nome}</h4>
                                  <span className={`inline-flex items-center px-2 py-0.2 rounded-full text-[9px] font-black tracking-wider uppercase border ${kidColor.badgeClass}`}>
                                    {kidColor.nome.split(' ')[0]}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                  Nascimento: {kid.dataNascimento}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleStartEditChild(kid)}
                          title="Editar Dados do Filho"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeChild(kid.id)}
                          title="Apagar Criança"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CHILD ACTIVITIES NESTING */}
                  <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-50">
                      <h5 className="text-[11px] font-black uppercase text-slate-400.0 tracking-wider">
                        Atividades e Rotas Semanais
                      </h5>

                      <button
                        onClick={() => setActiveKidIdForActivity(kid.id)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3 stroke-[3]" />
                        <span>Nova Atividade</span>
                      </button>
                    </div>

                    {/* NEW ACTIVITY DIALOG */}
                    {activeKidIdForActivity === kid.id && (
                      <form onSubmit={(e) => handleAddActivity(e, kid.id)} className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nome Atividade *</label>
                            <input
                              type="text"
                              required
                              placeholder="Futebol, Dança, Natação..."
                              value={actNome}
                              onChange={(e) => setActNome(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Localização *</label>
                            <input
                              type="text"
                              required
                              placeholder="Estádio Municipal, Clube, Colégio..."
                              value={actLocal}
                              onChange={(e) => setActLocal(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Dias da Semana * (Selecione um ou vários)</label>
                            <div className="flex flex-wrap gap-1.5">
                              {DIAS_SEMANA_LISTA.map((dia) => {
                                const isSelected = actDias.includes(dia);
                                return (
                                  <button
                                    key={dia}
                                    type="button"
                                    onClick={() => {
                                      if (isSelected) {
                                        if (actDias.length > 1) {
                                          setActDias(actDias.filter(d => d !== dia));
                                        }
                                      } else {
                                        setActDias([...actDias, dia]);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer select-none ${
                                      isSelected 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/15' 
                                        : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-100/50'
                                    }`}
                                  >
                                    {dia.replace('-feira', '')}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hora (HH:MM) *</label>
                            <input
                              type="text"
                              required
                              placeholder="17:30"
                              value={actHora}
                              onChange={(e) => setActHora(e.target.value)}
                              className="w-full md:w-1/3 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dicas/Requisitos do Trajeto</label>
                          <input
                            type="text"
                            placeholder="ex: Levar saco desportivo, aguardar na portaria..."
                            value={actObs}
                            onChange={(e) => setActObs(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setActiveKidIdForActivity(null)}
                            className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded"
                          >
                            Guardar
                          </button>
                        </div>
                      </form>
                    )}

                    {/* ACTIVITIES LISTING */}
                    {kidActs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">Sem atividades associadas.</p>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {kidActs.map((act) => {
                          const isEditing = editingActivityId === act.id;
                          if (isEditing) {
                            return (
                              <form 
                                key={act.id} 
                                onSubmit={(e) => handleUpdateActivity(e, act.id)} 
                                className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3 my-2"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nome Atividade *</label>
                                    <input
                                      type="text"
                                      required
                                      value={editActNome}
                                      onChange={(e) => setEditActNome(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Localização *</label>
                                    <input
                                      type="text"
                                      required
                                      value={editActLocal}
                                      onChange={(e) => setEditActLocal(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dia da Semana *</label>
                                    <select
                                      required
                                      value={editActDia}
                                      onChange={(e) => setEditActDia(e.target.value as any)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800"
                                    >
                                      <option value="Segunda-feira">Segunda-feira</option>
                                      <option value="Terça-feira">Terça-feira</option>
                                      <option value="Quarta-feira">Quarta-feira</option>
                                      <option value="Quinta-feira">Quinta-feira</option>
                                      <option value="Sexta-feira">Sexta-feira</option>
                                      <option value="Sábado">Sábado</option>
                                      <option value="Domingo">Domingo</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Hora (HH:MM) *</label>
                                    <input
                                      type="text"
                                      required
                                      value={editActHora}
                                      onChange={(e) => setEditActHora(e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dicas/Requisitos do Trajeto</label>
                                  <input
                                    type="text"
                                    value={editActObs}
                                    onChange={(e) => setEditActObs(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                                  />
                                </div>

                                <div className="flex justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingActivityId(null)}
                                    className="px-2.5 py-1 bg-slate-250 hover:bg-slate-350 text-slate-700 text-[10px] font-bold rounded cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded cursor-pointer"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </form>
                            );
                          }

                          return (
                            <div 
                              key={act.id} 
                              className="py-2.5 flex items-center justify-between text-xs"
                            >
                              <div className="space-y-1">
                                <h6 className="font-extrabold text-slate-800">{act.nome}</h6>
                                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-bold">
                                  <span className="bg-slate-50 px-1.5 py-0.5 rounded flex items-center text-slate-700 font-bold">
                                    <Calendar className="h-3 w-3 mr-1 shrink-0" />
                                    {act.diaSemana}
                                  </span>
                                  <span className="bg-slate-50 px-1.5 py-0.5 rounded flex items-center text-slate-700 font-bold">
                                    <Clock className="h-3 w-3 mr-1 shrink-0" />
                                    {act.hora}
                                  </span>
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 shrink-0" />
                                    {act.local}
                                  </span>
                                  {act.observacoes && (
                                    <span className="text-slate-400 font-normal italic max-w-full truncate block">
                                      Obs: {act.observacoes}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 shrink-0">
                                <button
                                  onClick={() => handleStartEditActivity(act)}
                                  className="p-1 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Editar Atividade"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => removeActivity(act.id)}
                                  className="p-1 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="Apagar Atividade"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2.5: MY ACCEPTED RIDES (BOLEIAS QUE VOU DAR) */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Car className="h-5 w-5 text-emerald-600 animate-pulse" />
              <span>Boleias que Vou Dar (Apoio Comunitário)</span>
            </h3>
            <p className="text-slate-500 text-xs text-left">
              Lista de trajetos escolares nos quais aceitou colaborar com outras famílias
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 font-extrabold text-xs px-2.5 py-1 rounded-xl shrink-0">
            {rideRequests.filter(r => r.acceptedBy === currentUser?.id && (r.estado === "Aceite" || r.estado === "Concluído")).length} Ativas
          </span>
        </div>

        {rideRequests.filter(r => r.acceptedBy === currentUser?.id && (r.estado === "Aceite" || r.estado === "Concluído")).length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Ainda não aceitou dar nenhuma boleia. Vá ao menu "Pedidos" e ajude um vizinho! 🤝
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rideRequests
              .filter(r => r.acceptedBy === currentUser?.id && (r.estado === "Aceite" || r.estado === "Concluído"))
              .map((req) => {
                const child = allChildren.find(c => c.id === req.childId);
                const parent = users.find(u => u.id === req.userId);
                const activityName = req.activityId === "outro" ? (req.outroNome || "Atividade não programada") : (activities.find(a => a.id === req.activityId)?.nome || "Atividade");
                const activityLocal = req.activityId === "outro" ? (req.outroLocal || "Local não programado") : (activities.find(a => a.id === req.activityId)?.local || "Localização");

                return (
                  <div key={req.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 relative overflow-hidden hover:shadow-sm transition-all bg-slate-50/40 text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        {child?.foto ? (
                          <img src={child.foto} alt={child.nome} className="h-8 w-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                            {getInitials(child?.nome || "C")}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{child?.nome}</h4>
                          <p className="text-[9px] text-slate-400 font-medium">Encarregado: {parent?.nome}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${req.estado === 'Aceite' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {req.estado}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-xl border border-slate-50">
                      <div className="font-extrabold text-slate-800 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 shrink-0"></span>
                        <span>{activityName}</span>
                      </div>
                      <p className="flex items-center text-slate-500 font-medium text-[10px]">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{activityLocal}</span>
                      </p>
                      <div className="flex items-center justify-between text-slate-500 text-[10px] pt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                          {req.data}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1 text-slate-400 shrink-0" />
                          {req.hora}
                        </span>
                      </div>
                    </div>

                    {parent?.telefone && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100/50">
                        <span>Contacto encarregado:</span>
                        <strong className="text-slate-700">{parent.telefone}</strong>
                      </div>
                    )}

                    {req.estado === "Aceite" && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm("Tem a certeza que deseja desfazer este compromisso de boleia? O pedido voltará a ficar pendente para que outros pais possam ajudar.")) {
                              await declineRideRequest(req.id);
                            }
                          }}
                          className="px-2.5 py-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded text-[9px] font-extrabold transition-colors cursor-pointer"
                        >
                          Desistir de Ajudar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* SECTION 3: SYSTEM MODE SETTINGS AND DEMO RESET */}
      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
          <RotateCcw className="h-4.5 w-4.5 text-slate-500" />
          <span>Configurações Técnicas e Área de Demonstração</span>
        </h3>

        <div className="divide-y divide-slate-100 space-y-3 text-xs text-slate-600">
          <div className="flex items-center justify-between py-2.5">
            <div>
              <p className="font-bold text-slate-700">Estado de Sincronização Cloud</p>
              <p className="text-[10px] text-slate-400">Determina se o Firestore está ativado</p>
            </div>
            <span className={`px-2 py-1 font-bold rounded-lg text-[10px] ${isFirebaseActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {isFirebaseActive ? "Nuvem Conetada (Firestore)" : "Armazenamento Local (Sandbox)"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 pt-3">
            <div>
              <p className="font-bold text-slate-700">Repor Dados de Exemplo</p>
              <p className="text-[10px] text-slate-400">Limpa todas as modificações e carrega as rotas de demonstração escolares em PT</p>
            </div>
            <button
              onClick={resetDemoData}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold rounded-lg transition-colors cursor-pointer"
            >
              Repor Demo
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

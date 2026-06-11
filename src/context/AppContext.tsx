/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Child, 
  Activity, 
  RideRequest, 
  NotificationItem, 
  AppGroupMember,
  RideRequestStatus
} from '../types';
import { 
  isFirebaseEnabled, 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';

interface AppContextType {
  isFirebaseActive: boolean;
  currentUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  resetSent: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (email: string, password: string, nome: string, telefone: string) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  updateProfile: (nome: string, telefone: string, foto?: string) => Promise<void>;
  users: UserProfile[];
  children: Child[];
  activities: Activity[];
  rideRequests: RideRequest[];
  notifications: NotificationItem[];
  myChildren: Child[];
  myRideRequests: RideRequest[];
  groupMembers: AppGroupMember[];
  createRideRequest: (childId: string, activityId: string, data: string, hora: string, observacao?: string, outroNome?: string, outroLocal?: string) => Promise<void>;
  acceptRideRequest: (requestId: string) => Promise<void>;
  cancelRideRequest: (requestId: string) => Promise<void>;
  completeRideRequest: (requestId: string) => Promise<void>;
  declineRideRequest: (requestId: string) => Promise<void>;
  addChild: (nome: string, dataNascimento: string, foto?: string, cor?: string) => Promise<Child>;
  updateChild: (childId: string, nome: string, dataNascimento: string, foto?: string, cor?: string) => Promise<Child | undefined>;
  removeChild: (childId: string) => Promise<void>;
  addActivity: (childId: string, nome: string, local: string, diaSemana: Activity['diaSemana'], hora: string, observacoes?: string) => Promise<Activity>;
  updateActivity: (activityId: string, nome: string, local: string, diaSemana: Activity['diaSemana'], hora: string, observacoes?: string) => Promise<Activity | undefined>;
  removeActivity: (activityId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  getSuggestionsForActivity: (childId: string, activityId: string) => { type: 'info' | 'warning' | 'success'; message: string }[];
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_USERS: UserProfile[] = [
  { id: "user-me", nome: "Rita Campina", email: "ritacampina@gmail.com", telefone: "911223344" },
  { id: "user-1", nome: "João Silva", email: "joao.silva@gmail.com", telefone: "912345678", foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop" },
  { id: "user-2", nome: "Maria Santos", email: "maria.santos@gmail.com", telefone: "934567890", foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop" },
  { id: "user-3", nome: "Ana Costa", email: "ana.costa@hotmail.com", telefone: "967890123", foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop" }
];

const DEMO_CHILDREN: Child[] = [
  { id: "child-me-1", userId: "user-me", nome: "Manuel", dataNascimento: "2018-03-15", cor: "blue" },
  { id: "child-me-2", userId: "user-me", nome: "Maria", dataNascimento: "2016-05-10", cor: "rose" },
  { id: "child-me-3", userId: "user-me", nome: "João Afonso", dataNascimento: "2020-09-20", cor: "amber" },
  { id: "child-1", userId: "user-1", nome: "Gonçalo Silva", dataNascimento: "2017-04-12", cor: "emerald" },
  { id: "child-2", userId: "user-2", nome: "Rita Santos", dataNascimento: "2018-09-05", cor: "violet" },
  { id: "child-3", userId: "user-3", nome: "Tiago Costa", dataNascimento: "2016-11-22", cor: "indigo" }
];

const DEMO_ACTIVITIES: Activity[] = [
  { id: "act-me-1a", childId: "child-me-1", nome: "Rugby", local: "Campo de Rugby das Olaias", diaSemana: "Terça-feira", hora: "18:00", observacoes: "Treino principal, levar sapatilhas e protetor bocal." },
  { id: "act-me-1b", childId: "child-me-1", nome: "Rugby", local: "Campo de Rugby das Olaias", diaSemana: "Quinta-feira", hora: "18:00", observacoes: "Treino principal, levar sapatilhas e protetor bocal." },
  { id: "act-me-2", childId: "child-me-1", nome: "Inglês", local: "British Council", diaSemana: "Quinta-feira", hora: "15:30", observacoes: "Levar o livro azul de exercícios." },
  { id: "act-me-3a", childId: "child-me-2", nome: "Rugby", local: "Campo de Rugby das Olaias", diaSemana: "Terça-feira", hora: "18:00", observacoes: "Treino de iniciantes, levar protetor bocal." },
  { id: "act-me-3b", childId: "child-me-2", nome: "Rugby", local: "Campo de Rugby das Olaias", diaSemana: "Quinta-feira", hora: "18:00", observacoes: "Treino de iniciantes, levar protetor bocal." },
  { id: "act-me-4", childId: "child-me-2", nome: "Surf", local: "Praia de Carcavelos", diaSemana: "Sábado", hora: "10:30", observacoes: "Fato de surf, toalha e protetor solar." },
  { id: "act-me-5", childId: "child-me-3", nome: "Ballet", local: "Academia de Dança do Parque", diaSemana: "Quarta-feira", hora: "16:30", observacoes: "Vestir collants e totó no cabelo." },
  { id: "act-me-6", childId: "child-me-3", nome: "Música", local: "Conservatório Regional", diaSemana: "Terça-feira", hora: "15:00", observacoes: "Levar flauta de bisel e caderno de pauta." },
  { id: "act-1-1", childId: "child-1", nome: "Futebol Infantis", local: "Estádio Municipal", diaSemana: "Segunda-feira", hora: "18:00" },
  { id: "act-1-2", childId: "child-1", nome: "Natação Treino", local: "Piscina Municipal", diaSemana: "Quarta-feira", hora: "17:30" },
  { id: "act-2-1", childId: "child-2", nome: "Ballet", local: "Academia de Dança", diaSemana: "Terça-feira", hora: "18:30" },
  { id: "act-3-1", childId: "child-3", nome: "Explicações e Apoio", local: "Sala de Estudo Saber+", diaSemana: "Quinta-feira", hora: "16:30" },
  { id: "act-3-2", childId: "child-3", nome: "Futebol Infantis", local: "Estádio Municipal", diaSemana: "Segunda-feira", hora: "18:00" }
];

const DEMO_RIDE_REQUESTS: RideRequest[] = [
  { id: "ride-1", userId: "user-1", childId: "child-1", activityId: "act-1-2", data: new Date(Date.now() + 2 * 24 * 3600000).toISOString().split('T')[0], hora: "17:30", observacao: "É preciso ir buscar à escola e entregar na entrada das piscinas.", estado: "Pendente", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "ride-2", userId: "user-2", childId: "child-2", activityId: "act-2-1", data: new Date(Date.now() + 1 * 24 * 3600000).toISOString().split('T')[0], hora: "18:30", observacao: "Eu posso levá-la, mas preciso de boleia de volta para ela.", estado: "Aceite", acceptedBy: "user-3", createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "ride-3", userId: "user-me", childId: "child-me-1", activityId: "act-me-2", data: new Date(Date.now() + 4 * 24 * 3600000).toISOString().split('T')[0], hora: "15:30", observacao: "Boleia de ida, do colégio para o British Council por favor.", estado: "Pendente", createdAt: new Date().toISOString() },
  { id: "ride-me-rugby", userId: "user-me", childId: "child-me-1", activityId: "act-me-1a", data: new Date(Date.now() + 3 * 24 * 3600000).toISOString().split('T')[0], hora: "18:00", observacao: "Treino no campo de Rugby das Olaias. Conseguem ajudar com o regresso?", estado: "Aceite", acceptedBy: "user-1", createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: "ride-me-surf", userId: "user-me", childId: "child-me-2", activityId: "act-me-4", data: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split('T')[0], hora: "10:30", observacao: "Levar prancha e fato de surf. Ir buscar a casa e entregar na praia.", estado: "Pendente", createdAt: new Date(Date.now() - 1 * 3600000).toISOString() }
];

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  { id: "notif-1", userId: "user-me", titulo: "Bem-vinda ao Crianças à Boleia!", mensagem: "Agora pode gerir as boleias escolares de forma simples.", lida: false, createdAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "notif-2", userId: "user-me", titulo: "Novo Pedido Pendente no Grupo", mensagem: "O João pediu uma boleia para o Gonçalo para a Natação Treino.", lida: false, createdAt: new Date(Date.now() - 3600000).toISOString() }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirebaseActive, setIsFirebaseActive] = useState(isFirebaseEnabled);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const getLocalStorageOrPreload = <T,>(key: string, preload: T[]): T[] => {
    const saved = localStorage.getItem(`cab_${key}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem(`cab_${key}`, JSON.stringify(preload));
    return preload;
  };

  const saveToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(`cab_${key}`, JSON.stringify(data));
  };

  useEffect(() => {
    if (!isFirebaseEnabled || !isFirebaseActive) {
      const savedUser = localStorage.getItem('cab_current_user');
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch (_) {}
      } else {
        const defaultMe = DEMO_USERS[0];
        setCurrentUser(defaultMe);
        localStorage.setItem('cab_current_user', JSON.stringify(defaultMe));
      }
      setUsers(getLocalStorageOrPreload('users', DEMO_USERS));
      setChildrenList(getLocalStorageOrPreload('children', DEMO_CHILDREN));
      setActivities(getLocalStorageOrPreload('activities', DEMO_ACTIVITIES));
      setRideRequests(getLocalStorageOrPreload('rideRequests', DEMO_RIDE_REQUESTS));
      setNotifications(getLocalStorageOrPreload('notifications', DEMO_NOTIFICATIONS));
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeAuth = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        try {
          const docRef = doc(db!, "users", user.uid);
          const docSnap = await getDoc(docRef);
          let profile: UserProfile;
          if (docSnap.exists()) {
            profile = { id: user.uid, ...docSnap.data() } as UserProfile;
          } else {
            profile = { id: user.uid, nome: user.displayName || user.email?.split('@')[0] || 'Utilizador', email: user.email || '', telefone: '' };
            await setDoc(docRef, profile);
          }
          setCurrentUser(profile);
        } catch (e) {
          console.error("Error loading profile from Firestore", e);
          setCurrentUser({ id: user.uid, nome: user.email?.split('@')[0] || 'Pai/Mãe', email: user.email || '', telefone: '' });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    const unsubs: (() => void)[] = [];
    const subscribeCollection = (colName: string, setter: React.Dispatch<React.SetStateAction<any[]>>, op: OperationType) => {
      try {
        const q = collection(db!, colName);
        const u = onSnapshot(q, (snapshot) => {
          setter(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => handleFirestoreError(error, op, colName));
        unsubs.push(u);
      } catch (err) { console.error(`Failed to subscribe to ${colName}:`, err); }
    };

    subscribeCollection("users", setUsers, OperationType.LIST);
    subscribeCollection("children", setChildrenList, OperationType.LIST);
    subscribeCollection("activities", setActivities, OperationType.LIST);
    subscribeCollection("rideRequests", setRideRequests, OperationType.LIST);
    subscribeCollection("notifications", setNotifications, OperationType.LIST);

    return () => { unsubscribeAuth(); unsubs.forEach(u => u()); };
  }, [isFirebaseActive]);

  useEffect(() => { if (!isFirebaseActive && !loading) saveToLocalStorage('users', users); }, [users, isFirebaseActive, loading]);
  useEffect(() => { if (!isFirebaseActive && !loading) saveToLocalStorage('children', childrenList); }, [childrenList, isFirebaseActive, loading]);
  useEffect(() => { if (!isFirebaseActive && !loading) saveToLocalStorage('activities', activities); }, [activities, isFirebaseActive, loading]);
  useEffect(() => { if (!isFirebaseActive && !loading) saveToLocalStorage('rideRequests', rideRequests); }, [rideRequests, isFirebaseActive, loading]);
  useEffect(() => { if (!isFirebaseActive && !loading) saveToLocalStorage('notifications', notifications); }, [notifications, isFirebaseActive, loading]);

  const loginEmail = async (email: string, password: string) => {
    setAuthError(null);
    if (!isFirebaseActive) {
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        setCurrentUser(existingUser);
        localStorage.setItem('cab_current_user', JSON.stringify(existingUser));
      } else {
        const newUser: UserProfile = { id: `user-${Date.now()}`, nome: email.split('@')[0], email, telefone: '' };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        localStorage.setItem('cab_current_user', JSON.stringify(newUser));
      }
      return;
    }
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth!, email, password);
    } catch (e: any) {
      setAuthError(e.message || "Erro ao efetuar o login.");
      throw e;
    } finally { setLoading(false); }
  };

  const registerEmail = async (email: string, password: string, nome: string, telefone: string) => {
    setAuthError(null);
    if (!isFirebaseActive) {
      const newUser: UserProfile = { id: `user-${Date.now()}`, nome, email, telefone };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('cab_current_user', JSON.stringify(newUser));
      return;
    }
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      const uid = userCredential.user.uid;
      const profile: UserProfile = { id: uid, nome, email, telefone };
      await setDoc(doc(db!, "users", uid), profile);
      setCurrentUser(profile);
      await addDoc(collection(db!, "notifications"), {
        userId: uid, titulo: "Bem-vinda ao Crianças à Boleia!",
        mensagem: `Olá ${nome}, registou-se com sucesso!`, lida: false, createdAt: new Date().toISOString()
      });
    } catch (e: any) {
      setAuthError(e.message || "Erro ao efetuar o registo.");
      throw e;
    } finally { setLoading(false); }
  };

  const recoverPassword = async (email: string) => {
    setResetSent(false);
    if (!isFirebaseActive) { setResetSent(true); return; }
    try {
      await sendPasswordResetEmail(auth!, email);
      setResetSent(true);
    } catch (e: any) { setAuthError(e.message || "Erro ao enviar email."); throw e; }
  };

  const logout = async () => {
    if (!isFirebaseActive) {
      setCurrentUser(null);
      localStorage.removeItem('cab_current_user');
      return;
    }
    try { await signOut(auth!); setCurrentUser(null); } catch (e) { console.error("Logout Error", e); }
  };

  const updateProfile = async (nome: string, telefone: string, foto?: string) => {
    if (!currentUser) return;
    const updated: UserProfile = { ...currentUser, nome, telefone, ...(foto ? { foto } : {}) };
    if (!isFirebaseActive) {
      setCurrentUser(updated);
      localStorage.setItem('cab_current_user', JSON.stringify(updated));
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
      return;
    }
    try {
      await setDoc(doc(db!, "users", currentUser.id), updated, { merge: true });
      setCurrentUser(updated);
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.id}`); }
  };

  const addChild = async (nome: string, dataNascimento: string, foto?: string, cor?: string): Promise<Child> => {
    if (!currentUser) throw new Error("Deve iniciar sessão.");
    const newId = `child-${Date.now()}`;
    const defaultColorKeys = ["blue", "rose", "amber", "emerald", "violet", "indigo", "cyan", "orange"];
    const chosenColor = cor || defaultColorKeys[childrenList.length % defaultColorKeys.length];
    const newChild: Child = { id: newId, userId: currentUser.id, nome, dataNascimento, ...(foto ? { foto } : {}), cor: chosenColor };
    if (!isFirebaseActive) { setChildrenList(prev => [...prev, newChild]); return newChild; }
    try {
      await setDoc(doc(db!, "children", newId), newChild);
      return newChild;
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `children/${newId}`); throw error; }
  };

  const updateChild = async (childId: string, nome: string, dataNascimento: string, foto?: string, cor?: string): Promise<Child | undefined> => {
    const currentChild = childrenList.find(c => c.id === childId);
    if (!currentChild) throw new Error("Criança não encontrada.");
    const updatedChild: Child = { ...currentChild, nome, dataNascimento, ...(foto ? { foto } : {}), cor: cor || currentChild.cor };
    if (!isFirebaseActive) { setChildrenList(prev => prev.map(c => c.id === childId ? updatedChild : c)); return updatedChild; }
    try {
      await setDoc(doc(db!, "children", childId), updatedChild, { merge: true });
      return updatedChild;
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `children/${childId}`); }
  };

  const removeChild = async (childId: string) => {
    if (!isFirebaseActive) {
      setChildrenList(prev => prev.filter(c => c.id !== childId));
      setActivities(prev => prev.filter(a => a.childId !== childId));
      setRideRequests(prev => prev.filter(r => r.childId !== childId));
      return;
    }
    try { await deleteDoc(doc(db!, "children", childId)); } catch (error) { handleFirestoreError(error, OperationType.DELETE, `children/${childId}`); }
  };

  const addActivity = async (childId: string, nome: string, local: string, diaSemana: Activity['diaSemana'], hora: string, observacoes?: string): Promise<Activity> => {
    const newId = `act-${Date.now()}`;
    const newAct: Activity = { id: newId, childId, nome, local, diaSemana, hora, ...(observacoes ? { observacoes } : {}) };
    if (!isFirebaseActive) { setActivities(prev => [...prev, newAct]); return newAct; }
    try {
      await setDoc(doc(db!, "activities", newId), newAct);
      return newAct;
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `activities/${newId}`); throw error; }
  };

  const updateActivity = async (activityId: string, nome: string, local: string, diaSemana: Activity['diaSemana'], hora: string, observacoes?: string): Promise<Activity | undefined> => {
    const currentAct = activities.find(a => a.id === activityId);
    if (!currentAct) throw new Error("Atividade não encontrada.");
    const updatedAct: Activity = { ...currentAct, nome, local, diaSemana, hora, ...(observacoes ? { observacoes } : {}) };
    if (!isFirebaseActive) { setActivities(prev => prev.map(a => a.id === activityId ? updatedAct : a)); return updatedAct; }
    try {
      await setDoc(doc(db!, "activities", activityId), updatedAct, { merge: true });
      return updatedAct;
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `activities/${activityId}`); }
  };

  const removeActivity = async (activityId: string) => {
    if (!isFirebaseActive) {
      setActivities(prev => prev.filter(a => a.id !== activityId));
      setRideRequests(prev => prev.filter(r => r.activityId !== activityId));
      return;
    }
    try { await deleteDoc(doc(db!, "activities", activityId)); } catch (error) { handleFirestoreError(error, OperationType.DELETE, `activities/${activityId}`); }
  };

  const createRideRequest = async (childId: string, activityId: string, data: string, hora: string, observacao?: string, outroNome?: string, outroLocal?: string) => {
    if (!currentUser) throw new Error("Deve estar logado.");
    const id = `ride-${Date.now()}`;
    const newRequest: RideRequest = { id, userId: currentUser.id, childId, activityId, ...(outroNome ? { outroNome } : {}), ...(outroLocal ? { outroLocal } : {}), data, hora, ...(observacao ? { observacao } : {}), estado: "Pendente", createdAt: new Date().toISOString() };
    if (!isFirebaseActive) { setRideRequests(prev => [newRequest, ...prev]); return; }
    try {
      await setDoc(doc(db!, "rideRequests", id), newRequest);
    } catch (error) { handleFirestoreError(error, OperationType.WRITE, `rideRequests/${id}`); }
  };

  const acceptRideRequest = async (requestId: string) => {
    if (!currentUser) return;
    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: "Aceite" as RideRequestStatus, acceptedBy: currentUser.id } : r));
      return;
    }
    try {
      await updateDoc(doc(db!, "rideRequests", requestId), { estado: "Aceite", acceptedBy: currentUser.id });
    } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`); }
  };

  const cancelRideRequest = async (requestId: string) => {
    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: "Cancelado" as RideRequestStatus } : r));
      return;
    }
    try { await updateDoc(doc(db!, "rideRequests", requestId), { estado: "Cancelado" }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`); }
  };

  const completeRideRequest = async (requestId: string) => {
    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => r.id === requestId ? { ...r, estado: "Concluído" as RideRequestStatus } : r));
      return;
    }
    try { await updateDoc(doc(db!, "rideRequests", requestId), { estado: "Concluído" }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`); }
  };

  const declineRideRequest = async (requestId: string) => {
    if (!currentUser) return;
    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => r.id === requestId && r.acceptedBy === currentUser.id ? { ...r, estado: "Pendente" as RideRequestStatus, acceptedBy: "" } : r));
      return;
    }
    try { await updateDoc(doc(db!, "rideRequests", requestId), { estado: "Pendente", acceptedBy: "" }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`); }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!isFirebaseActive) { setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n)); return; }
    try { await updateDoc(doc(db!, "notifications", id), { lida: true }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`); }
  };

  const clearAllNotifications = async () => {
    if (!currentUser) return;
    if (!isFirebaseActive) { setNotifications([]); return; }
    try {
      const batch = writeBatch(db!);
      const q = query(collection(db!, "notifications"), where("userId", "==", currentUser.id));
      const querySnap = await getDocs(q);
      querySnap.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch (error) { handleFirestoreError(error, OperationType.DELETE, `notifications/bulk`); }
  };

  const getSuggestionsForActivity = (childId: string, activityId: string) => {
    const suggestions: { type: 'info' | 'warning' | 'success'; message: string }[] = [];
    suggestions.push({ type: 'info', message: 'A boleia partilhada poupa tempo aos pais e reduz emissões. Envie com confiança!' });
    return suggestions;
  };

  const resetDemoData = () => {
    localStorage.removeItem('cab_users');
    localStorage.removeItem('cab_children');
    localStorage.removeItem('cab_activities');
    localStorage.removeItem('cab_rideRequests');
    localStorage.removeItem('cab_notifications');
    localStorage.removeItem('cab_current_user');
    setCurrentUser(DEMO_USERS[0]);
    localStorage.setItem('cab_current_user', JSON.stringify(DEMO_USERS[0]));
    setUsers(DEMO_USERS);
    setChildrenList(DEMO_CHILDREN);
    setActivities(DEMO_ACTIVITIES);
    setRideRequests(DEMO_RIDE_REQUESTS);
    setNotifications(DEMO_NOTIFICATIONS);
    alert("Dados de demonstração repostos com sucesso!");
  };

  const myChildren = childrenList.filter(c => c.userId === currentUser?.id);
  const myRideRequests = rideRequests.filter(r => r.userId === currentUser?.id);
  const groupMembers: AppGroupMember[] = users.map(user => ({ user, children: childrenList.filter(c => c.userId === user.id) }));

  return (
    <AppContext.Provider value={{
      isFirebaseActive, currentUser, loading, authError, resetSent,
      loginEmail, registerEmail, logout, recoverPassword, updateProfile,
      users, children: childrenList, activities, rideRequests, notifications,
      myChildren, myRideRequests, groupMembers,
      createRideRequest, acceptRideRequest, cancelRideRequest, completeRideRequest, declineRideRequest,
      addChild, updateChild, removeChild, addActivity, updateActivity, removeActivity,
      markNotificationAsRead, clearAllNotifications, getSuggestionsForActivity, resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};

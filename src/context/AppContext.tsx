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

// Define the interface for our application context
interface AppContextType {
  // Authentication & Mode
  isFirebaseActive: boolean;
  currentUser: UserProfile | null;
  loading: boolean;
  authError: string | null;
  resetSent: boolean;
  
  // Actions for Auth
  loginEmail: (email: string, password: md5OrPlain) => Promise<void>;
  registerEmail: (email: string, password: md5OrPlain, nome: string, telefone: string) => Promise<void>;
  logout: () => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  updateProfile: (nome: string, telefone: string, foto?: string) => Promise<void>;
  
  // App Collections
  users: UserProfile[];
  children: Child[];
  activities: Activity[];
  rideRequests: RideRequest[];
  notifications: NotificationItem[];
  
  // Getters & Derived State
  myChildren: Child[];
  myRideRequests: RideRequest[];
  groupMembers: AppGroupMember[];
  
  // Ride actions
  createRideRequest: (childId: string, activityId: string, data: string, hora: string, observacao?: string, outroNome?: string, outroLocal?: string) => Promise<void>;
  acceptRideRequest: (requestId: string) => Promise<void>;
  cancelRideRequest: (requestId: string) => Promise<void>;
  completeRideRequest: (requestId: string) => Promise<void>;
  declineRideRequest: (requestId: string) => Promise<void>; // release acceptance back to Pending
  
  // Child & Activity Actions
  addChild: (nome: string, dataNascimento: string, foto?: string, cor?: string) => Promise<Child>;
  updateChild: (childId: string, nome: string, dataNascimento: string, foto?: string, cor?: string) => Promise<Child | undefined>;
  removeChild: (childId: string) => Promise<void>;
  addActivity: (childId: string, nome: string, local: string, diaSemana: Activity['diaSemana'], hora: string, observacoes?: string) => Promise<Activity>;
  updateActivity: (activityId: string, nome: string, local: string, diaSemana: Activity['diaSemana'], hora: string, observacoes?: string) => Promise<Activity | undefined>;
  removeActivity: (activityId: string) => Promise<void>;
  
  // Notifications Actions
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Intelligence Suggestions Engine
  getSuggestionsForActivity: (childId: string, activityId: string) => { type: 'info' | 'warning' | 'success'; message: string }[];
  resetDemoData: () => void;
}

type md5OrPlain = string;

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PRELOADED PORTUGUESE DEMO/FALLBACK DATA ---
const DEMO_USERS: UserProfile[] = [
  {
    id: "user-me",
    nome: "Rita Campina",
    email: "ritacampina@gmail.com",
    telefone: "911223344",
    foto: "/src/assets/images/rita_campina_1780768561858.png"
  },
  {
    id: "user-1",
    nome: "João Silva",
    email: "joao.silva@gmail.com",
    telefone: "912345678",
    foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop"
  },
  {
    id: "user-2",
    nome: "Maria Santos",
    email: "maria.santos@gmail.com",
    telefone: "934567890",
    foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop"
  },
  {
    id: "user-3",
    nome: "Ana Costa",
    email: "ana.costa@hotmail.com",
    telefone: "967890123",
    foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop"
  }
];

const DEMO_CHILDREN: Child[] = [
  // Kids of Rita (user-me)
  {
    id: "child-me-1",
    userId: "user-me",
    nome: "Manuel",
    dataNascimento: "2018-03-15",
    foto: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop",
    cor: "blue"
  },
  {
    id: "child-me-2",
    userId: "user-me",
    nome: "Maria",
    dataNascimento: "2016-05-10",
    foto: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&auto=format&fit=crop",
    cor: "rose"
  },
  {
    id: "child-me-3",
    userId: "user-me",
    nome: "João Afonso",
    dataNascimento: "2020-09-20",
    foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop",
    cor: "amber"
  },
  // Kids of Joao
  {
    id: "child-1",
    userId: "user-1",
    nome: "Gonçalo Silva",
    dataNascimento: "2017-04-12",
    foto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop",
    cor: "emerald"
  },
  // Kids of Maria
  {
    id: "child-2",
    userId: "user-2",
    nome: "Rita Santos",
    dataNascimento: "2018-09-05",
    foto: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop",
    cor: "violet"
  },
  // Kids of Ana
  {
    id: "child-3",
    userId: "user-3",
    nome: "Tiago Costa",
    dataNascimento: "2016-11-22",
    foto: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&auto=format&fit=crop",
    cor: "indigo"
  }
];

const DEMO_ACTIVITIES: Activity[] = [
  // Margarida
  {
    id: "act-me-1a",
    childId: "child-me-1",
    nome: "Rugby",
    local: "Campo de Rugby das Olaias",
    diaSemana: "Terça-feira",
    hora: "18:00",
    observacoes: "Treino principal, levar sapatilhas e protetor bocal."
  },
  {
    id: "act-me-1b",
    childId: "child-me-1",
    nome: "Rugby",
    local: "Campo de Rugby das Olaias",
    diaSemana: "Quinta-feira",
    hora: "18:00",
    observacoes: "Treino principal, levar sapatilhas e protetor bocal."
  },
  {
    id: "act-me-2",
    childId: "child-me-1",
    nome: "Inglês",
    local: "British Council",
    diaSemana: "Quinta-feira",
    hora: "15:30",
    observacoes: "Levar o livro azul de exercícios."
  },
  // Pedro
  {
    id: "act-me-3a",
    childId: "child-me-2",
    nome: "Rugby",
    local: "Campo de Rugby das Olaias",
    diaSemana: "Terça-feira",
    hora: "18:00",
    observacoes: "Treino de iniciantes, levar protetor bocal."
  },
  {
    id: "act-me-3b",
    childId: "child-me-2",
    nome: "Rugby",
    local: "Campo de Rugby das Olaias",
    diaSemana: "Quinta-feira",
    hora: "18:00",
    observacoes: "Treino de iniciantes, levar protetor bocal."
  },
  {
    id: "act-me-4",
    childId: "child-me-2",
    nome: "Surf",
    local: "Praia de Carcavelos",
    diaSemana: "Sábado",
    hora: "10:30",
    observacoes: "Fato de surf, toalha e protetor solar."
  },
  // Leonor
  {
    id: "act-me-5",
    childId: "child-me-3",
    nome: "Ballet",
    local: "Academia de Dança do Parque",
    diaSemana: "Quarta-feira",
    hora: "16:30",
    observacoes: "Vestir collants e totó no cabelo."
  },
  {
    id: "act-me-6",
    childId: "child-me-3",
    nome: "Música",
    local: "Conservatório Regional",
    diaSemana: "Terça-feira",
    hora: "15:00",
    observacoes: "Levar flauta de bisel e caderno de pauta."
  },
  // Gonçalo (Joao)
  {
    id: "act-1-1",
    childId: "child-1",
    nome: "Futebol Infantis",
    local: "Estádio Municipal",
    diaSemana: "Segunda-feira",
    hora: "18:00",
    observacoes: "Treino no campo sintético 2."
  },
  {
    id: "act-1-2",
    childId: "child-1",
    nome: "Natação Treino",
    local: "Piscina Municipal",
    diaSemana: "Quarta-feira",
    hora: "17:30",
    observacoes: "Levar touca e óculos de piscina."
  },
  // Rita (Maria)
  {
    id: "act-2-1",
    childId: "child-2",
    nome: "Ballet",
    local: "Academia de Dança",
    diaSemana: "Terça-feira",
    hora: "18:30"
  },
  // Tiago (Ana)
  {
    id: "act-3-1",
    childId: "child-3",
    nome: "Explicações e Apoio",
    local: "Sala de Estudo Saber+",
    diaSemana: "Quinta-feira",
    hora: "16:30"
  },
  {
    id: "act-3-2",
    childId: "child-3",
    // Tiago também anda no futebol desportivo no mesmo sítio e no mesmo dia/hora que o Gonçalo!
    nome: "Futebol Infantis",
    local: "Estádio Municipal",
    diaSemana: "Segunda-feira",
    hora: "18:00",
    observacoes: "Parceiro de treino do Gonçalo."
  }
];

const DEMO_RIDE_REQUESTS: RideRequest[] = [
  {
    id: "ride-1",
    userId: "user-1", // Joao pede
    childId: "child-1", // Gonçalo
    activityId: "act-1-2", // Natação
    data: new Date(Date.now() + 2 * 24 * 3600000).toISOString().split('T')[0], // 2 dias daqui
    hora: "17:30",
    observacao: "É preciso ir buscar à escola e entregar na entrada das piscinas.",
    estado: "Pendente",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "ride-2",
    userId: "user-2", // Maria pede
    childId: "child-2", // Rita
    activityId: "act-2-1", // Ballet
    data: new Date(Date.now() + 1 * 24 * 3600000).toISOString().split('T')[0], // amanhã
    hora: "18:30",
    observacao: "Eu posso levá-la, mas preciso de boleia de volta para ela.",
    estado: "Aceite",
    acceptedBy: "user-3", // Ana Costa aceitou!
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: "ride-3",
    userId: "user-me", // Eu pedi
    childId: "child-me-1", // Manuel
    activityId: "act-me-2", // Inglês
    data: new Date(Date.now() + 4 * 24 * 3600000).toISOString().split('T')[0], // 4 dias daqui
    hora: "15:30",
    observacao: "Boleia de ida, do colégio para o British Council por favor.",
    estado: "Pendente",
    createdAt: new Date().toISOString()
  },
  {
    id: "ride-me-rugby",
    userId: "user-me", // Eu pedi
    childId: "child-me-1", // Manuel
    activityId: "act-me-1a", // Rugby Terça
    data: new Date(Date.now() + 3 * 24 * 3600000).toISOString().split('T')[0],
    hora: "18:00",
    observacao: "Treino no campo de Rugby das Olaias. Conseguem ajudar com o regresso?",
    estado: "Aceite",
    acceptedBy: "user-1", // João Silva
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "ride-me-surf",
    userId: "user-me", // Eu pedi
    childId: "child-me-2", // Maria
    activityId: "act-me-4", // Surf Sábado
    data: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split('T')[0],
    hora: "10:30",
    observacao: "Levar prancha e fato de surf. Ir buscar a casa e entregar na praia.",
    estado: "Pendente",
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    userId: "user-me",
    titulo: "Bem-vinda ao Crianças à Boleia!",
    mensagem: "Agora pode gerir as boleias escolares de forma simples. Comece por registar os seus filhos e as suas atividades.",
    lida: false,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: "notif-2",
    userId: "user-me",
    titulo: "Novo Pedido Pendente no Grupo",
    mensagem: "O João pediu uma boleia para o Gonçalo para a Natação Treino d'aqui a 2 dias. Consegue ajudar?",
    lida: false,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- IN-MEMORY/LOCALSTATE ---
  const [isFirebaseActive, setIsFirebaseActive] = useState(isFirebaseEnabled);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Database Collections State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Local helper to load states from LocalStorage or preloads
  const getLocalStorageOrPreload = <T,>(key: string, preload: T[]): T[] => {
    const saved = localStorage.getItem(`cab_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing LocalStorage for ${key}, resetting to default`, e);
      }
    }
    // Store default preloads
    localStorage.setItem(`cab_${key}`, JSON.stringify(preload));
    return preload;
  };

  const saveToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(`cab_${key}`, JSON.stringify(data));
  };

  // --- FIREBASE SUBSCRIBERS / SYNC FOR LIVE MODE ---
  useEffect(() => {
    if (!isFirebaseEnabled || !isFirebaseActive) {
      // Fallback mode: Load everything from local storage
      const savedUser = localStorage.getItem('cab_current_user');
      if (savedUser) {
        try {
          let userObj = JSON.parse(savedUser);
          if (userObj.id === 'user-me' && (!userObj.foto || userObj.foto.includes('photo-1544005313-94ddf0286df2'))) {
            userObj.foto = "/src/assets/images/rita_campina_1780768561858.png";
            localStorage.setItem('cab_current_user', JSON.stringify(userObj));
          }
          setCurrentUser(userObj);
        } catch (_) {}
      } else {
        // Log in dummy user by default to make onboarding immediate
        const defaultMe = DEMO_USERS.find(u => u.id === 'user-me') || DEMO_USERS[0];
        setCurrentUser(defaultMe);
        localStorage.setItem('cab_current_user', JSON.stringify(defaultMe));
      }

      let loadedUsers = getLocalStorageOrPreload('users', DEMO_USERS);
      loadedUsers = loadedUsers.map(u => {
        if (u.id === 'user-me' && (!u.foto || u.foto.includes('photo-1544005313-94ddf0286df2'))) {
          return { ...u, foto: "/src/assets/images/rita_campina_1780768561858.png" };
        }
        return u;
      });
      setUsers(loadedUsers);
      
      const initialChildren = getLocalStorageOrPreload('children', DEMO_CHILDREN);
      const initialActivities = getLocalStorageOrPreload('activities', DEMO_ACTIVITIES);

      setChildrenList(initialChildren);
      setActivities(initialActivities);
      setRideRequests(getLocalStorageOrPreload('rideRequests', DEMO_RIDE_REQUESTS));
      setNotifications(getLocalStorageOrPreload('notifications', DEMO_NOTIFICATIONS));
      setLoading(false);
      return;
    }

    // REAL FIREBASE LOGIC
    setLoading(true);
    const unsubscribeAuth = onAuthStateChanged(auth!, async (user) => {
      if (user) {
        try {
          // Fetch user profile from DB
          const docRef = doc(db!, "users", user.uid);
          const docSnap = await getDoc(docRef);
          
          let profile: UserProfile;
          if (docSnap.exists()) {
            profile = { id: user.uid, ...docSnap.data() } as UserProfile;
          } else {
            // Create user profile if doesn't exist
            profile = {
              id: user.uid,
              nome: user.displayName || user.email?.split('@')[0] || 'Utilizador',
              email: user.email || '',
              telefone: '',
              foto: user.photoURL || undefined
            };
            await setDoc(docRef, profile);
          }
          setCurrentUser(profile);
          localStorage.setItem('cab_current_user', JSON.stringify(profile));
        } catch (e) {
          console.error("Error loading profile from Firestore", e);
          const mockUser: UserProfile = {
            id: user.uid,
            nome: user.email?.split('@')[0] || 'Pai/Mãe',
            email: user.email || '',
            telefone: ''
          };
          setCurrentUser(mockUser);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('cab_current_user');
      }
      setLoading(false);
    }, (error) => {
      console.error("Auth status change error", error);
      setLoading(false);
    });

    // Subscriptions to live database collections
    const unsubs: (() => void)[] = [];

    const subscribeCollection = (colName: string, setter: React.Dispatch<React.SetStateAction<any[]>>, op: OperationType) => {
      try {
        const q = collection(db!, colName);
        const u = onSnapshot(q, (snapshot) => {
          const list: any[] = [];
          snapshot.forEach((snapDoc) => {
            list.push({ id: snapDoc.id, ...snapDoc.data() });
          });
          setter(list);
        }, (error) => {
          // Meeting strict schema feedback requested in skill Section 3
          handleFirestoreError(error, op, colName);
        });
        unsubs.push(u);
      } catch (err) {
        console.error(`Failed to subscribe to ${colName}:`, err);
      }
    };

    subscribeCollection("users", setUsers, OperationType.LIST);
    subscribeCollection("children", setChildrenList, OperationType.LIST);
    subscribeCollection("activities", setActivities, OperationType.LIST);
    subscribeCollection("rideRequests", setRideRequests, OperationType.LIST);
    subscribeCollection("notifications", setNotifications, OperationType.LIST);

    return () => {
      unsubscribeAuth();
      unsubs.forEach(u => u());
    };
  }, [isFirebaseActive]);

  // Sync state back to local storage whenever they change in Local/Demo mode.
  // CRITICAL: We only sync when loading is false. This prevents overwriting the stored data with empty arrays on initial mount/refresh.
  useEffect(() => {
    if (!isFirebaseActive && !loading) {
      saveToLocalStorage('users', users);
    }
  }, [users, isFirebaseActive, loading]);

  useEffect(() => {
    if (!isFirebaseActive && !loading) {
      saveToLocalStorage('children', childrenList);
    }
  }, [childrenList, isFirebaseActive, loading]);

  useEffect(() => {
    if (!isFirebaseActive && !loading) {
      saveToLocalStorage('activities', activities);
    }
  }, [activities, isFirebaseActive, loading]);

  useEffect(() => {
    if (!isFirebaseActive && !loading) {
      saveToLocalStorage('rideRequests', rideRequests);
    }
  }, [rideRequests, isFirebaseActive, loading]);

  useEffect(() => {
    if (!isFirebaseActive && !loading) {
      saveToLocalStorage('notifications', notifications);
    }
  }, [notifications, isFirebaseActive, loading]);

  // --- AUTO-POPULATE & AUTO-ALIGN OWNERSHIP FOR MAIN 3 KIDS AND THEIR ACTIVITIES (ONE-TIME HEAL & MIGRATE) ---
  useEffect(() => {
    if (!currentUser || loading) return;

    // Check if one-time healing has already been executed for this user/profile session to allow full custom edits & deletes
    const healKey = `cab_healed_v3_${currentUser.id}`;
    const alreadyHealed = localStorage.getItem(healKey);
    if (alreadyHealed === "true") return;

    let updatedChildren = [...childrenList];
    let updatedActivities = [...activities];
    let updatedRideRequests = [...rideRequests];
    let changed = false;

    // 1. Ensure the 3 kids exist and are owned by the currently logged-in user with correct names
    const defaultKids = [
      {
        id: "child-me-1",
        userId: currentUser.id,
        nome: "Manuel",
        dataNascimento: "2018-03-15",
        foto: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop"
      },
      {
        id: "child-me-2",
        userId: currentUser.id,
        nome: "Maria",
        dataNascimento: "2016-05-10",
        foto: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=150&auto=format&fit=crop"
      },
      {
        id: "child-me-3",
        userId: currentUser.id,
        nome: "João Afonso",
        dataNascimento: "2020-09-20",
        foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop"
      }
    ];

    defaultKids.forEach(defKid => {
      const existingIndex = updatedChildren.findIndex(c => c.id === defKid.id);
      if (existingIndex === -1) {
        updatedChildren.push(defKid);
        changed = true;
      } else {
        const existingKid = updatedChildren[existingIndex];
        if (existingKid.nome !== defKid.nome || existingKid.userId !== currentUser.id) {
          updatedChildren[existingIndex] = {
            ...existingKid,
            nome: defKid.nome,
            userId: currentUser.id
          };
          changed = true;
        }
      }
    });

    // 2. Ensure activities for the 3 kids exist and relate to correct IDs
    const defaultActs: Activity[] = [
      {
        id: "act-me-1a",
        childId: "child-me-1",
        nome: "Rugby",
        local: "Campo de Rugby das Olaias",
        diaSemana: "Terça-feira",
        hora: "18:00",
        observacoes: "Treino principal, levar sapatilhas e protetor bocal."
      },
      {
        id: "act-me-1b",
        childId: "child-me-1",
        nome: "Rugby",
        local: "Campo de Rugby das Olaias",
        diaSemana: "Quinta-feira",
        hora: "18:00",
        observacoes: "Treino principal, levar sapatilhas e protetor bocal."
      },
      {
        id: "act-me-2",
        childId: "child-me-1",
        nome: "Inglês",
        local: "British Council",
        diaSemana: "Quinta-feira",
        hora: "15:30",
        observacoes: "Levar o livro azul de exercícios."
      },
      {
        id: "act-me-3a",
        childId: "child-me-2",
        nome: "Rugby",
        local: "Campo de Rugby das Olaias",
        diaSemana: "Terça-feira",
        hora: "18:00",
        observacoes: "Treino de iniciantes, levar protetor bocal."
      },
      {
        id: "act-me-3b",
        childId: "child-me-2",
        nome: "Rugby",
        local: "Campo de Rugby das Olaias",
        diaSemana: "Quinta-feira",
        hora: "18:00",
        observacoes: "Treino de iniciantes, levar protetor bocal."
      },
      {
        id: "act-me-4",
        childId: "child-me-2",
        nome: "Surf",
        local: "Praia de Carcavelos",
        diaSemana: "Sábado",
        hora: "10:30",
        observacoes: "Fato de surf, toalha e protetor solar."
      },
      {
        id: "act-me-5",
        childId: "child-me-3",
        nome: "Ballet",
        local: "Academia de Dança do Parque",
        diaSemana: "Quarta-feira",
        hora: "16:30",
        observacoes: "Vestir collants e totó no cabelo."
      },
      {
        id: "act-me-6",
        childId: "child-me-3",
        nome: "Música",
        local: "Conservatório Regional",
        diaSemana: "Terça-feira",
        hora: "15:00",
        observacoes: "Levar flauta de bisel e caderno de pauta."
      }
    ];

    defaultActs.forEach(defAct => {
      const existingIndex = updatedActivities.findIndex(a => a.id === defAct.id);
      if (existingIndex === -1) {
        updatedActivities.push(defAct);
        changed = true;
      } else {
        const existingAct = updatedActivities[existingIndex];
        if (existingAct.nome !== defAct.nome || existingAct.childId !== defAct.childId) {
          updatedActivities[existingIndex] = {
            ...existingAct,
            nome: defAct.nome,
            childId: defAct.childId
          };
          changed = true;
        }
      }
    });

    // 3. Ensure the scheduled rides exist
    const defaultRides: RideRequest[] = [
      {
        id: "ride-3",
        userId: currentUser.id,
        childId: "child-me-1", // Manuel
        activityId: "act-me-2", // Inglês
        data: new Date(Date.now() + 4 * 24 * 3600000).toISOString().split('T')[0], // 4 dias daqui
        hora: "15:30",
        observacao: "Boleia de ida, do colégio para o British Council por favor.",
        estado: "Pendente",
        createdAt: new Date().toISOString()
      },
      {
        id: "ride-me-rugby",
        userId: currentUser.id,
        childId: "child-me-1", // Manuel
        activityId: "act-me-1a", // Rugby Terça
        data: new Date(Date.now() + 3 * 24 * 3600000).toISOString().split('T')[0],
        hora: "18:00",
        observacao: "Treino no campo de Rugby das Olaias. Conseguem ajudar com o regresso?",
        estado: "Aceite",
        acceptedBy: "user-1", // João Silva
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: "ride-me-surf",
        userId: currentUser.id,
        childId: "child-me-2", // Maria
        activityId: "act-me-4", // Surf Sábado
        data: new Date(Date.now() + 5 * 24 * 3600000).toISOString().split('T')[0],
        hora: "10:30",
        observacao: "Levar prancha e fato de surf. Ir buscar a casa e entregar na praia.",
        estado: "Pendente",
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
      }
    ];

    defaultRides.forEach(defRide => {
      const existingIndex = updatedRideRequests.findIndex(r => r.id === defRide.id);
      if (existingIndex === -1) {
        updatedRideRequests.push(defRide);
        changed = true;
      } else {
        const existingRide = updatedRideRequests[existingIndex];
        if (existingRide.userId !== currentUser.id || existingRide.childId !== defRide.childId) {
          updatedRideRequests[existingIndex] = {
            ...existingRide,
            userId: currentUser.id,
            childId: defRide.childId,
            activityId: defRide.activityId
          };
          changed = true;
        }
      }
    });

    if (changed || !alreadyHealed) {
      if (!isFirebaseActive) {
        setChildrenList(updatedChildren);
        setActivities(updatedActivities);
        setRideRequests(updatedRideRequests);
        localStorage.setItem('cab_children', JSON.stringify(updatedChildren));
        localStorage.setItem('cab_activities', JSON.stringify(updatedActivities));
        localStorage.setItem('cab_rideRequests', JSON.stringify(updatedRideRequests));
      } else {
        const saveToFirestore = async () => {
          try {
            for (const child of updatedChildren) {
              if (child.id.startsWith("child-me-")) {
                await setDoc(doc(db!, "children", child.id), child, { merge: true });
              }
            }
            for (const act of updatedActivities) {
              if (act.id.startsWith("act-me-")) {
                await setDoc(doc(db!, "activities", act.id), act, { merge: true });
              }
            }
            for (const ride of updatedRideRequests) {
              if (ride.id.startsWith("ride-me-") || ride.id === "ride-3") {
                await setDoc(doc(db!, "rideRequests", ride.id), ride, { merge: true });
              }
            }
          } catch (e) {
            console.error("Failed to auto-heal/sync in Firebase mode:", e);
          }
        };
        saveToFirestore();
      }
      localStorage.setItem(healKey, "true");
    }
  }, [currentUser, loading, isFirebaseActive]);


  // --- AUTHENTICATION ACTIONS ---
  const loginEmail = async (email: string, password: md5OrPlain) => {
    setAuthError(null);
    if (!isFirebaseActive) {
      // Demo Mode Authenticate
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        setCurrentUser(existingUser);
        localStorage.setItem('cab_current_user', JSON.stringify(existingUser));
      } else {
        // Register a fake profile dynamically
        const newUser: UserProfile = {
          id: `user-${Date.now()}`,
          nome: email.split('@')[0],
          email: email,
          telefone: '912345678'
        };
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
      setAuthError(e.message || "Erro ao efetuar o login. Verifique as credenciais.");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const registerEmail = async (email: string, password: md5OrPlain, nome: string, telefone: string) => {
    setAuthError(null);
    if (!isFirebaseActive) {
      // Demo Mode Register
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        nome: nome,
        email: email,
        telefone: telefone
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('cab_current_user', JSON.stringify(newUser));
      
      // Auto-trigger welcome notification
      const welcome: NotificationItem = {
        id: `notif-${Date.now()}`,
        userId: newUser.id,
        titulo: "Bem-vinda ao Crianças à Boleia!",
        mensagem: `Olá ${nome}, registou-se com sucesso! Já pode começar a agendar e coordenar as boleias das suas crianças.`,
        lida: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [welcome, ...prev]);
      return;
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      const uid = userCredential.user.uid;
      const profile: UserProfile = {
        id: uid,
        nome: nome,
        email: email,
        telefone: telefone
      };
      await setDoc(doc(db!, "users", uid), profile);
      setCurrentUser(profile);
      
      // Add a Welcome Notification in Firestore
      await addDoc(collection(db!, "notifications"), {
        userId: uid,
        titulo: "Bem-vinda ao Crianças à Boleia!",
        mensagem: `Olá ${nome}, registou-se com sucesso! Já pode começar a agendar e coordenar as boleias das suas crianças.`,
        lida: false,
        createdAt: new Date().toISOString()
      });
    } catch (e: any) {
      setAuthError(e.message || "Erro ao efetuar o registo. Tente novamente.");
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async (email: string) => {
    setResetSent(false);
    if (!isFirebaseActive) {
      setResetSent(true);
      return;
    }
    
    try {
      await sendPasswordResetEmail(auth!, email);
      setResetSent(true);
    } catch (e: any) {
      setAuthError(e.message || "Erro ao enviar email de recuperação.");
      throw e;
    }
  };

  const logout = async () => {
    if (!isFirebaseActive) {
      setCurrentUser(null);
      localStorage.removeItem('cab_current_user');
      return;
    }
    try {
      await signOut(auth!);
      setCurrentUser(null);
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  const updateProfile = async (nome: string, telefone: string, foto?: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, nome, telefone, foto };
    
    if (!isFirebaseActive) {
      setCurrentUser(updated);
      localStorage.setItem('cab_current_user', JSON.stringify(updated));
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
      return;
    }

    try {
      const docRef = doc(db!, "users", currentUser.id);
      await setDoc(docRef, updated, { merge: true });
      setCurrentUser(updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.id}`);
    }
  };


  // --- KIDS ACTIONS ---
  const addChild = async (nome: string, dataNascimento: string, foto?: string, cor?: string) => {
    if (!currentUser) throw new Error("Deve iniciar sessão para adicionar uma criança.");
    const newId = `child-${Date.now()}`;
    // Fallback default colors in order
    const defaultColorKeys = ["blue", "rose", "amber", "emerald", "violet", "indigo", "cyan", "orange"];
    const chosenColor = cor || defaultColorKeys[childrenList.length % defaultColorKeys.length];
    
    const newChild: Child = {
      id: newId,
      userId: currentUser.id,
      nome,
      dataNascimento,
      foto,
      cor: chosenColor
    };

    if (!isFirebaseActive) {
      setChildrenList(prev => [...prev, newChild]);
      return newChild;
    }

    try {
      await setDoc(doc(db!, "children", newId), newChild);
      return newChild;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `children/${newId}`);
    }
  };

  const updateChild = async (childId: string, nome: string, dataNascimento: string, foto?: string, cor?: string) => {
    const currentChild = childrenList.find(c => c.id === childId);
    if (!currentChild) throw new Error("Criança não encontrada.");

    const updatedChild: Child = {
      ...currentChild,
      nome,
      dataNascimento,
      foto,
      cor: cor || currentChild.cor
    };

    if (!isFirebaseActive) {
      setChildrenList(prev => prev.map(c => c.id === childId ? updatedChild : c));
      return updatedChild;
    }

    try {
      await setDoc(doc(db!, "children", childId), updatedChild, { merge: true });
      return updatedChild;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `children/${childId}`);
    }
  };

  const removeChild = async (childId: string) => {
    if (!isFirebaseActive) {
      setChildrenList(prev => prev.filter(c => c.id !== childId));
      // Remove child activities
      setActivities(prev => prev.filter(a => a.childId !== childId));
      // Cancel pending/accepted rides for child
      setRideRequests(prev => prev.filter(r => r.childId !== childId));
      return;
    }

    try {
      await deleteDoc(doc(db!, "children", childId));
      // Cleanups: normally handled by rules/functions, but we should write client deleting logic
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `children/${childId}`);
    }
  };


  // --- ACTIVITIES ACTIONS ---
  const addActivity = async (
    childId: string, 
    nome: string, 
    local: string, 
    diaSemana: Activity['diaSemana'], 
    hora: string, 
    observacoes?: string
  ) => {
    const newId = `act-${Date.now()}`;
    const newAct: Activity = {
      id: newId,
      childId,
      nome,
      local,
      diaSemana,
      hora,
      observacoes
    };

    if (!isFirebaseActive) {
      setActivities(prev => [...prev, newAct]);
      return newAct;
    }

    try {
      await setDoc(doc(db!, "activities", newId), newAct);
      return newAct;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `activities/${newId}`);
    }
  };

  const updateActivity = async (
    activityId: string,
    nome: string,
    local: string,
    diaSemana: Activity['diaSemana'],
    hora: string,
    observacoes?: string
  ) => {
    const currentAct = activities.find(a => a.id === activityId);
    if (!currentAct) throw new Error("Atividade não encontrada.");
    
    const updatedAct: Activity = {
      ...currentAct,
      nome,
      local,
      diaSemana,
      hora,
      observacoes
    };

    if (!isFirebaseActive) {
      setActivities(prev => prev.map(a => a.id === activityId ? updatedAct : a));
      return updatedAct;
    }

    try {
      await setDoc(doc(db!, "activities", activityId), updatedAct, { merge: true });
      return updatedAct;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `activities/${activityId}`);
    }
  };

  const removeActivity = async (activityId: string) => {
    if (!isFirebaseActive) {
      setActivities(prev => prev.filter(a => a.id !== activityId));
      // Remove requests associated with activity
      setRideRequests(prev => prev.filter(r => r.activityId !== activityId));
      return;
    }

    try {
      await deleteDoc(doc(db!, "activities", activityId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `activities/${activityId}`);
    }
  };


  // --- RIDE REQUESTS ACTIONS ---
  const createRideRequest = async (
    childId: string, 
    activityId: string, 
    data: string, 
    hora: string, 
    observacao?: string,
    outroNome?: string,
    outroLocal?: string
  ) => {
    if (!currentUser) throw new Error("Deve estar logado.");
    const id = `ride-${Date.now()}`;
    const newRequest: RideRequest = {
      id,
      userId: currentUser.id,
      childId,
      activityId,
      outroNome,
      outroLocal,
      data,
      hora,
      observacao,
      estado: "Pendente",
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseActive) {
      setRideRequests(prev => [newRequest, ...prev]);

      // Push a mock notification to OTHER parents to simulate network interactions!
      const notifierParent = currentUser.nome;
      const childName = childrenList.find(c => c.id === childId)?.nome || "Filho";
      const activityName = activityId === "outro" ? (outroNome || "Atividade não programada") : (activities.find(a => a.id === activityId)?.nome || "Atividade");
      
      const newNotifGroup: NotificationItem[] = users
        .filter(u => u.id !== currentUser.id)
        .map(u => ({
          id: `notif-${Date.now()}-${u.id}`,
          userId: u.id,
          titulo: "Novo Pedido de Boleia 🚗",
          mensagem: `${notifierParent} solicitou uma boleia para ${childName} (Atividade: ${activityName}) para o dia ${data} às ${hora}.`,
          lida: false,
          createdAt: new Date().toISOString()
        }));
      setNotifications(prev => [...newNotifGroup, ...prev]);
      return;
    }

    try {
      await setDoc(doc(db!, "rideRequests", id), newRequest);
      
      // Let's publish notifications in Firestore for each other user
      users.forEach(async (u) => {
        if (u.id !== currentUser.id) {
          try {
            const childName = childrenList.find(c => c.id === childId)?.nome || "Filho";
            const activityName = activityId === "outro" ? (outroNome || "Atividade não programada") : (activities.find(a => a.id === activityId)?.nome || "Atividade");
            await addDoc(collection(db!, "notifications"), {
              userId: u.id,
              titulo: "Novo Pedido de Boleia 🚗",
              mensagem: `${currentUser.nome} solicitou uma boleia para ${childName} (Atividade: ${activityName}) para o dia ${data} às ${hora}.`,
              lida: false,
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.error("Failed to create notification inside creation trigger:", err);
          }
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rideRequests/${id}`);
    }
  };

  const acceptRideRequest = async (requestId: string) => {
    if (!currentUser) return;
    
    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          // Trigger notification to requester
          const targetUser = r.userId;
          const childName = childrenList.find(c => c.id === r.childId)?.nome || "Criança";
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: targetUser,
            titulo: "Boleia Aceite! 🎉",
            mensagem: `Boas notícias! O(A) ${currentUser.nome} aceitou dar boleia ao(à) ${childName} no dia ${r.data} às ${r.hora}.`,
            lida: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
          
          return {
            ...r,
            estado: "Aceite" as RideRequestStatus,
            acceptedBy: currentUser.id
          };
        }
        return r;
      }));
      return;
    }

    try {
      const docRef = doc(db!, "rideRequests", requestId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as RideRequest;
        await updateDoc(docRef, {
          estado: "Aceite",
          acceptedBy: currentUser.id
        });

        // Notify creator
        const childName = childrenList.find(c => c.id === data.childId)?.nome || "Criança";
        await addDoc(collection(db!, "notifications"), {
          userId: data.userId,
          titulo: "Boleia Aceite! 🎉",
          mensagem: `Boas notícias! O(A) ${currentUser.nome} aceitou dar boleia ao(à) ${childName} no dia ${data.data} às ${data.hora}.`,
          lida: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`);
    }
  };

  const cancelRideRequest = async (requestId: string) => {
    if (!currentUser) return;

    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          if (r.acceptedBy) {
            // Notify helper parent that it is canceled
            const childName = childrenList.find(c => c.id === r.childId)?.nome || "Criança";
            const helperNotif: NotificationItem = {
              id: `notif-${Date.now()}`,
              userId: r.acceptedBy,
              titulo: "Boleia Cancelada ⚠️",
              mensagem: `O pedido de boleia de ${currentUser.nome} para ${childName} no dia ${r.data} foi cancelado pelo encarregado.`,
              lida: false,
              createdAt: new Date().toISOString()
            };
            setNotifications(prevNotifs => [helperNotif, ...prevNotifs]);
          }
          return { ...r, estado: "Cancelado" as RideRequestStatus };
        }
        return r;
      }));
      return;
    }

    try {
      const docRef = doc(db!, "rideRequests", requestId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as RideRequest;
        await updateDoc(docRef, { estado: "Cancelado" });
        
        if (data.acceptedBy) {
          const childName = childrenList.find(c => c.id === data.childId)?.nome || "Criança";
          await addDoc(collection(db!, "notifications"), {
            userId: data.acceptedBy,
            titulo: "Boleia Cancelada ⚠️",
            mensagem: `O pedido de boleia de ${currentUser.nome} para ${childName} no dia ${data.data} foi cancelado pelo encarregado.`,
            lida: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`);
    }
  };

  const completeRideRequest = async (requestId: string) => {
    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          return { ...r, estado: "Concluído" as RideRequestStatus };
        }
        return r;
      }));
      return;
    }

    try {
      const docRef = doc(db!, "rideRequests", requestId);
      await updateDoc(docRef, { estado: "Concluído" });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`);
    }
  };

  const declineRideRequest = async (requestId: string) => {
    // Release the accepted ride request back to Pendente
    if (!currentUser) return;

    if (!isFirebaseActive) {
      setRideRequests(prev => prev.map(r => {
        if (r.id === requestId && r.acceptedBy === currentUser.id) {
          // Notify requester of helper cancellation
          const childName = childrenList.find(c => c.id === r.childId)?.nome || "Criança";
          const newNotif: NotificationItem = {
            id: `notif-${Date.now()}`,
            userId: r.userId,
            titulo: "Desistência de Boleia ⚠️",
            mensagem: `O(A) ${currentUser.nome} acabou por não conseguir assegurar a boleia para o(a) ${childName} no dia ${r.data}. O pedido voltou ao estado de Procura Pendente.`,
            lida: false,
            createdAt: new Date().toISOString()
          };
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);

          return {
            ...r,
            estado: "Pendente" as RideRequestStatus,
            acceptedBy: ""
          };
        }
        return r;
      }));
      return;
    }

    try {
      const docRef = doc(db!, "rideRequests", requestId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as RideRequest;
        await updateDoc(docRef, {
          estado: "Pendente",
          acceptedBy: ""
        });

        const childName = childrenList.find(c => c.id === data.childId)?.nome || "Criança";
        await addDoc(collection(db!, "notifications"), {
          userId: data.userId,
          titulo: "Desistência de Boleia ⚠️",
          mensagem: `O(A) ${currentUser.nome} indicou que não conseguirá assegurar a boleia para o(a) ${childName} no dia ${data.data}. O pedido voltou a ficar pendente de aceitação.`,
          lida: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rideRequests/${requestId}`);
    }
  };

  // --- NOTIFICATIONS ACTIONS ---
  const markNotificationAsRead = async (id: string) => {
    if (!isFirebaseActive) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
      return;
    }

    try {
      const docRef = doc(db!, "notifications", id);
      await updateDoc(docRef, { lida: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const clearAllNotifications = async () => {
    if (!currentUser) return;
    if (!isFirebaseActive) {
      setNotifications([]);
      return;
    }

    try {
      const batch = writeBatch(db!);
      const q = query(collection(db!, "notifications"), where("userId", "==", currentUser.id));
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/bulk`);
    }
  };


  // --- INTELLIGENCE SUGGESTIONS ENGINE ---
  /**
   * Evaluates micro suggestions matching rule 11:
   * "Esta atividade já tem outras crianças registadas." or "Esta família costuma fazer esta boleia."
   */
  const getSuggestionsForActivity = (childId: string, activityId: string) => {
    const suggestions: { type: 'info' | 'warning' | 'success'; message: string }[] = [];
    if (!currentUser || !activityId || !childId) return suggestions;

    const currentActivity = activities.find(a => a.id === activityId);
    if (!currentActivity) return suggestions;

    // Suggestion A: "Esta atividade já tem outras crianças registadas."
    // Find other kids enrolled in an activity of the SAME Type (e.g. Football) at the SAME Day and Time and Location.
    const otherRegisteredKids = activities.filter(act => {
      // Find the child details
      const c = childrenList.find(ch => ch.id === act.childId);
      if (!c) return false;
      
      // Check if it is another parent's child
      if (c.userId === currentUser.id) return false;
      
      // Match day and time and generic name
      return act.diaSemana === currentActivity.diaSemana &&
             act.hora === currentActivity.hora &&
             act.nome.toLowerCase().includes(currentActivity.nome.toLowerCase().split(' ')[0]);
    });

    if (otherRegisteredKids.length > 0) {
      const names = otherRegisteredKids.map(act => {
        const childObj = childrenList.find(ch => ch.id === act.childId);
        const parentObj = users.find(u => u.id === childObj?.userId);
        return `${childObj?.nome} (${parentObj?.nome || 'Família'})`;
      }).join(', ');
      
      suggestions.push({
        type: 'warning',
        message: `Boleia de grupo útil: O(s) colega(s) ${names} também estão registados na atividade "${currentActivity.nome}" neste mesmo dia e hora!`
      });
    }

    // Suggestion B: "Esta família costuma fazer esta boleia."
    // Look up historic accepted ride requests where another family accepted requests for this child or family in the past.
    const myRidesHistory = rideRequests.filter(req => req.userId === currentUser.id && req.estado === "Concluído" || req.estado === "Aceite");
    
    // Check which parent we accept/accepted for and build count maps
    const helperCounts: { [userId: string]: number } = {};
    myRidesHistory.forEach(req => {
      if (req.acceptedBy && req.acceptedBy !== currentUser.id) {
        helperCounts[req.acceptedBy] = (helperCounts[req.acceptedBy] || 0) + 1;
      }
    });

    // Find if there's someone who has helped with 1 or more rides
    const topHelpers = Object.entries(helperCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => users.find(u => u.id === entry[0]))
      .filter((u): u is UserProfile => !!u);

    if (topHelpers.length > 0) {
      const primaryHelper = topHelpers[0];
      suggestions.push({
        type: 'success',
        message: `A família de ${primaryHelper.nome} costuma dar boleias nesta atividade ou já ajudou noutros trajetos (${helperCounts[primaryHelper.id]} boleias partilhadas)! Considere combinar diretamente.`
      });
    } else {
      // General encouraging message if no history
      suggestions.push({
        type: 'info',
        message: 'A boleia partilhada poupa tempo aos pais e reduz emissões. Envie com confiança!'
      });
    }

    return suggestions;
  };


  // --- DYNAMIC DATA RESETTERS ---
  const resetDemoData = () => {
    localStorage.removeItem('cab_users');
    localStorage.removeItem('cab_children');
    localStorage.removeItem('cab_activities');
    localStorage.removeItem('cab_rideRequests');
    localStorage.removeItem('cab_notifications');
    localStorage.removeItem('cab_current_user');
    
    // Trigger re-load
    const defaultMe = DEMO_USERS.find(u => u.id === 'user-me')!;
    setCurrentUser(defaultMe);
    localStorage.setItem('cab_current_user', JSON.stringify(defaultMe));
    setUsers(DEMO_USERS);
    setChildrenList(DEMO_CHILDREN);
    setActivities(DEMO_ACTIVITIES);
    setRideRequests(DEMO_RIDE_REQUESTS);
    setNotifications(DEMO_NOTIFICATIONS);
    
    alert("Dados de demonstração repostos com sucesso!");
  };


  // --- GETTERS & DERIVED STATES ---
  const myChildren = childrenList.filter(c => c.userId === currentUser?.id);
  const myRideRequests = rideRequests.filter(r => r.userId === currentUser?.id);

  const groupMembers: AppGroupMember[] = users.map(user => {
    const familyChildren = childrenList.filter(c => c.userId === user.id);
    return {
      user,
      children: familyChildren
    };
  });

  return (
    <AppContext.Provider value={{
      isFirebaseActive,
      currentUser,
      loading,
      authError,
      resetSent,
      loginEmail,
      registerEmail,
      logout,
      recoverPassword,
      updateProfile,
      users,
      children: childrenList,
      activities,
      rideRequests,
      notifications,
      myChildren,
      myRideRequests,
      groupMembers,
      createRideRequest,
      acceptRideRequest,
      cancelRideRequest,
      completeRideRequest,
      declineRideRequest,
      addChild,
      updateChild,
      removeChild,
      addActivity,
      updateActivity,
      removeActivity,
      markNotificationAsRead,
      clearAllNotifications,
      getSuggestionsForActivity,
      resetDemoData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

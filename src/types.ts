/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  foto?: string;
}

export interface Child {
  id: string;
  userId: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  foto?: string;
  cor?: string; // Optional custom color code (e.g. 'blue', 'rose')
}

export interface Activity {
  id: string;
  childId: string;
  nome: string;
  local: string;
  diaSemana: "Segunda-feira" | "Terça-feira" | "Quarta-feira" | "Quinta-feira" | "Sexta-feira" | "Sábado" | "Domingo";
  hora: string; // HH:MM
  observacoes?: string;
}

export type RideRequestStatus = "Pendente" | "Aceite" | "Concluído" | "Cancelado";

export interface RideRequest {
  id: string;
  userId: string;
  childId: string;
  activityId: string;
  outroNome?: string; // For non-programmed activities
  outroLocal?: string; // For non-programmed activities
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  observacao?: string;
  estado: RideRequestStatus;
  acceptedBy?: string; // userId of the helper parent
  createdAt: string; // ISO string
}

export interface NotificationItem {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string; // ISO string
}

export interface AppGroupMember {
  user: UserProfile;
  children: Child[];
}

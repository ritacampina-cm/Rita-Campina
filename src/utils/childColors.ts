/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChildColorConfig {
  id: string;
  nome: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
  badgeClass: string;
  hex: string;
}

export const CHILD_COLORS: ChildColorConfig[] = [
  {
    id: "blue",
    nome: "Azul Marinho",
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
    borderClass: "border-blue-500",
    ringClass: "ring-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-150",
    hex: "#3b82f6"
  },
  {
    id: "rose",
    nome: "Rosa Suave",
    bgClass: "bg-rose-100",
    textClass: "text-rose-700",
    borderClass: "border-rose-500",
    ringClass: "ring-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-150",
    hex: "#f43f5e"
  },
  {
    id: "amber",
    nome: "Amarelo Ouro / Laranja",
    bgClass: "bg-amber-100",
    textClass: "text-amber-850",
    borderClass: "border-amber-500",
    ringClass: "ring-amber-500",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-150",
    hex: "#f59e0b"
  },
  {
    id: "emerald",
    nome: "Verde Esmeralda",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-500",
    ringClass: "ring-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-150",
    hex: "#10b981"
  },
  {
    id: "violet",
    nome: "Roxo Violeta",
    bgClass: "bg-violet-100",
    textClass: "text-violet-700",
    borderClass: "border-violet-500",
    ringClass: "ring-violet-500",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-150",
    hex: "#8b5cf6"
  },
  {
    id: "indigo",
    nome: "Índigo Real",
    bgClass: "bg-indigo-100",
    textClass: "text-indigo-700",
    borderClass: "border-indigo-500",
    ringClass: "ring-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-150",
    hex: "#6366f1"
  },
  {
    id: "cyan",
    nome: "Ciano Brilhante",
    bgClass: "bg-cyan-100",
    textClass: "text-cyan-700",
    borderClass: "border-cyan-500",
    ringClass: "ring-cyan-500",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-150",
    hex: "#06b6d4"
  },
  {
    id: "orange",
    nome: "Cenoura / Laranja",
    bgClass: "bg-orange-100",
    textClass: "text-orange-700",
    borderClass: "border-orange-500",
    ringClass: "ring-orange-500",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-150",
    hex: "#f97316"
  }
];

// Fallback logic to assign stable color based on child's name, or ID index if not in demo
export function getChildColor(colorId?: string, fallbackIndex = 0): ChildColorConfig {
  if (colorId) {
    const found = CHILD_COLORS.find(c => c.id === colorId);
    if (found) return found;
  }
  return CHILD_COLORS[fallbackIndex % CHILD_COLORS.length];
}

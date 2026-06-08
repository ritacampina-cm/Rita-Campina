/**
 * Utility to generate initials with specific overrides for user requests:
 * - Manuel -> ML
 * - Maria -> MR
 * - João Afonso -> JA
 * - Rita Campina / Rita -> RC
 */
export function getInitials(name: string): string {
  if (!name) return "";
  const clean = name.trim();
  const cleanLower = clean.toLowerCase();

  // Custom precise cases requested by the user
  if (cleanLower.startsWith("manuel")) {
    return "ML";
  }
  if (cleanLower.startsWith("maria")) {
    // Exclude Maria Santos (user-2) who should keep standard "MS"
    if (cleanLower.startsWith("maria santos")) {
      return "MS";
    }
    return "MR";
  }
  if (cleanLower.startsWith("joão afonso") || cleanLower.startsWith("joao afonso")) {
    return "JA";
  }
  if (cleanLower.startsWith("rita campina") || cleanLower === "rita") {
    return "RC";
  }

  // General fallbacks:
  // If multiple words, take the first letter of the first two words (e.g. Joao Silva -> JS, Ana Costa -> AC)
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const firstInitial = parts[0][0];
    const secondInitial = parts[1][0];
    return (firstInitial + secondInitial).toUpperCase();
  }
  
  // If a single word, grab the first two letters if possible (e.g., Tiago -> TI, Margarida -> MA)
  if (parts.length === 1) {
    const single = parts[0];
    if (single.length >= 2) {
      return single.substring(0, 2).toUpperCase();
    }
    return single.charAt(0).toUpperCase();
  }

  return "";
}

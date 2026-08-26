/**
 * Traveler League Helper (Node.js Backend)
 */

export function calculateLeague(points) {
  const pts = parseInt(points || 0, 10);
  if (pts >= 4000) return "Legend";
  if (pts >= 2000) return "Expert";
  if (pts >= 1000) return "Traveler";
  if (pts >= 300) return "Adventurer";
  return "Explorer";
}

/**
 * Traveler League Helper & Constants (Frontend)
 */

export const LEAGUE_TIERS = [
  { name: "Legend", minPoints: 4000, maxPoints: Infinity, badgeClass: "badge-error text-white font-bold animate-pulse" },
  { name: "Expert", minPoints: 2000, maxPoints: 4000, badgeClass: "badge-warning text-slate-900 font-bold" },
  { name: "Traveler", minPoints: 1000, maxPoints: 2000, badgeClass: "badge-success text-white font-bold" },
  { name: "Adventurer", minPoints: 300, maxPoints: 1000, badgeClass: "badge-info text-white font-bold" },
  { name: "Explorer", minPoints: 0, maxPoints: 300, badgeClass: "badge-neutral font-bold" }
];

export function calculateLeague(points) {
  const pts = parseInt(points || 0, 10);
  if (pts >= 4000) return "Legend";
  if (pts >= 2000) return "Expert";
  if (pts >= 1000) return "Traveler";
  if (pts >= 300) return "Adventurer";
  return "Explorer";
}

export function getLeagueBadgeClass(league) {
  const tier = LEAGUE_TIERS.find(t => t.name.toLowerCase() === (league || "").toLowerCase());
  return tier ? tier.badgeClass : "badge-neutral font-bold";
}

export function getLeagueProgress(pts) {
  const points = parseInt(pts || 0, 10);
  let min = 0;
  let max = 300;
  let nextLeague = "Adventurer";

  if (points >= 4000) {
    return { percent: 100, remaining: 0, next: "Max Rank reached!" };
  } else if (points >= 2000) {
    min = 2000;
    max = 4000;
    nextLeague = "Legend";
  } else if (points >= 1000) {
    min = 1000;
    max = 2000;
    nextLeague = "Expert";
  } else if (points >= 300) {
    min = 300;
    max = 1000;
    nextLeague = "Traveler";
  }

  const percent = Math.min(Math.round(((points - min) / (max - min)) * 100), 100);
  const remaining = max - points;

  return { percent, remaining, next: nextLeague };
}

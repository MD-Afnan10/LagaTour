// Data Collections for Laga Tour
import { BANGLADESH_PLACES_DATABASE, MOCK_COMPANIONS, INITIAL_MOCK_EXPEDITIONS } from "./mockExpeditions";

export const MOCK_USERS = MOCK_COMPANIONS;

export const MOCK_DESTINATIONS = BANGLADESH_PLACES_DATABASE;

export const MOCK_POSTS = [];

export const MOCK_TOUR_PLANS = INITIAL_MOCK_EXPEDITIONS.map(exp => ({
  id: exp.id,
  title: exp.title,
  destinationId: exp.id,
  destinationName: exp.destination,
  startingLocation: exp.startingLocation,
  transportation: exp.stops.map(s => s.transportMode).filter((v, i, a) => a.indexOf(v) === i).join(" & "),
  accommodation: exp.stops.map(s => s.accommodationType).filter((v, i, a) => a.indexOf(v) === i && v !== "None").join(" & "),
  placesVisited: exp.stops.map(s => s.placeName),
  legs: exp.stops.map((s, idx) => ({
    id: s.id,
    from: idx === 0 ? exp.startingLocation : exp.stops[idx - 1].placeName,
    placeName: s.placeName,
    transportMode: s.transportMode,
    transportCost: s.transportCost || 0,
    accommodation: s.accommodationDetails || s.accommodationType,
    accommodationCost: s.accommodationCost || 0,
    otherCosts: 500,
    stayDuration: s.stayDuration,
    activities: s.notes
  })),
  duration: 4,
  totalBudget: exp.targetBudget,
  expenseBreakdown: [
    { category: "Transport Total", amount: Math.round(exp.targetBudget * 0.3) },
    { category: "Accommodation Total", amount: Math.round(exp.targetBudget * 0.45) },
    { category: "Activities & Food", amount: Math.round(exp.targetBudget * 0.25) }
  ],
  travelTips: exp.description,
  photos: [exp.coverImage],
  rating: 4.9,
  ratingsCount: 24,
  budgetAccuracy: 4.8,
  experienceRating: 4.9,
  author: exp.author,
  travelType: exp.travelType,
  season: exp.season,
  likes: exp.likes || 15,
  comments: exp.comments || []
}));

export const MOCK_GROUP_TOURS = [];

export const MOCK_CHATS = [];

export const MOCK_NOTIFICATIONS = [];

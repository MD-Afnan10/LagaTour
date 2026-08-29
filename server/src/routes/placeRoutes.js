import express from "express";
import {
  getDivisionsAndDistricts,
  getNearbyPlaces,
  quickSavePlace,
  linkExistingPlace,
  getUserMyPlaces,
  updatePlaceDetails,
  getPublicPlacesFeed,
  ratePlaceSafety,
  toggleLikePlace,
  addPlaceComment,
  toggleSavePlace,
  reportPlace,
  deleteFromMyPlaces
} from "../controllers/placeController.js";

const router = express.Router();

// Location lists (divisions & districts)
router.get("/locations", getDivisionsAndDistricts);

// Nearby GPS search
router.get("/nearby", getNearbyPlaces);

// My Places endpoints
router.get("/my-places/:userId", getUserMyPlaces);
router.post("/quick-save", quickSavePlace);
router.post("/link-existing", linkExistingPlace);
router.delete("/my-places/:placeId", deleteFromMyPlaces);

// Public feed & Place actions
router.get("/", getPublicPlacesFeed);
router.put("/:placeId", updatePlaceDetails);
router.post("/:placeId/rate-safety", ratePlaceSafety);
router.post("/:placeId/like", toggleLikePlace);
router.post("/:placeId/comment", addPlaceComment);
router.post("/:placeId/save", toggleSavePlace);
router.post("/:placeId/report", reportPlace);
router.delete("/:placeId", deleteFromMyPlaces);

export default router;

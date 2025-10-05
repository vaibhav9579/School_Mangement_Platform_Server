import express from "express";
import {
  createTimeSlot,
  listTimeSlots,
  deleteTimeSlot
} from "../controllers/timeSlotController.js";

const router = express.Router();

router.get("/", listTimeSlots);
router.post("/", createTimeSlot);
router.delete("/:id", deleteTimeSlot);

export default router;
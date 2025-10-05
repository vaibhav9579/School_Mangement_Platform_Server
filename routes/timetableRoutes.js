import express from "express";
import {
  createTimetableEntry,
  getTimetableForClass,
  getTimetableForTeacher,
  deleteTimetableEntry,
  updateTimetableEntry
} from "../controllers/timetableController.js";

const router = express.Router();

// For Admins
router.post("/", createTimetableEntry);
router.put("/:id", updateTimetableEntry);
router.delete("/:id", deleteTimetableEntry);

// For Students and general viewing
router.get("/class/:class_id/:section_id", getTimetableForClass);

// For Teachers
router.get("/teacher/:teacher_id", getTimetableForTeacher);

export default router;
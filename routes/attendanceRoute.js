import express from "express";
import {
  getStudentsWithAttendance,
  saveBulkAttendance,
  editAttendance,
  getAttendanceByDate
} from "../controllers/attendanceController.js";

const router = express.Router();

// GET /api/attendance/students - Get students + today's attendance for teacher's assigned class
router.get("/students/:id", getStudentsWithAttendance);

// GET /api/attendance/:date - Get attendance for a specific date (edit or report)
router.get("/:date", getAttendanceByDate);

// POST /api/attendance/batch - Save bulk attendance (insert/update)
router.post("/batch", saveBulkAttendance);

// PATCH /api/attendance/:id - Edit single attendance record
router.patch("/:id", editAttendance);

export default router;

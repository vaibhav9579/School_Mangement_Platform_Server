import express from "express";
import {
  createMark,
  listMarks,
  getMarkById,
  updateMark,
  deleteMark,
  getMarkByStudentId
} from "../controllers/markController.js";

const router = express.Router();

// GET /api/marks?student_id=1&subject_code=2
router.get("/", listMarks);

// GET /api/marks/:id
router.get("/:id", getMarkById);

router.get("/markbystudentid/:student_id", getMarkByStudentId);

// POST /api/marks
router.post("/", createMark);

// PUT /api/marks/:id
router.put("/:id", updateMark);

// DELETE /api/marks/:id
router.delete("/:id", deleteMark);

export default router;

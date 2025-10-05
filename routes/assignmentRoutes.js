import express from "express";
import {
  createAssignment,
  listAssignments,
  deleteAssignment
} from "../controllers/assignmentController.js";

const router = express.Router();

router.get("/", listAssignments);
router.post("/", createAssignment);
router.delete("/:id", deleteAssignment);

export default router;
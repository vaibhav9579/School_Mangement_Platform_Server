import express from "express";
import {
  createInward,
  listInwards,
  getInwardById,
  updateInward,
  deleteInward
} from "../controllers/inwardController.js";

const router = express.Router();

// GET /api/inward - Get all inward entries (with optional filters)
// Example: /api/inward?status=Received
router.get("/", listInwards);

// GET /api/inward/:id - Get a single inward entry by its ID
router.get("/:id", getInwardById);

// POST /api/inward - Create a new inward entry
router.post("/", createInward);

// PUT /api/inward/:id - Update an existing inward entry
router.put("/:id", updateInward);

// DELETE /api/inward/:id - Delete an inward entry
router.delete("/:id", deleteInward);

export default router;
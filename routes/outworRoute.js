import express from "express";
import {
  createOutward,
  listOutwards,
  getOutwardById,
  updateOutward,
  deleteOutward
} from "../controllers/outwardController.js";

const router = express.Router();

// GET /api/outward - Get all outward entries
router.get("/", listOutwards);

// GET /api/outward/:id - Get a single outward entry by its ID
router.get("/:id", getOutwardById);

// POST /api/outward - Create a new outward entry
router.post("/", createOutward);

// PUT /api/outward/:id - Update an existing outward entry
router.put("/:id", updateOutward);

// DELETE /api/outward/:id - Delete an outward entry
router.delete("/:id", deleteOutward);

export default router;
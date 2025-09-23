import express from "express";
import {
  getLeavePolicies,
  getLeavePolicyByRole,
  addLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy
} from "../controllers/leavePolicyController.js";

const router = express.Router();

// ✅ Get all leave policies
router.get("/", getLeavePolicies);

// ✅ Get leave policy by role
router.get("/role/:roleId", getLeavePolicyByRole);

// ✅ Add new leave policy
router.post("/", addLeavePolicy);

// ✅ Update leave policy
router.put("/:policyId", updateLeavePolicy);

// ✅ Delete leave policy
router.delete("/:policyId", deleteLeavePolicy);

export default router;

const express = require("express");
const router = express.Router();
const {
  getLeavePolicies,
  getLeavePolicyByRole,
  addLeavePolicy,
  updateLeavePolicy,
  deleteLeavePolicy
} = require("../controllers/leavePolicyController");

// ✅ Get all leave policies
router.get("/", getLeavePolicies);

// ✅ Get leave policy by role (changed route to avoid conflicts)
router.get("/role/:roleId", getLeavePolicyByRole);

// ✅ Add new leave policy
router.post("/", addLeavePolicy);

// ✅ Update leave policy
router.put("/:policyId", updateLeavePolicy);

// ✅ Delete leave policy
router.delete("/:policyId", deleteLeavePolicy);

module.exports = router;

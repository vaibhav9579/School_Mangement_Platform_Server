const express = require("express");
const router = express.Router();

const {
  applyLeave,
  getLeaveRequestsByUser,
  updateLeaveStatus,
  getLeaveBalance,     // Check available leaves for a user
  getAllLeaveRequests  // Admin/approver: fetch all requests
} = require("../controllers/leaveRequestController");

// ✅ Apply for leave (system checks role-wise policy + LOP)
router.post("/", applyLeave);

// ✅ Get leave balance for a user (dashboard)
router.get("/balance/:userId", getLeaveBalance);

// ✅ Get all leave requests by a specific user
router.get("/user/:userId", getLeaveRequestsByUser);

// ✅ Approver updates leave request status (approve/reject/LOP)
router.put("/:requestId", updateLeaveStatus);

// ✅ Admin/approver fetches all requests
router.get("/", getAllLeaveRequests);

module.exports = router;

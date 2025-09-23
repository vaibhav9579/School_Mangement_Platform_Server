import express from "express";
import { applyLeave, getLeaveRequestsByUser, updateLeaveStatus, getLeaveBalance, getAllLeaveRequests } from "../controllers/leaveRequestController.js";

const router = express.Router();

router.post("/", applyLeave);
router.get("/balance/:userId", getLeaveBalance);
router.get("/user/:userId", getLeaveRequestsByUser);
router.put("/:requestId", updateLeaveStatus);
router.delete("/delete/:requestId", updateLeaveStatus); // optional for delete
router.get("/", getAllLeaveRequests);

export default router;

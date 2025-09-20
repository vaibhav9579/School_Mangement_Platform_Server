// const pool = require("../config/db");
const pool = require("../db");


// ✅ Apply Leave with Role-wise Policy Check
exports.applyLeave = async (req, res) => {
  try {
    const { user_id, leave_type, days_requested, start_date, end_date } = req.body;

    if (!user_id || !leave_type || !days_requested || !start_date || !end_date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // 1. Get user role_id
    const userResult = await pool.query(
      "SELECT role_id FROM users WHERE id = $1",
      [user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const role_id = userResult.rows[0].role_id;

    // 2. Get allowed days for this role + leave type
    const policyResult = await pool.query(
      "SELECT allowed_days FROM leave_policies WHERE role_id = $1 AND leave_type = $2",
      [role_id, leave_type]
    );
    if (policyResult.rows.length === 0) {
      return res.status(400).json({ error: "No leave policy defined for this role" });
    }
    const allowed_days = policyResult.rows[0].allowed_days;

    // 3. Calculate already taken approved leaves
    const takenResult = await pool.query(
      `SELECT COALESCE(SUM(days_requested), 0) as taken 
       FROM leave_requests 
       WHERE user_id = $1 AND leave_type = $2 AND status = 'approved'`,
      [user_id, leave_type]
    );
    const taken = parseInt(takenResult.rows[0].taken) || 0;

    // 4. Check availability
    const available = allowed_days - taken;

    let status = "pending"; // default status
    if (days_requested > available) {
      status = "loss_of_pay"; // mark as LOP
    }

    // 5. Insert leave request
    const result = await pool.query(
      `INSERT INTO leave_requests 
       (user_id, leave_type, days_requested, start_date, end_date, status) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [user_id, leave_type, days_requested, start_date, end_date, status]
    );

    res.status(201).json({
      message: "Leave request submitted",
      leave: result.rows[0],
      available_before: available,
      available_after: Math.max(0, available - days_requested),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all requests by a specific user
exports.getLeaveRequestsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY start_date DESC",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No leave requests found for this user" });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Approver updates request status
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const result = await pool.query(
      "UPDATE leave_requests SET status = $1 WHERE request_id = $2 RETURNING *",
      [status, requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get leave balance for a user
exports.getLeaveBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's role
    const userResult = await pool.query(
      "SELECT role_id FROM users WHERE id = $1",
      [userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const roleId = userResult.rows[0].role_id;

    // Get policies for that role
    const policyResult = await pool.query(
      "SELECT leave_type, allowed_days FROM leave_policies WHERE role_id = $1",
      [roleId]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({ message: "No leave policies found for this role" });
    }

    let balances = [];

    for (let policy of policyResult.rows) {
      const takenResult = await pool.query(
        `SELECT COALESCE(SUM(days_requested), 0) as taken 
         FROM leave_requests 
         WHERE user_id = $1 AND leave_type = $2 AND status = 'approved'`,
        [userId, policy.leave_type]
      );

      const taken = parseInt(takenResult.rows[0].taken) || 0;
      const available = policy.allowed_days - taken;

      balances.push({
        leave_type: policy.leave_type,
        allowed: policy.allowed_days,
        taken,
        available: available < 0 ? 0 : available,
      });
    }

    res.json(balances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Admin/Approver: Get all leave requests
exports.getAllLeaveRequests = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr.*, u.name, u.role_id 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.id 
       ORDER BY lr.start_date DESC`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No leave requests found" });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

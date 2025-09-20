const pool = require("../db");

// ✅ Get all leave policies
exports.getLeavePolicies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lp.policy_id, lp.leave_type, lp.allowed_days, r.role_name 
       FROM leave_policies lp 
       JOIN roles r ON lp.role_id = r.role_id`
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No leave policies found" });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get leave policy by role
exports.getLeavePolicyByRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    const result = await pool.query(
      `SELECT policy_id, leave_type, allowed_days 
       FROM leave_policies 
       WHERE role_id = $1`,
      [roleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No leave policy found for this role" });
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add new leave policy
exports.addLeavePolicy = async (req, res) => {
  try {
    const { role_id, leave_type, allowed_days } = req.body;

    if (!role_id || !leave_type || !allowed_days) {
      return res.status(400).json({ error: "role_id, leave_type, and allowed_days are required" });
    }

    const result = await pool.query(
      `INSERT INTO leave_policies (role_id, leave_type, allowed_days) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [role_id, leave_type, allowed_days]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update leave policy
exports.updateLeavePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;
    const { leave_type, allowed_days } = req.body;

    if (!leave_type || !allowed_days) {
      return res.status(400).json({ error: "leave_type and allowed_days are required" });
    }

    const result = await pool.query(
      `UPDATE leave_policies 
       SET leave_type = $1, allowed_days = $2 
       WHERE policy_id = $3 
       RETURNING *`,
      [leave_type, allowed_days, policyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave policy not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete leave policy
exports.deleteLeavePolicy = async (req, res) => {
  try {
    const { policyId } = req.params;

    const result = await pool.query(
      `DELETE FROM leave_policies 
       WHERE policy_id = $1 
       RETURNING *`,
      [policyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Leave policy not found" });
    }

    res.json({ message: "Leave policy deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

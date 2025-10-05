import pool from "../db.js"; // Assuming your db connection pool is at ../db.js

/**
 * ✅ CREATE a new inward entry
 */
export const createInward = async (req, res) => {
  try {
    const {
      received_date,
      sender_details,
      subject,
      document_type,
      logged_by_user_id,
      forwarded_to_department_id,
      forwarded_to_user_id,
      remarks
    } = req.body;

    if (!received_date || !sender_details || !subject || !logged_by_user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO inward_register (received_date, sender_details, subject, document_type, logged_by_user_id, forwarded_to_department_id, forwarded_to_user_id, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [received_date, sender_details, subject, document_type, logged_by_user_id, forwarded_to_department_id, forwarded_to_user_id, remarks]
    );

    res.status(201).json({
      message: "Inward entry created successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("Error creating inward entry:", err);
    res.status(500).json({ error: "Failed to create inward entry" });
  }
};

/**
 * ✅ GET all inward entries (with optional filters)
 */
export const listInwards = async (req, res) => {
  try {
    const { status, forwarded_to_user_id } = req.query;

    let query = "SELECT * FROM inward_register WHERE 1=1";
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (forwarded_to_user_id) {
      params.push(forwarded_to_user_id);
      query += ` AND forwarded_to_user_id = $${params.length}`;
    }

    query += " ORDER BY received_date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching inward entries:", err);
    res.status(500).json({ error: "Failed to fetch inward entries" });
  }
};

/**
 * ✅ GET inward entry by ID
 */
export const getInwardById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM inward_register WHERE inward_id = $1", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Inward entry not found" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error fetching inward entry by ID:", err);
    res.status(500).json({ error: "Failed to fetch inward entry" });
  }
};

/**
 * ✅ UPDATE an inward entry by ID
 */
export const updateInward = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      received_date,
      sender_details,
      subject,
      document_type,
      status,
      remarks,
      forwarded_to_department_id,
      forwarded_to_user_id
    } = req.body;

    const result = await pool.query(
      `UPDATE inward_register
       SET received_date = $1,
           sender_details = $2,
           subject = $3,
           document_type = $4,
           status = $5,
           remarks = $6,
           forwarded_to_department_id = $7,
           forwarded_to_user_id = $8
       WHERE inward_id = $9
       RETURNING *`,
      [received_date, sender_details, subject, document_type, status, remarks, forwarded_to_department_id, forwarded_to_user_id, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Inward entry not found" });

    res.json({
      message: "Inward entry updated successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Error updating inward entry:", err);
    res.status(500).json({ error: "Failed to update inward entry" });
  }
};

/**
 * ✅ DELETE an inward entry
 */
export const deleteInward = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM inward_register WHERE inward_id = $1 RETURNING *", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Inward entry not found" });

    res.json({ message: "Inward entry deleted successfully" });

  } catch (err) {
    console.error("Error deleting inward entry:", err);
    res.status(500).json({ error: "Failed to delete inward entry" });
  }
};
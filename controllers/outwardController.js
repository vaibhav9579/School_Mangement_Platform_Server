import pool from "../db.js"; // Your db connection pool

/**
 * ✅ CREATE a new outward entry
 */
export const createOutward = async (req, res) => {
  try {
    const {
      dispatch_date,
      recipient_details,
      subject,
      document_type,
      dispatch_mode,
      tracking_number,
      logged_by_user_id
    } = req.body;

    if (!dispatch_date || !recipient_details || !subject || !logged_by_user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO outward_register (dispatch_date, recipient_details, subject, document_type, dispatch_mode, tracking_number, logged_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [dispatch_date, recipient_details, subject, document_type, dispatch_mode, tracking_number, logged_by_user_id]
    );

    res.status(201).json({
      message: "Outward entry created successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("Error creating outward entry:", err);
    res.status(500).json({ error: "Failed to create outward entry" });
  }
};

/**
 * ✅ GET all outward entries
 */
export const listOutwards = async (req, res) => {
  try {
    const query = "SELECT * FROM outward_register ORDER BY dispatch_date DESC";
    const result = await pool.query(query);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching outward entries:", err);
    res.status(500).json({ error: "Failed to fetch outward entries" });
  }
};

/**
 * ✅ GET outward entry by ID
 */
export const getOutwardById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM outward_register WHERE outward_id = $1", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Outward entry not found" });

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Error fetching outward entry by ID:", err);
    res.status(500).json({ error: "Failed to fetch outward entry" });
  }
};

/**
 * ✅ UPDATE an outward entry by ID
 */
export const updateOutward = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      dispatch_date,
      recipient_details,
      subject,
      document_type,
      dispatch_mode,
      tracking_number
    } = req.body;

    const result = await pool.query(
      `UPDATE outward_register
       SET dispatch_date = $1,
           recipient_details = $2,
           subject = $3,
           document_type = $4,
           dispatch_mode = $5,
           tracking_number = $6
       WHERE outward_id = $7
       RETURNING *`,
      [dispatch_date, recipient_details, subject, document_type, dispatch_mode, tracking_number, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Outward entry not found" });

    res.json({
      message: "Outward entry updated successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("Error updating outward entry:", err);
    res.status(500).json({ error: "Failed to update outward entry" });
  }
};

/**
 * ✅ DELETE an outward entry
 */
export const deleteOutward = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM outward_register WHERE outward_id = $1 RETURNING *", [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Outward entry not found" });

    res.json({ message: "Outward entry deleted successfully" });

  } catch (err) {
    console.error("Error deleting outward entry:", err);
    res.status(500).json({ error: "Failed to delete outward entry" });
  }
};
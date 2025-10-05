import pool from "../db.js";

export const createTimeSlot = async (req, res) => {
  try {
    const { start_time, end_time, is_break } = req.body;
    const result = await pool.query(
      `INSERT INTO time_slots (start_time, end_time, is_break) VALUES ($1, $2, $3) RETURNING *`,
      [start_time, end_time, is_break || false]
    );
    res.status(201).json({ message: "Time slot created", data: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to create time slot" });
  }
};

export const listTimeSlots = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM time_slots ORDER BY start_time");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch time slots" });
  }
};

export const deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM time_slots WHERE slot_id = $1", [id]);
    res.json({ message: "Time slot deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to delete time slot" });
  }
};
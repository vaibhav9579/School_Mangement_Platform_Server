import pool from "../db.js";

export const createAssignment = async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.body;
    const result = await pool.query(
      `INSERT INTO teacher_subject_assignments (teacher_id, subject_id) VALUES ($1, $2) RETURNING *`,
      [teacher_id, subject_id]
    );
    res.status(201).json({ message: "Assignment created", data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { // Handles unique constraint violation
        return res.status(409).json({ error: "This teacher is already assigned to this subject." });
    }
    console.error(err.message);
    res.status(500).json({ error: "Failed to create assignment" });
  }
};

export const listAssignments = async (req, res) => {
  try {
    const result = await pool.query(`
        SELECT
            tsa.assignment_id,
            u.name AS teacher_name,
            s.name AS subject_name
        FROM teacher_subject_assignments tsa
        JOIN users u ON tsa.teacher_id = u.id
        JOIN subjects s ON tsa.subject_id = s.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM teacher_subject_assignments WHERE assignment_id = $1", [id]);
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
};
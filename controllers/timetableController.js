import pool from "../db.js";

export const createTimetableEntry = async (req, res) => {
  const { class_id, section_id, day_of_week, slot_id, assignment_id } = req.body;
  try {
    // --- Clash Detection ---
    const teacherClash = await pool.query(
      `SELECT te.entry_id FROM timetable_entries te
       JOIN teacher_subject_assignments tsa ON te.assignment_id = tsa.assignment_id
       WHERE tsa.teacher_id = (SELECT teacher_id FROM teacher_subject_assignments WHERE assignment_id = $1)
       AND te.day_of_week = $2 AND te.slot_id = $3`,
      [assignment_id, day_of_week, slot_id]
    );

    if (teacherClash.rows.length > 0) {
      return res.status(409).json({ error: "Clash detected: Teacher is already scheduled at this time." });
    }

    // --- Create Entry ---
    const result = await pool.query(
      `INSERT INTO timetable_entries (class_id, section_id, day_of_week, slot_id, assignment_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [class_id, section_id, day_of_week, slot_id, assignment_id]
    );

    res.status(201).json({ message: "Timetable entry created", data: result.rows[0] });

  } catch (err) {
    if (err.code === '23505') { // Handles unique constraint for class/section/day/slot
        return res.status(409).json({ error: "Clash detected: This class already has a period scheduled at this time." });
    }
    console.error(err.message);
    res.status(500).json({ error: "Failed to create timetable entry" });
  }
};

export const getTimetableForClass = async (req, res) => {
  try {
    const { class_id, section_id } = req.params;
    const result = await pool.query(
      `SELECT
          te.entry_id, te.day_of_week,
          ts.start_time, ts.end_time, ts.is_break,
          s.name AS subject_name, s.code AS subject_code,
          u.name AS teacher_name
       FROM timetable_entries te
       JOIN time_slots ts ON te.slot_id = ts.slot_id
       JOIN teacher_subject_assignments tsa ON te.assignment_id = tsa.assignment_id
       JOIN subjects s ON tsa.subject_id = s.id
       JOIN users u ON tsa.teacher_id = u.id
       WHERE te.class_id = $1 AND te.section_id = $2
       ORDER BY te.day_of_week, ts.start_time`,
      [class_id, section_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch class timetable" });
  }
};

export const getTimetableForTeacher = async (req, res) => {
    try {
        const { teacher_id } = req.params;
        const result = await pool.query(
          `SELECT
              te.entry_id, te.day_of_week,
              ts.start_time, ts.end_time, ts.is_break,
              s.name AS subject_name,
              c.name AS class_name,
              sec.name AS section_name
           FROM timetable_entries te
           JOIN teacher_subject_assignments tsa ON te.assignment_id = tsa.assignment_id
           JOIN time_slots ts ON te.slot_id = ts.slot_id
           JOIN subjects s ON tsa.subject_id = s.id
           JOIN classes c ON te.class_id = c.id
           JOIN sections sec ON te.section_id = sec.id
           WHERE tsa.teacher_id = $1
           ORDER BY te.day_of_week, ts.start_time`,
          [teacher_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch teacher timetable" });
    }
};

export const deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM timetable_entries WHERE entry_id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Timetable entry not found" });
    }
    res.json({ message: "Timetable entry deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to delete timetable entry" });
  }
};

export const updateTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignment_id } = req.body;
        const result = await pool.query(
            `UPDATE timetable_entries SET assignment_id = $1 WHERE entry_id = $2 RETURNING *`,
            [assignment_id, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Timetable entry not found" });
        }
        res.json({ message: "Timetable entry updated", data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to update timetable entry" });
    }
};
import pool from "../db.js"; // <-- assuming you already have pg Pool configured

// GET all subjects
export const listSubjects = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, i.name AS institution_name, d.name AS department_name,
              p.name AS program_name, c.name AS class_name
       FROM subjects s
       LEFT JOIN institutions i ON s.institution_id = i.id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN programs p ON s.program_id = p.id
       LEFT JOIN classes c ON s.class_id = c.id
       ORDER BY s.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching subjects", err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

export const fetchParticularClassSubjects = async (req, res) => {
  try {
    // console.log("req.body", req.body);
    const { class_id } = req.params;
    const userResult = await pool.query("SELECT * FROM subjects WHERE class_id = $1", [class_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json(userResult.rows);
  } catch (err) {
    console.error("Error fetching particular class subjects", err);
    res.status(500).json({ error: "Failed to fetch particular class subjects" });
  }
}

// CREATE
export const createSubject = async (req, res) => {
  try {
    const { name, code, institution_id, department_id, program_id, class_id } = req.body;

    const result = await pool.query(
      `INSERT INTO subjects (name, code, institution_id, department_id, program_id, class_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, code, institution_id, department_id, program_id, class_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating subject", err);
    res.status(500).json({ error: "Failed to create subject" });
  }
};

// UPDATE
export const updateSubject = async (req, res) => {
  console.log("******* update subjects");
  try {
    const { id } = req.params;
    console.log("id", id);
    console.log("req.body", req.body);
    const { name, code, institution_id, department_id, program_id, class_id, teacher_id } = req.body;

    const result = await pool.query(
      `UPDATE subjects
       SET name=$1, code=$2, institution_id=$3, department_id=$4, program_id=$5, class_id=$6, teacher_id = $7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, code, institution_id, department_id, program_id, class_id, teacher_id , id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating subject", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
};

export const updateTeacherId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("id", id);
    const { teacher_id } = req.body;
    console.log("teacher_id", teacher_id);

    const result = await pool.query(
      `UPDATE subjects
       SET teacher_id=$1, updated_at=NOW()
       WHERE id=$2 RETURNING *`,
      [teacher_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating subject", err);
    res.status(500).json({ error: "Failed to update subject" });
  }
};

// DELETE
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM subjects WHERE id=$1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Subject not found" });
    }

    res.json({ message: "Subject deleted" });
  } catch (err) {
    console.error("Error deleting subject", err);
    res.status(500).json({ error: "Failed to delete subject" });
  }

  
};

// GET subjects by teacher_id
export const getSubjectDataFromTeacherId = async (req, res) => {
  try {
    const { teacher_id } = req.params; // we will pass teacher_id in the URL

    const result = await pool.query(
      `SELECT * from subjects where teacher_id = $1`,
      [teacher_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No subjects found for this teacher" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching subjects by teacher_id", err);
    res.status(500).json({ error: "Failed to fetch subjects by teacher_id" });
  }
};


// GET subjects by teacher_id AND class_id
export const getSubjectsByTeacherAndClass = async (req, res) => {
  console.log("Fetching subjects by teacher and class...");
  try {
    const { teacher_id, class_id } = req.params; // route params

    const result = await pool.query(
      `SELECT * FROM subjects WHERE teacher_id = $1 AND class_id = $2`,
      [teacher_id, class_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No subjects found for this teacher and class" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching subjects by teacher_id and class_id", err);
    res.status(500).json({ error: "Failed to fetch subjects by teacher and class" });
  }
};


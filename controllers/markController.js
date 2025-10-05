import pool from "../db.js";

/**
 * CREATE or UPDATE mark (upsert logic)
 * - If a mark already exists for the given (student_id, subject_code)
 *   → it will update instead of inserting a new one.
 */
export const createMark = async (req, res) => {
    console.log("---------------- reate mark is executing");
    try {
        const { student_id, subject_code, total_mark, obtained_marks } = req.body;

        if (!student_id || !subject_code || !total_mark) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if a record already exists for this student & subject
        const existing = await pool.query(
            `SELECT id FROM marks WHERE student_id = $1 AND subject_code = $2`,
            [student_id, subject_code]
        );
        let result;

        if (existing.rows.length > 0) {
            // 🔁 Record exists → UPDATE it
            const markId = existing.rows[0].id;
            result = await pool.query(
                `UPDATE marks
         SET total_mark = $1,
             obtained_marks = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
                [total_mark, obtained_marks, markId]
            );

            return res.status(200).json({
                message: "Mark updated successfully",
                data: result.rows[0],
            });
        } else {
            // 🆕 No record → INSERT new
            result = await pool.query(
                `INSERT INTO marks (student_id, subject_code, total_mark, obtained_marks)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [student_id, subject_code, total_mark, obtained_marks || null]
            );

            return res.status(201).json({
                message: "Mark created successfully",
                data: result.rows[0],
            });
        }

    } catch (err) {
        console.error("Error creating/updating mark:", err);
        res.status(500).json({ error: "Failed to create or update mark" });
    }
};

// ✅ GET all marks (with optional filters)
export const listMarks = async (req, res) => {
    try {
        const { student_id, subject_code } = req.query;
    //     let query = `
    //   SELECT  * from marks where student_id = $1 and subject_code = $2`;
        // const params = [];

        const userResult = await pool.query("SELECT * FROM marks WHERE student_id = $1 and subject_code = $2", [student_id, subject_code]);

        // if (student_id) {
        //     params.push(student_id);
        //     query += ` AND m.student_id = $${params.length}`;
        // }

        // if (subject_code) {
        //     params.push(subject_code);
        //     query += ` AND m.subject_code = $${params.length}`;
        // }

        // query += " ORDER BY m.id DESC";

        // const result = await pool.query(query, params);
        res.json(userResult.rows);
    } catch (err) {
        console.error("Error fetching marks:", err);
        res.status(500).json({ error: "Failed to fetch marks" });
    }
};

// ✅ GET mark by ID
export const getMarkById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM marks WHERE id = $1", [id]);

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Mark not found" });

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching mark by ID:", err);
        res.status(500).json({ error: "Failed to fetch mark" });
    }
};

export const getMarkByStudentId = async (req, res) => {
    try {
        const { student_id } = req.params;
        console.log("student_id", student_id);
        const result = await pool.query("SELECT * FROM marks WHERE student_id = $1", [student_id]);

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Selected stdent Mark not found" });
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching mark by ID:", err);
        res.status(500).json({ error: "Failed to fetch selected student mark" });
    }
};

// ✅ UPDATE mark manually (by ID)
export const updateMark = async (req, res) => {
    try {
        const { id } = req.params;
        const { student_id, subject_code, total_mark, obtained_marks } = req.body;

        const result = await pool.query(
            `UPDATE marks
       SET student_id = $1,
           subject_code = $2,
           total_mark = $3,
           obtained_marks = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
            [student_id, subject_code, total_mark, obtained_marks, id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Mark not found" });

        res.json({ message: "Mark updated successfully", data: result.rows[0] });
    } catch (err) {
        console.error("Error updating mark:", err);
        res.status(500).json({ error: "Failed to update mark" });
    }
};

// ✅ DELETE mark
export const deleteMark = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM marks WHERE id = $1 RETURNING *", [id]);

        if (result.rows.length === 0)
            return res.status(404).json({ error: "Mark not found" });

        res.json({ message: "Mark deleted successfully" });
    } catch (err) {
        console.error("Error deleting mark:", err);
        res.status(500).json({ error: "Failed to delete mark" });
    }
};

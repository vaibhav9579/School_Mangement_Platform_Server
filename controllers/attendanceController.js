import pool from "../db.js";

/**
 * ✅ GET all students + existing attendance for teacher's assigned class
 */
export const getStudentsWithAttendance = async (req, res) => {
    try {
        const teacherId = req.params.id; // assuming auth middleware sets req.user
        console.log("teacherId", teacherId);
        const today = new Date().toISOString().split("T")[0];

        // Get teacher's assigned class/section
        const classAssignment = await pool.query(
    `SELECT id, institution_id, program_id, name
       FROM classes
       WHERE classteacher = $1
       LIMIT 1`,
            [teacherId]
        );
        console.log("classAssignment", classAssignment.rows);

        if (classAssignment.rows.length === 0)
            return res.status(404).json({ error: "No assigned class found for teacher" });

        const { id, institution_id, program_id } = classAssignment.rows[0];

        // Get all students in that class/section
        const students = await pool.query(
            `SELECT id, first_name, middle_name, last_name
       FROM admissions where class_id= $1`,
            [id]
        );

        console.log("students", students.rows);
        const studentIds = students.rows.map(s => s.id);

        console.log("studentIds", studentIds);

        // Get existing attendance for today
        let attendanceRecords = [];
        console.log(`SELECT * FROM attendance
         WHERE student_id = ANY($1) AND attendance_date = $2`,
            [studentIds, today]);

        if (studentIds.length > 0) {
            const result = await pool.query(
                `SELECT * FROM attendance
   WHERE student_id = ANY($1::int[]) AND attendance_date = $2`,
                [studentIds, today]
            );
            attendanceRecords = result.rows;
        }

// console.log("attendanceRecords", attendanceRecords);
        res.json({
            id,
            institution_id,
            students: students.rows,
            attendance: attendanceRecords
        });

    } catch (err) {
        console.error("Error fetching students with attendance:", err);
        res.status(500).json({ error: "Failed to fetch students and attendance" });
    }
};

/**
 * ✅ Bulk save/upsert attendance
 */
export const saveBulkAttendance = async (req, res) => {
    const client = await pool.connect();
    try {
        const { records, class_id, section_id, institution_id, department_id, program_id, taken_by_user_id, attendance_date } = req.body;

        if (!records || records.length === 0)
            return res.status(400).json({ error: "No attendance records provided" });

        await client.query("BEGIN");

        for (const record of records) {
            const { student_id, status, arrival_time, remark } = record;

            // Upsert attendance
            const upsert = await client.query(
                `INSERT INTO attendance (institution_id, department_id, program_id, class_id, section_id, student_id, taken_by_user_id, attendance_date, status, arrival_time, remark)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (student_id, attendance_date)
         DO UPDATE SET status = $9, arrival_time = $10, remark = $11, updated_at = NOW()
         RETURNING attendance_id, status`,
                [institution_id, department_id, program_id, class_id, section_id, student_id, taken_by_user_id, attendance_date, status, arrival_time, remark]
            );

            const attendanceId = upsert.rows[0].attendance_id;

            // Insert into audit table
            await client.query(
                `INSERT INTO attendance_audit (attendance_id, changed_by_user_id, new_status, new_arrival_time, new_remark)
         VALUES ($1, $2, $3, $4, $5)`,
                [attendanceId, taken_by_user_id, status, arrival_time, remark]
            );
        }

        // Update attendance summary
        const summary = await client.query(
            `INSERT INTO attendance_summary (institution_id, department_id, program_id, class_id, section_id, attendance_date, present_count, absent_count, late_count, leave_count, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,
         (SELECT COUNT(*) FROM attendance WHERE class_id=$4 AND section_id=$5 AND attendance_date=$6 AND status='present'),
         (SELECT COUNT(*) FROM attendance WHERE class_id=$4 AND section_id=$5 AND attendance_date=$6 AND status='absent'),
         (SELECT COUNT(*) FROM attendance WHERE class_id=$4 AND section_id=$5 AND attendance_date=$6 AND status='late'),
         (SELECT COUNT(*) FROM attendance WHERE class_id=$4 AND section_id=$5 AND attendance_date=$6 AND status='leave'),
         NOW())
       ON CONFLICT (class_id, section_id, attendance_date)
       DO UPDATE SET
         present_count = EXCLUDED.present_count,
         absent_count = EXCLUDED.absent_count,
         late_count = EXCLUDED.late_count,
         leave_count = EXCLUDED.leave_count,
         updated_at = NOW()`,
            [institution_id, department_id, program_id, class_id, section_id, attendance_date]
        );

        await client.query("COMMIT");

        res.json({ message: "Attendance saved successfully" });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error saving bulk attendance:", err);
        res.status(500).json({ error: "Failed to save attendance" });
    } finally {
        client.release();
    }
};

/**
 * ✅ Edit single attendance record
 */
export const editAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, arrival_time, remark, changed_by_user_id } = req.body;

        // Get old attendance
        const old = await pool.query("SELECT * FROM attendance WHERE attendance_id=$1", [id]);
        if (old.rows.length === 0)
            return res.status(404).json({ error: "Attendance record not found" });

        const oldRecord = old.rows[0];

        // Update attendance
        const result = await pool.query(
            `UPDATE attendance
       SET status=$1, arrival_time=$2, remark=$3, updated_at=NOW()
       WHERE attendance_id=$4
       RETURNING *`,
            [status, arrival_time, remark, id]
        );

        // Insert into audit table
        await pool.query(
            `INSERT INTO attendance_audit (attendance_id, changed_by_user_id, old_status, new_status, old_arrival_time, new_arrival_time, old_remark, new_remark)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [id, changed_by_user_id, oldRecord.status, status, oldRecord.arrival_time, arrival_time, oldRecord.remark, remark]
        );

        res.json({ message: "Attendance updated successfully", data: result.rows[0] });

    } catch (err) {
        console.error("Error editing attendance:", err);
        res.status(500).json({ error: "Failed to update attendance" });
    }
};

/**
 * ✅ Get attendance by date for teacher's class/section
 */
export const getAttendanceByDate = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { date } = req.params;

        const classAssignment = await pool.query(
            `SELECT class_id, section_id, institution_id, department_id, program_id
       FROM teacher_subject_assignments tsa
       JOIN subjects s ON tsa.subject_id = s.id
       WHERE tsa.teacher_id = $1
       LIMIT 1`,
            [teacherId]
        );

        if (classAssignment.rows.length === 0)
            return res.status(404).json({ error: "No assigned class found for teacher" });

        const { class_id, section_id, institution_id, department_id, program_id } = classAssignment.rows[0];

        const attendance = await pool.query(
            `SELECT * FROM attendance
       WHERE class_id=$1 AND section_id=$2 AND attendance_date=$3`,
            [class_id, section_id, date]
        );

        res.json({ class_id, section_id, institution_id, department_id, program_id, attendance: attendance.rows });

    } catch (err) {
        console.error("Error fetching attendance by date:", err);
        res.status(500).json({ error: "Failed to fetch attendance" });
    }
};

// controllers/academicController.js
import pool from "../db.js";

// Institutions
export async function listInstitutions(req, res) {
  try {
    const q = await pool.query('SELECT * FROM institution ORDER BY name');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
export async function createInstitution(req, res) {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const q = await pool.query('INSERT INTO institution (name,type) VALUES ($1,$2) RETURNING *', [name, type]);
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
export async function updateInstitution(req, res) {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const q = await pool.query('UPDATE institution SET name=$1,type=$2 WHERE id=$3 RETURNING *', [name, type, id]);
    res.json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
export async function deleteInstitution(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM institution WHERE id=$1', [id]);
    res.json({ message: 'deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// Departments (college)
export async function listDepartments(req, res) {
  try {
    const { institutionId } = req.query;
    const q = institutionId
      ? await pool.query('SELECT * FROM departments WHERE institution_id=$1 ORDER BY name', [institutionId])
      : await pool.query('SELECT * FROM departments ORDER BY name');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function createDepartment(req, res) {
  try {
    const { institution_id, name } = req.body;
    const q = await pool.query('INSERT INTO departments (institution_id,name) VALUES ($1,$2) RETURNING *', [institution_id, name]);
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const q = await pool.query('UPDATE departments SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
    res.json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM departments WHERE id=$1', [id]);
    res.json({ message: 'deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// Programs
export async function listPrograms(req, res) {
  try {
    const { departmentId } = req.query;
    const q = departmentId
      ? await pool.query('SELECT * FROM programs WHERE department_id=$1 ORDER BY name', [departmentId])
      : await pool.query('SELECT * FROM programs ORDER BY name');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function createProgram(req, res) {
  try {
    const { department_id, name } = req.body;
    const q = await pool.query('INSERT INTO programs (department_id,name) VALUES ($1,$2) RETURNING *', [department_id, name]);
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function updateProgram(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const q = await pool.query('UPDATE programs SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
    res.json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function deleteProgram(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM programs WHERE id=$1', [id]);
    res.json({ message: 'deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// Classes
export async function listClasses(req, res) {
  try {
    const { institutionId, programId } = req.query;
    let q;
    if (programId) q = await pool.query('SELECT * FROM classes WHERE program_id=$1 ORDER BY name', [programId]);
    else if (institutionId) q = await pool.query('SELECT * FROM classes WHERE institution_id=$1 ORDER BY name', [institutionId]);
    else q = await pool.query('SELECT * FROM classes ORDER BY name');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function getClassbyId(req, res) {
  console.log("GetClass by id is executing");
  try {
    const {id} = req.params;
    const result = await pool.query(`Select * from classes where classteacher = $1`, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message })
  }
} 

export async function createClass(req, res) {
  console.log("req.body", req.body);
  try {
    const { institution_id, program_id, name, classteacher } = req.body;
    const q = await pool.query('INSERT INTO classes (institution_id,program_id,name, classteacher) VALUES ($1,$2,$3,$4) RETURNING *', [institution_id, program_id || null, name, classteacher || null]);
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// export async function updateClass(req, res) {
//   console.log("req.params.", req.params);
//   console.log("req.body", req.body);
//   try {
//     const { id } = req.params;
//     const { name } = req.body;
//     const q = await pool.query('UPDATE classes SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
//     res.json(q.rows[0]);
//   } catch (e) { res.status(500).json({ error: e.message }); }
// }

export async function updateClass(req, res) {

  try {
    const { id } = req.params;
    const { name, classteacher, program_id } = req.body;

    // Dynamically build query
    const fields = [];
    const values = [];
    let i = 1;

    if (name !== undefined) { fields.push(`name=$${i++}`); values.push(name); }
    if (classteacher !== undefined) { fields.push(`classteacher=$${i++}`); values.push(classteacher); }
    if (program_id !== undefined) { fields.push(`program_id=$${i++}`); values.push(program_id); }

    if (fields.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    values.push(id);
    const q = await pool.query(`UPDATE classes SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`, values);

    if (q.rows.length === 0)
      return res.status(404).json({ error: "Class not found" });

    res.json(q.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

export async function deleteClass(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM classes WHERE id=$1', [id]);
    res.json({ message: 'deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// Sections
export async function listSections(req, res) {
  try {
    const { classId } = req.query;
    const q = classId ? await pool.query('SELECT * FROM sections WHERE class_id=$1 ORDER BY name', [classId]) : await pool.query('SELECT * FROM sections ORDER BY name');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function createSection(req, res) {
  try {
    const { class_id, name } = req.body;
    const q = await pool.query('INSERT INTO sections (class_id,name) VALUES ($1,$2) RETURNING *', [class_id, name]);
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function updateSection(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const q = await pool.query('UPDATE sections SET name=$1 WHERE id=$2 RETURNING *', [name, id]);
    res.json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}

export async function deleteSection(req, res) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM sections WHERE id=$1', [id]);
    res.json({ message: 'deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}

// Convenience route: full structure for an institution
export async function fullStructure(req, res) {
  try {
    const { institutionId } = req.params;
    const instQ = await pool.query('SELECT * FROM institution WHERE id=$1', [institutionId]);
    if (instQ.rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
    const institution = instQ.rows[0];
    if (institution.type === 'school') {
      const classes = await pool.query('SELECT * FROM classes WHERE institution_id=$1 ORDER BY name', [institutionId]);
      const classIds = classes.rows.map(r => r.id);
      const sections = classIds.length ? (await pool.query('SELECT * FROM sections WHERE class_id=ANY($1::int[]) ORDER BY name', [classIds])).rows : [];
      return res.json({ institution, classes: classes.rows, sections });
    } else {
      const departments = await pool.query('SELECT * FROM departments WHERE institution_id=$1 ORDER BY name', [institutionId]);
      const deptIds = departments.rows.map(r => r.id);
      const programs = deptIds.length ? (await pool.query('SELECT * FROM programs WHERE department_id=ANY($1::int[]) ORDER BY name', [deptIds])).rows : [];
      const programIds = programs.map(p => p.id);
      const classes = programIds.length ? (await pool.query('SELECT * FROM classes WHERE program_id=ANY($1::int[]) ORDER BY name', [programIds])).rows : [];
      const classIds = classes.map(c => c.id);
      const sections = classIds.length ? (await pool.query('SELECT * FROM sections WHERE class_id=ANY($1::int[]) ORDER BY name', [classIds])).rows : [];
      return res.json({ institution, departments: departments.rows, programs, classes, sections });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
}

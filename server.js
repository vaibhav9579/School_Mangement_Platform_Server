// server.js
import express from "express";
import pkg from "pg";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import leavePolicyRoutes from "./routes/leavePolicyRoutes.js";
import leaveRequestRoutes from "./routes/leaveRequestRoutes.js";
import multer from "multer";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import academicRoutes from './routes/academicRoutes.js';

dotenv.config();
const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/policies", leavePolicyRoutes);
app.use("/api/requests", leaveRequestRoutes);


// health
app.get('/health', (req,res)=>res.json({ok:true}));

// academic routes
app.use('/api/academic', academicRoutes);



// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "Vaibhav@123",
  port: 5432,
});

// ✅ LOGIN A]PI
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE name = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];
    console.log("**** User fetched from DB:", user);

    // Compare hash
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("isMatch:", isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      "yourSecretKey", // 🔐 keep in env file in production
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.name,
        role: user.role,
        // id: user.id
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Fetch all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role , password FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch users error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Fetch single user by ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch user error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Add new user (with hashed password)
app.post("/users", async (req, res) => {
  const { name, email, role, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // hash password before storing

    const result = await pool.query(
      "INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, password",
      [name, email, role, hashedPassword]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add user error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Update user by ID (with optional password update)
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  try {
    let query, values;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query =
        "UPDATE users SET name = $1, email = $2, role = $3, password = $4 WHERE id = $5 RETURNING id, name, email, role";
      values = [name, email, role, hashedPassword, id];
    } else {
      query =
        "UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, name, email, role";
      values = [name, email, role, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update user error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Delete user
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ================== CLASS ROUTES ==================

// ✅ Fetch all classes
app.get("/classes", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, classname, classteacher FROM classes ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch classes error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Fetch single class by ID
app.get("/classes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT id, classname, classteacher FROM classes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch class error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Add new class
app.post("/classes", async (req, res) => {
  const { classname, classteacher } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO classes (classname, classteacher) VALUES ($1, $2) RETURNING id, classname, classteacher",
      [classname, classteacher]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add class error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Update class by ID
app.put("/classes/:id", async (req, res) => {
  const { id } = req.params;
  const { classname, classteacher } = req.body;
  try {
    const result = await pool.query(
      "UPDATE classes SET classname = $1, classteacher = $2 WHERE id = $3 RETURNING id, classname, classteacher",
      [classname, classteacher, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update class error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Delete class
app.delete("/classes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM classes WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error("Delete class error:", err.message);
    res.status(500).send("Server Error");
  }
});

// for student admission
// ✅ Fetch single student by ID
app.get("/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT id, name, age, class FROM students WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch student error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Add new student
app.post("/students", async (req, res) => {
  const { name, age, class: studentClass } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO students (name, age, class) VALUES ($1, $2, $3) RETURNING id, name, age, class",
      [name, age, studentClass]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Add student error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Update student by ID
app.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const { name, age, class: studentClass } = req.body;
  try {
    const result = await pool.query(
      "UPDATE students SET name = $1, age = $2, class = $3 WHERE id = $4 RETURNING id, name, age, class",
      [name, age, studentClass, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update student error:", err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Delete student
app.delete("/students/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM students WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Delete student error:", err.message);
    res.status(500).send("Server Error");
  }
});

/** * Start roles section **
 * */

app.get('/roles', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving roles' });
  }
});

// ✅ Get role by ID
app.get('/roles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving role' });
  }
});

// ✅ Add new role
app.post('/roles', async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating role' });
  }
});

// ✅ Update role
app.put('/roles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE roles SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating role' });
  }
});

// ✅ Delete role
app.delete('/roles/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length) {
      res.json({ message: 'Role deleted successfully' });
    } else {
      res.status(404).json({ message: 'Role not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting role' });
  }
});


// for admission module start

// Upload folder
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// multer setup (store files locally)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const name = `${Date.now()}_${base}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });


// Helper: generate admission no (simple)
function generateAdmissionNo() {
  const year = new Date().getFullYear();
  const r = Math.floor(1000 + Math.random() * 9000);
  return `ADM-${year}-${r}`;
}

/**
 * Routes:
 * GET    /api/admissions                -> list (with optional filters ?status=&institution_type=)
 * GET    /api/admissions/:id            -> single admission (include documents)
 * POST   /api/admissions                -> create admission (multipart/form-data with files or json)
 * PUT    /api/admissions/:id            -> update admission (json)
 * PUT    /api/admissions/:id/approve    -> approve
 * PUT    /api/admissions/:id/reject     -> reject (body: { remarks })
 * POST   /api/admissions/:id/documents  -> upload docs for admission (multipart)
 * GET    /uploads/:filename             -> static serve
 */

// Serve uploads
app.use("/uploads", express.static(UPLOAD_DIR));

// GET list
app.get("/api/admissions", async (req, res) => {
  try {
    const { status, institution_type } = req.query;
    let sql = "SELECT * FROM admissions";
    const conditions = [];
    const params = [];
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (institution_type) {
      params.push(institution_type);
      conditions.push(`institution_type = $${params.length}`);
    }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY created_at DESC";
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/admissions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single admission + docs
app.get("/api/admissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adm = await pool.query("SELECT * FROM admissions WHERE id=$1", [id]);
    if (adm.rows.length === 0) return res.status(404).json({ message: "Not found" });
    const docs = await pool.query("SELECT id, doc_type, filename, filepath, uploaded_at FROM documents WHERE admission_id=$1", [id]);
    const row = adm.rows[0];
    row.documents = docs.rows;
    res.json(row);
  } catch (err) {
    console.error("GET /api/admissions/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST create admission (accepts JSON body OR multipart with files)
app.post("/api/admissions", upload.fields([
  { name: "idProof" },
  { name: "transferCertificate" },
  { name: "marksheet" },
  { name: "other" },
  { name: "photo" }
]), async (req, res) => {
  try {
    // if multipart, fields live in req.body, files in req.files
    const body = req.body || {};
    // prefer JSON fields if provided
    const admission_no = body.admission_no || generateAdmissionNo();
    const full_name = body.full_name || body.fullName;
    // required
    if (!full_name) return res.status(400).json({ error: "full_name required" });

    const {
      dob, gender, guardian_name, contact, address, institution_type,
      school_class, school_section, college_department, college_program,
      college_year, college_section, fee_structure_id, initial_payment_received, initial_payment_amount, created_by
    } = body;

    const insertSql = `
      INSERT INTO admissions (
        admission_no, full_name, dob, gender, guardian_name, contact, address,
        institution_type, school_class, school_section, college_department,
        college_program, college_year, college_section, fee_structure_id,
        initial_payment_received, initial_payment_amount, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`;
    const params = [
      admission_no, full_name, dob || null, gender || null, guardian_name || null, contact || null, address || null,
      institution_type || null, school_class || null, school_section || null, college_department || null,
      college_program || null, college_year || null, college_section || null, fee_structure_id || null,
      initial_payment_received === "true" || initial_payment_received === true || initial_payment_received === "1", initial_payment_amount ? Number(initial_payment_amount) : 0, created_by || null
    ];

    const result = await pool.query(insertSql, params);
    const admission = result.rows[0];

    // handle files if any
    if (req.files) {
      const fileEntries = Object.entries(req.files);
      for (const [key, fileArr] of fileEntries) {
        // fileArr could be array
        for (const f of fileArr) {
          await pool.query(
            "INSERT INTO documents (admission_id, doc_type, filename, filepath) VALUES ($1, $2, $3, $4)",
            [admission.id, key, f.originalname, `/uploads/${f.filename}`]
          );
        }
      }
    }

    // return admission with docs
    const docs = await pool.query("SELECT id, doc_type, filename, filepath, uploaded_at FROM documents WHERE admission_id=$1", [admission.id]);
    admission.documents = docs.rows;
    res.status(201).json(admission);
  } catch (err) {
    console.error("POST /api/admissions error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update admission (basic)
app.put("/api/admissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const fields = [
      "full_name","dob","gender","guardian_name","contact","address","institution_type",
      "school_class","school_section","college_department","college_program",
      "college_year","college_section","fee_structure_id","initial_payment_received","initial_payment_amount","status","remarks"
    ];
    const sets = [];
    const params = [];
    let idx = 1;
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(body, f)) {
        sets.push(`${f} = $${idx}`);
        params.push(body[f]);
        idx++;
      }
    }
    if (sets.length === 0) return res.status(400).json({ message: "No fields to update" });
    params.push(id);
    const sql = `UPDATE admissions SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const result = await pool.query(sql, params);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/admissions/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Approve admission
app.put("/api/admissions/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("UPDATE admissions SET status='approved', updated_at = NOW() WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT approve error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reject admission with remarks
app.put("/api/admissions/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const result = await pool.query("UPDATE admissions SET status='rejected', remarks=$1, updated_at = NOW() WHERE id=$2 RETURNING *", [remarks || null, id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT reject error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Upload documents for existing admission
app.post("/api/admissions/:id/documents", upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    // ensure admission exists
    const adm = await pool.query("SELECT id FROM admissions WHERE id=$1", [id]);
    if (adm.rows.length === 0) return res.status(404).json({ message: "Admission not found" });

    if (!req.files || req.files.length === 0) return res.status(400).json({ message: "No files provided" });

    for (const f of req.files) {
      // req.body may include doc_type mapping; if not, use fieldname detection
      const docType = f.fieldname || "other";
      await pool.query("INSERT INTO documents (admission_id, doc_type, filename, filepath) VALUES ($1,$2,$3,$4)", [id, docType, f.originalname, `/uploads/${f.filename}`]);
    }

    const docs = await pool.query("SELECT id, doc_type, filename, filepath, uploaded_at FROM documents WHERE admission_id=$1", [id]);
    res.json({ documents: docs.rows });
  } catch (err) {
    console.error("POST upload docs error:", err);
    res.status(500).json({ error: err.message });
  }
});

// delete document
app.delete("/api/documents/:docId", async (req, res) => {
  try {
    const { docId } = req.params;
    const d = await pool.query("SELECT filepath FROM documents WHERE id=$1", [docId]);
    if (d.rows.length === 0) return res.status(404).json({ message: "Not found" });
    const filepath = path.join(process.cwd(), d.rows[0].filepath);
    // remove db row
    await pool.query("DELETE FROM documents WHERE id=$1", [docId]);
    // try to remove file
    try { fs.unlinkSync(filepath); } catch(e){ /* ignore */ }
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE document error:", err);
    res.status(500).json({ error: err.message });
  }
});



const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

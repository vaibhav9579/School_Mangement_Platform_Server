// server.js
import express from "express";
import pkg from "pg";
import bodyParser from "body-parser";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import leavePolicyRoutes from "./routes/leavePolicyRoutes.js";
import leaveRequestRoutes from "./routes/leaveRequestRoutes.js";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api/policies", leavePolicyRoutes);
app.use("/api/requests", leaveRequestRoutes);

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
  console.log('req.body', req.body);
  try {
    const result = await pool.query("SELECT * FROM users WHERE name = $1", [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = result.rows[0];

    // Compare hash
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("ismatch", isMatch);
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

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

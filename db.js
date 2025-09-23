import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "Vaibhav@123",  // ⚠️ Ideally move this to process.env
  port: 5432,
});

export default pool;

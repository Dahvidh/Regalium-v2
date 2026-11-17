import { getSql } from "./db.js";

export async function checkDatabase() {
  const sql = getSql();
  const rows = await sql`SELECT to_regclass('public.rglm_purchases') AS table_name`;
  if (!rows[0]?.table_name) {
    throw new Error("The rglm_purchases table is missing. Apply database/schema.sql in Neon.");
  }
  return true;
}

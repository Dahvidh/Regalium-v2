import { getSql } from "./db";

export async function checkDatabase() {
  const sql = getSql();
  await sql`SELECT 1`;
  return true;
}

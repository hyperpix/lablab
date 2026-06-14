import { neon, NeonQueryFunction } from "@neondatabase/serverless";

const DB_URL = import.meta.env.VITE_DATABASE_URL;

const sql: NeonQueryFunction<false, false> = neon(DB_URL);

export const isDbConfigured = Boolean(DB_URL);
export default sql;

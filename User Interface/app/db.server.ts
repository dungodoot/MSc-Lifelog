import Database from "better-sqlite3";

let db: Database.Database;

declare global {
  var __db: Database.Database | undefined;
}

db = new Database("../lifelog.db");

export { db };

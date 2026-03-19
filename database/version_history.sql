-- version_history.sql
-- CostoBot — Version History Schema
-- 
-- Nota: CostoBot usa MongoDB Atlas como base de datos principal.
-- Este archivo define el esquema conceptual del documento version_history
-- para referencia y para compatibilidad si se usa PostgreSQL/MySQL en CI.
--
-- En MongoDB se usa la colección "version_history" con el mismo campo schema.
-- Inspector: backend/routes/version.routes.js

-- ============================================================
-- SQL (PostgreSQL) — for reference / testing environments only
-- ============================================================

CREATE TABLE IF NOT EXISTS version_history (
  id           SERIAL PRIMARY KEY,
  version      VARCHAR(20)   NOT NULL,
  bump_type    VARCHAR(10)   NOT NULL CHECK (bump_type IN ('patch', 'minor', 'major', 'rollback')),
  message      TEXT          NOT NULL DEFAULT '',
  commit_hash  VARCHAR(40),
  branch       VARCHAR(100)  NOT NULL DEFAULT 'main',
  project      VARCHAR(100)  NOT NULL DEFAULT 'CostoBot',
  pushed_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_version_history_version  ON version_history (version);
CREATE INDEX IF NOT EXISTS idx_version_history_project  ON version_history (project);
CREATE INDEX IF NOT EXISTS idx_version_history_pushed   ON version_history (pushed_at DESC);

-- ============================================================
-- MongoDB equivalent (JSON Schema for validation)
-- Use in: db.createCollection("version_history", { validator: {...} })
-- ============================================================
-- {
--   "version":      "string",     // e.g. "1.2.3"
--   "bumpType":     "string",     // "patch" | "minor" | "major" | "rollback"
--   "message":      "string",     // commit message or description
--   "commitHash":   "string",     // short git SHA
--   "branch":       "string",     // default "main"
--   "project":      "string",     // "CostoBot"
--   "pushedAt":     "date",       // ISO timestamp
--   "createdAt":    "date"        // ISO timestamp
-- }

-- ============================================================
-- Seed data (initial version)
-- ============================================================

INSERT INTO version_history (version, bump_type, message, branch, project)
VALUES ('0.1.0', 'minor', 'Initial project setup — AUTONOMOUS versioning installed', 'main', 'CostoBot');

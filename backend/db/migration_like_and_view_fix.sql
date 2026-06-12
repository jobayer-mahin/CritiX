-- ═══════════════════════════════════════════════════════════════════
-- Migration: Like Toggle + View Tracking Fix
-- Run this in phpMyAdmin → SQL if your critix database already exists.
-- Safe to run multiple times (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════

USE critix;

-- ─── 1. discussion_likes table ───────────────────────────────────────
-- Enforces one-like-per-user via composite PRIMARY KEY.
-- Like toggle is now handled in the API; this table is the source of truth.
CREATE TABLE IF NOT EXISTS discussion_likes (
    user_id         INT NOT NULL,
    discussion_id   INT NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, discussion_id),
    FOREIGN KEY (user_id)       REFERENCES users       (id) ON DELETE CASCADE,
    FOREIGN KEY (discussion_id) REFERENCES discussions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 2. Recalculate likes_count to match actual rows ─────────────────
-- (Fixes any inflated counts caused by the old unlimited-like bug)
UPDATE discussions d
SET d.likes_count = (
    SELECT COUNT(*) FROM discussion_likes dl WHERE dl.discussion_id = d.id
);

UPDATE reviews r
SET r.likes_count = (
    SELECT COUNT(*) FROM review_likes rl WHERE rl.review_id = r.id
);

-- ─── Done ─────────────────────────────────────────────────────────────
-- The review_likes table already has PRIMARY KEY (user_id, review_id),
-- so review like-toggle was already protected at the DB level.
-- This migration only adds discussion_likes and recalibrates counts.

-- ═══════════════════════════════════════════════════════════════
-- MIGRATION: Fix seeded user passwords
-- Run this if your database was already created with the OLD schema
-- that had the wrong password hash (hash of "password" instead of "password123")
--
-- OLD (wrong) hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
--   → This is the well-known Laravel default hash for the word "password"
--   → NOT "password123" as the comments claimed
--
-- NEW (correct) hash: $2a$10$UIzv8tErUQfKx8FfMVsDHuM2tybMhTbTgCfDnAqEkUE3ZKb8PoH4S
--   → This is bcrypt(10) hash of "password123"
-- ═══════════════════════════════════════════════════════════════

USE critix;

UPDATE users
SET password_hash = '$2a$10$UIzv8tErUQfKx8FfMVsDHuM2tybMhTbTgCfDnAqEkUE3ZKb8PoH4S'
WHERE password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

-- After running this, all affected seeded users can log in with: password123
-- Affected users: jobayer123@gmail.com, arzu123@gmail.com, tazinahmed123@gmail.com,
--                 gracie123@gmail.com, spaeny123@gmail.com

-- ─── OPTIONAL: Also reset fake engagement counts ────────────
-- Run the lines below if you want to reset fake engagement on existing data:

-- Reset fake review likes to 0
UPDATE reviews SET likes_count = 0 WHERE id IN (1,2,3,4,5,6,7,8,9,10);

-- Reset fake discussion engagement to 0
UPDATE discussions SET likes_count = 0, views = 0, replies = 0 WHERE id IN (1,2,3,4,5);

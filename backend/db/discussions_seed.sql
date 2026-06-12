-- ════════════════════════════════════════
-- Discussions seed data
-- FIX: likes_count and views set to 0 (were fake seeded values: 312/8400, 289/7100, etc.)
-- ════════════════════════════════════════

INSERT IGNORE INTO discussions (id, user_id, title, body, tags, likes_count, views) VALUES
(1, 2, 'Is Oppenheimer the best biopic ever made?', 'Nolan somehow turned a history lesson into a visceral thriller. The non-linear structure mirrors Oppenheimer''s fractured sense of morality. Has any biopic ever been this formally ambitious?', '["Oppenheimer","Nolan","Biopic"]', 0, 0),
(2, 3, 'Why Dune: Part Two is a generational sci-fi achievement', 'Villeneuve didn''t just adapt Herbert — he reinvented what blockbuster filmmaking can be. Every frame is a painting. The sound design alone deserves awards.', '["Dune","Sci-Fi","Villeneuve"]', 0, 0),
(3, 1, 'Succession finale: did it stick the landing?', 'Hot take: the Waystar boardroom scene is the finest 20 minutes in television history. The performances, the silence, the final shot — perfection. Change my mind.', '["Succession","TV","Drama"]', 0, 0),
(4, 4, 'The Bear Season 3 — was the hype justified?', 'Season 2 set an impossible bar. S3 is quieter, more introspective. Some call it slow, I call it mature. The episode ''Napkins'' alone is worth the price of admission.', '["TheBear","TV","Drama"]', 0, 0),
(5, 5, 'Past Lives deserved the Best Picture Oscar', 'The Academy consistently undervalues quiet, personal cinema. Past Lives is the rare film that makes you feel the weight of unlived lives. Celine Song is a generational voice.', '["PastLives","Oscars","Romance"]', 0, 0);

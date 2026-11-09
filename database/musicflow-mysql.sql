-- Generated from database/musicflow.db.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `albums`;
CREATE TABLE `albums` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `title` TEXT NOT NULL,
  `artist_id` INT NOT NULL,
  `release_date` TEXT,
  `cover_url` TEXT,
  `label` TEXT,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_albums_0` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (1, 'Neon Tide', 1, '2025-03-14', '/covers/neon-tide.png', 'Afterglow Records');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (2, 'Afterglow', 1, '2025-09-02', '/covers/afterglow.png', 'Afterglow Records');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (3, 'Quiet Hollow', 2, '2024-11-08', '/covers/quiet-hollow.png', 'Little Porch Records');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (4, '3AM Static', 3, '2026-01-19', '/covers/3am-static.png', 'Static Hour');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (5, 'Paper Weather', 4, '2025-05-23', '/covers/paper-weather.png', 'Origami Sound');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (6, 'Today’s Top Hits (Compilation)', 5, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (7, 'Today’s Top Hits (Compilation)', 6, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (8, 'Today’s Top Hits (Compilation)', 7, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (9, 'Today’s Top Hits (Compilation)', 8, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (10, 'Today’s Top Hits (Compilation)', 9, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (11, 'Today’s Top Hits (Compilation)', 10, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (12, 'Today’s Top Hits (Compilation)', 11, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (13, 'Today’s Top Hits (Compilation)', 12, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (14, 'Today’s Top Hits (Compilation)', 13, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (15, 'Today’s Top Hits (Compilation)', 14, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (16, 'Today’s Top Hits (Compilation)', 15, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (17, 'Today’s Top Hits (Compilation)', 16, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (18, 'Today’s Top Hits (Compilation)', 17, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (19, 'Today’s Top Hits (Compilation)', 18, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (20, 'Today’s Top Hits (Compilation)', 19, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (21, 'Today’s Top Hits (Compilation)', 20, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (22, 'Today’s Top Hits (Compilation)', 21, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (23, 'Today’s Top Hits (Compilation)', 22, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (24, 'Today’s Top Hits (Compilation)', 23, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (25, 'Today’s Top Hits (Compilation)', 24, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (26, 'Today’s Top Hits (Compilation)', 25, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (27, 'Today’s Top Hits (Compilation)', 26, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (28, 'Today’s Top Hits (Compilation)', 27, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (29, 'Today’s Top Hits (Compilation)', 28, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (30, 'Today’s Top Hits (Compilation)', 29, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (31, 'Today’s Top Hits (Compilation)', 30, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (32, 'Today’s Top Hits (Compilation)', 31, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (33, 'Today’s Top Hits (Compilation)', 32, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (34, 'Today’s Top Hits (Compilation)', 33, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (35, 'Today’s Top Hits (Compilation)', 34, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (36, 'Today’s Top Hits (Compilation)', 35, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (37, 'Today’s Top Hits (Compilation)', 36, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (38, 'Today’s Top Hits (Compilation)', 37, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (39, 'Today’s Top Hits (Compilation)', 38, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (40, 'Today’s Top Hits (Compilation)', 39, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (41, 'Today’s Top Hits (Compilation)', 40, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (42, 'Today’s Top Hits (Compilation)', 41, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (43, 'Today’s Top Hits (Compilation)', 42, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (44, 'Today’s Top Hits (Compilation)', 43, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (45, 'Today’s Top Hits (Compilation)', 44, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');
INSERT INTO `albums` (`id`, `title`, `artist_id`, `release_date`, `cover_url`, `label`) VALUES (46, 'Today’s Top Hits (Compilation)', 45, '2026-08-27', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', 'Spotify');

DROP TABLE IF EXISTS `artists`;
CREATE TABLE `artists` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` TEXT NOT NULL,
  `bio` TEXT,
  `genre_tags` VARCHAR(255) NOT NULL DEFAULT '[]',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (1, 'Nova Ember', 'Synth-driven soundscapes for night drives and neon skylines.', '["synthwave","electronic"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (2, 'Cedar & Vine', 'Warm, fingerpicked folk for quiet mornings and old porches.', '["indie folk","acoustic"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (3, 'Midnight Transit', 'Lo-fi loops for late trains and half-finished thoughts.', '["lo-fi","hip hop"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (4, 'The Paper Cranes', 'Bright, hook-driven indie pop about small joys.', '["indie pop","rock"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (5, 'Tame Impala', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (6, 'Ariana Grande', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (7, 'Shakira, Burna Boy', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (8, 'Olivia Rodrigo', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (9, 'Malcolm Todd', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (10, 'KATSEYE', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (11, 'Dominic Fike', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (12, 'Ella Langley', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (13, 'Olivia Dean', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (14, 'Temper City', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (15, 'ADÉLA', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (16, 'Drake', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (17, 'Sam Fender, Olivia Dean', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (18, 'ANOTR, 54 Ultra', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (19, 'Bad Bunny', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (20, 'Taylor Swift', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (21, 'RAYE', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (22, 'Justin Bieber', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (23, 'Bruno Mars', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (24, 'JENNIE', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (25, 'Dave, Tems', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (26, 'PinkPantheress, Zara Larsson', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (27, 'HUGEL, SOLTO (FR)', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (28, 'KAROL G, Judeline, rusowsky', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (29, 'Alyssa Grace', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (30, 'STELLA LEFTY', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (31, 'Djo', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (32, 'Audrey Hobert', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (33, 'Zara Larsson', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (34, 'Noah Kahan', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (35, 'SIENNA SPIRO', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (36, 'Morgan Wallen', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (37, 'Sabrina Carpenter', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (38, 'sombr', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (39, 'Steve Lacy', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (40, 'Bella Kay', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (41, 'Ravyn Lenae', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (42, 'Harry Styles', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (43, 'F3miii', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (44, 'BTS', 'Artist imported from Spotify', '["imported"]');
INSERT INTO `artists` (`id`, `name`, `bio`, `genre_tags`) VALUES (45, 'Don Toliver', 'Artist imported from Spotify', '["imported"]');

DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `user_id` INT NOT NULL,
  `track_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `track_id`),
  CONSTRAINT `fk_favorites_0` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`),
  CONSTRAINT `fk_favorites_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `favorites` (`user_id`, `track_id`, `created_at`) VALUES (2, 4, '2026-08-27 10:09:41');
INSERT INTO `favorites` (`user_id`, `track_id`, `created_at`) VALUES (2, 11, '2026-08-27 10:09:41');
INSERT INTO `favorites` (`user_id`, `track_id`, `created_at`) VALUES (2, 10, '2026-08-27 10:09:41');

DROP TABLE IF EXISTS `playback_history`;
CREATE TABLE `playback_history` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `user_id` INT NOT NULL,
  `track_id` INT NOT NULL,
  `played_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_playback_history_0` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`),
  CONSTRAINT `fk_playback_history_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `playlist_tracks`;
CREATE TABLE `playlist_tracks` (
  `playlist_id` INT NOT NULL,
  `track_id` INT NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`playlist_id`, `track_id`),
  CONSTRAINT `fk_playlist_tracks_0` FOREIGN KEY (`track_id`) REFERENCES `tracks` (`id`),
  CONSTRAINT `fk_playlist_tracks_1` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (1, 1, 0);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (1, 2, 1);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (1, 3, 2);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (1, 9, 3);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (1, 5, 4);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (2, 6, 0);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (2, 7, 1);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (2, 8, 2);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (2, 12, 3);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 14, 0);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 15, 1);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 16, 2);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 17, 3);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 18, 4);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 19, 5);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 20, 6);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 21, 7);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 22, 8);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 23, 9);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 24, 10);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 25, 11);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 26, 12);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 27, 13);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 28, 14);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 29, 15);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 30, 16);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 31, 17);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 32, 18);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 33, 19);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 34, 20);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 35, 21);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 36, 22);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 37, 23);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 38, 24);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 39, 25);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 40, 26);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 41, 27);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 42, 28);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 43, 29);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 44, 30);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 45, 31);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 46, 32);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 47, 33);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 48, 34);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 49, 35);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 50, 36);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 51, 37);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 52, 38);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 53, 39);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 54, 40);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 55, 41);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 56, 42);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 57, 43);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 58, 44);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 59, 45);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 60, 46);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 61, 47);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 62, 48);
INSERT INTO `playlist_tracks` (`playlist_id`, `track_id`, `sort_order`) VALUES (3, 63, 49);

DROP TABLE IF EXISTS `playlists`;
CREATE TABLE `playlists` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `user_id` INT NOT NULL,
  `name` TEXT NOT NULL,
  `description` TEXT,
  `is_public` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_playlists_0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `playlists` (`id`, `user_id`, `name`, `description`, `is_public`, `created_at`) VALUES (1, 2, 'Late Night Drive', 'For when the city''s asleep and you''re not.', 1, '2026-08-27 10:09:41');
INSERT INTO `playlists` (`id`, `user_id`, `name`, `description`, `is_public`, `created_at`) VALUES (2, 2, 'Quiet Mornings', 'Slow coffee, soft light.', 1, '2026-08-27 10:09:41');
INSERT INTO `playlists` (`id`, `user_id`, `name`, `description`, `is_public`, `created_at`) VALUES (3, 2, 'My Spotify Top Hits', 'Spotify', 1, '2026-08-27 10:26:08');

DROP TABLE IF EXISTS `tracks`;
CREATE TABLE `tracks` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `title` TEXT NOT NULL,
  `artist_id` INT NOT NULL,
  `album_id` INT,
  `duration` INT NOT NULL,
  `audio_url` TEXT NOT NULL,
  `cover_url` TEXT,
  `genre_tags` VARCHAR(255) NOT NULL DEFAULT '[]',
  `mood_tags` VARCHAR(255) NOT NULL DEFAULT '[]',
  `is_downloadable` INT NOT NULL DEFAULT 0,
  `is_explicit` INT NOT NULL DEFAULT 0,
  `release_date` TEXT,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tracks_0` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`),
  CONSTRAINT `fk_tracks_1` FOREIGN KEY (`artist_id`) REFERENCES `artists` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (1, 'Neon Tide', 1, 1, 16, '/audio/neon-tide.wav', '/covers/neon-tide.png', '["synthwave","electronic"]', '["night drive","neon"]', 1, 0, '2025-03-14');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (2, 'Chrome Horizon', 1, 1, 15, '/audio/chrome-horizon.wav', '/covers/neon-tide.png', '["synthwave","electronic"]', '["night drive"]', 1, 0, '2025-03-14');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (3, 'Night Drive', 1, 1, 17, '/audio/night-drive.wav', '/covers/neon-tide.png', '["synthwave","electronic"]', '["night drive","late night"]', 0, 0, '2025-03-14');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (4, 'Afterglow', 1, 2, 14, '/audio/afterglow.wav', '/covers/afterglow.png', '["synthwave"]', '["late night","warm"]', 1, 0, '2025-09-02');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (5, 'Static Bloom', 1, 2, 15, '/audio/static-bloom.wav', '/covers/afterglow.png', '["synthwave"]', '["late night"]', 1, 0, '2025-09-02');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (6, 'Quiet Hollow', 2, 3, 16, '/audio/quiet-hollow.wav', '/covers/quiet-hollow.png', '["indie folk"]', '["quiet morning"]', 1, 0, '2024-11-08');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (7, 'Pine and Ash', 2, 3, 14, '/audio/pine-and-ash.wav', '/covers/quiet-hollow.png', '["indie folk"]', '["quiet morning"]', 1, 0, '2024-11-08');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (8, 'Slow River', 2, 3, 18, '/audio/slow-river.wav', '/covers/quiet-hollow.png', '["indie folk"]', '["quiet morning","calm"]', 0, 0, '2024-11-08');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (9, '3AM Static', 3, 4, 16, '/audio/3am-static.wav', '/covers/3am-static.png', '["lo-fi","hip hop"]', '["late night","static"]', 1, 0, '2026-01-19');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (10, 'Dial Tone Dreams', 3, 4, 15, '/audio/dial-tone-dreams.wav', '/covers/3am-static.png', '["lo-fi","hip hop"]', '["late night"]', 0, 0, '2026-01-19');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (11, 'Paper Weather', 4, 5, 14, '/audio/paper-weather.wav', '/covers/paper-weather.png', '["indie pop"]', '["sunny","upbeat"]', 1, 0, '2025-05-23');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (12, 'Umbrella Song', 4, 5, 13, '/audio/umbrella-song.wav', '/covers/paper-weather.png', '["indie pop"]', '["rainy day"]', 1, 0, '2025-05-23');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (13, 'Static Skyline', 4, 5, 15, '/audio/static-skyline.wav', '/covers/paper-weather.png', '["indie pop"]', '["upbeat"]', 1, 0, '2025-05-23');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (14, 'Loser', 5, 6, 223, 'https://p.scdn.co/mp3-preview/0015e9347a45b62215447eba657b2fc3ce279d2d', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (15, 'hate that i made you love me', 6, 7, 198, 'https://p.scdn.co/mp3-preview/9fb8e09c9facc2d9443b6e57ae36d47bf83c01b8', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (16, 'Dai Dai', 7, 8, 223, 'https://p.scdn.co/mp3-preview/a6955a6725dcf614e9915396987847ea0b509580', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (17, 'stupid song', 8, 9, 210, 'https://p.scdn.co/mp3-preview/894b272aa0422aeebe856825b55e5c736a9bc5ee', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (18, 'Earrings', 9, 10, 152, 'https://p.scdn.co/mp3-preview/20a1469df9f65a51878811bbe49979c418abc1b7', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (19, 'Animal', 10, 11, 158, 'https://p.scdn.co/mp3-preview/65040556453e4f1c76bcefebf54a718521588331', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (20, 'Babydoll', 11, 12, 98, 'https://p.scdn.co/mp3-preview/bf5ab98492256120bd9c48658e9c899c8692f77f', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (21, 'Choosin'' Texas', 12, 13, 232, 'https://p.scdn.co/mp3-preview/ad3f225321f11467402cc47e09f9ea1195f3de91', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (22, 'Man I Need', 13, 14, 184, 'https://p.scdn.co/mp3-preview/0a36635f94b4e44e6e4f5b7edb3f501d458812d9', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (23, 'Self Aware', 14, 15, 181, 'https://p.scdn.co/mp3-preview/98af5b6b77831ad55b6d1129148745705a311973', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (24, 'petal', 6, 7, 184, 'https://p.scdn.co/mp3-preview/30dc1adb43c170165bb8091e788b55f26f2fc672', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (25, 'Ain''t In LA', 15, 16, 185, 'https://p.scdn.co/mp3-preview/a3d0119e3182fbb19636c2a44737fa3e0b71f939', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (26, 'Janice STFU', 16, 17, 237, 'https://p.scdn.co/mp3-preview/1de9b315e1aa811aedaf905b1058b668b2d3146e', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (27, 'Rein Me In (with Olivia Dean)', 17, 18, 339, 'https://p.scdn.co/mp3-preview/6c85f9e4507e93478ee4adb7782f1a35a9d0e1ce', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (28, 'Talk To You (ft. 54 Ultra)', 18, 19, 191, 'https://p.scdn.co/mp3-preview/b55c8fa4e31192a3e35ad53d3e889733f9cd9da1', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (29, 'DtMF', 19, 20, 237, 'https://p.scdn.co/mp3-preview/e41ce6b82410d81c08baacca2a7169e5ace4287d', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (30, 'The Fate of Ophelia', 20, 21, 226, 'https://p.scdn.co/mp3-preview/f2765af4fcb12d896343889d5faa8144f976f42b', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (31, 'the cure', 8, 9, 297, 'https://p.scdn.co/mp3-preview/7559346825a2233855b5fc77e84a954606de3444', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (32, 'WHERE IS MY HUSBAND!', 21, 22, 197, 'https://p.scdn.co/mp3-preview/0194ff4186a1f53bff2cdf6d7660289ca8eb0e7e', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (33, 'DAISIES', 22, 23, 176, 'https://p.scdn.co/mp3-preview/d990a355be1d84adc0882bda733862fba7767e70', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (34, 'Risk It All', 23, 24, 204, 'https://p.scdn.co/mp3-preview/2467ff71a7508c57a62112ee5beb996bd6b9e957', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (35, 'Less than a Lover', 24, 25, 146, 'https://p.scdn.co/mp3-preview/db7d5914ba542d1e3c0180e2df1b154e3c0d388d', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (36, 'Raindance (feat. Tems)', 25, 26, 220, 'https://p.scdn.co/mp3-preview/7d860804d259f81b4a7bc04900a5410d99995fd4', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (37, 'Hootie Frutti', 10, 11, 141, 'https://p.scdn.co/mp3-preview/b90cdabeb3093431041841713c812e70bafb1478', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (38, 'Stateside + Zara Larsson', 26, 27, 185, 'https://p.scdn.co/mp3-preview/cc3201e7ed85d09f1683e591fd2eb964ea7247a6', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (39, 'Jamaican (Bam Bam)', 27, 28, 156, 'https://p.scdn.co/mp3-preview/90e14dd98b61140a5259ce400de788704d406742', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (40, 'BbY WOW', 28, 29, 226, 'https://p.scdn.co/mp3-preview/f6ab45a8375c5bcf6f03161edd9f44c1fad501c8', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (41, 'So Easy (To Fall In Love)', 13, 14, 169, 'https://p.scdn.co/mp3-preview/e0ea7353932017364bdb12dc776e89b360abac42', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (42, 'bloodstream', 29, 30, 177, 'https://p.scdn.co/mp3-preview/f1e7acbb1c04e8ba21d08d2402cf069a8eed8f96', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (43, 'Boston', 30, 31, 171, 'https://p.scdn.co/mp3-preview/7ffa15bbf70382813f8661408e976cc41655b367', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (44, 'I Knew It, I Knew You - From "Toy Story 5"', 20, 21, 178, 'https://p.scdn.co/mp3-preview/d21ded2a54dde5461f908b1bf26f1b4bae5ac139', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (45, 'End of Beginning', 31, 32, 159, 'https://p.scdn.co/mp3-preview/2f6f0965be46144eca9212258c7a2988376727a1', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (46, 'Sue me', 32, 33, 170, 'https://p.scdn.co/mp3-preview/3585c24b32da6477e0231e7b18e41c3599e42732', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (47, 'Midnight Sun', 33, 34, 190, 'https://p.scdn.co/mp3-preview/c5bbc379559c92c9d07e2cebf4a1e14029d01331', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (48, 'Orbiter', 34, 35, 287, 'https://p.scdn.co/mp3-preview/3f175c1a53a23119bfe50c9ca04e68d27d3131a5', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (49, 'Great Expectation', 35, 36, 174, 'https://p.scdn.co/mp3-preview/f82f2f3e714a66934fc309e357cbf249ad045f62', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (50, 'Been By Now', 36, 37, 214, 'https://p.scdn.co/mp3-preview/fe48c80ab8e5e0dd0458a8af317ce3df8bfbe27f', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (51, 'drop dead', 8, 9, 225, 'https://p.scdn.co/mp3-preview/cef0e37851eb1113e1a366d95cb1e3d05a9505a3', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (52, 'Manchild', 37, 38, 214, 'https://p.scdn.co/mp3-preview/37c21b6b0df9b7156527d0729a58b6db37c88a0a', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (53, 'Homewrecker', 38, 39, 209, 'https://p.scdn.co/mp3-preview/d46acdc8f94c6fa471388c7a10c619bb08c88197', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (54, 'I Just Might', 23, 24, 213, 'https://p.scdn.co/mp3-preview/d3b9a6318dcc942387b69c677a80377044856d69', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (55, 'oh yeah?', 39, 40, 171, 'https://p.scdn.co/mp3-preview/72b6457625435b7f64c345e86930e5f0071c559c', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (56, 'iloveitiloveitiloveit', 40, 41, 183, 'https://p.scdn.co/mp3-preview/bcb1c4999d947ff0541bc11b164d91069fad1669', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (57, 'Be Her', 12, 13, 217, 'https://p.scdn.co/mp3-preview/17eee24507cd710f88bb3ae4ea6c4157ed9b3489', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (58, 'Love Me Not', 41, 42, 213, 'https://p.scdn.co/mp3-preview/c660e524e84990f7687728af3ba09f9e071e585d', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (59, 'American Girls', 42, 43, 213, 'https://p.scdn.co/mp3-preview/b727b069e1fd5864ffa3c61edca662f87298231f', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (60, 'NOBLE', 43, 44, 186, 'https://p.scdn.co/mp3-preview/5fada77b20c9b592ea707bf74334195c2b8a125f', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (61, 'White Keys', 11, 12, 144, 'https://p.scdn.co/mp3-preview/4c09f53084e36b6c85f8b2a44893c226a3194f42', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (62, 'SWIM', 44, 45, 159, 'https://p.scdn.co/mp3-preview/acafb81cc609de53b9687a40f214f79d828b6947', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 0, '2026-08-27');
INSERT INTO `tracks` (`id`, `title`, `artist_id`, `album_id`, `duration`, `audio_url`, `cover_url`, `genre_tags`, `mood_tags`, `is_downloadable`, `is_explicit`, `release_date`) VALUES (63, 'E85', 45, 46, 153, 'https://p.scdn.co/mp3-preview/6531864966b2fc846a74a9bc161d9bf4563ec2e9', 'https://i.scdn.co/image/ab67706f0000000277c25630aff0901ed026d2d4', '["spotify"]', '["imported"]', 1, 1, '2026-08-27');

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT NOT NULL,
  `name` TEXT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` TEXT NOT NULL,
  `role` VARCHAR(255) NOT NULL DEFAULT 'listener',
  `subscription_status` VARCHAR(255) NOT NULL DEFAULT 'free',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_users_1` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `subscription_status`, `created_at`) VALUES (2, 'Demo Listener', 'demo@musicflow.app', '$2a$10$IMi8.JbjaMo/tZkyHqnYyuL0WjxMjWPgSQ2hpOHR.mnPvVZwTI4Qi', 'listener', 'free', '2026-08-27 10:09:41');

SET FOREIGN_KEY_CHECKS = 1;

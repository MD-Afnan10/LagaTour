29-08-2026

-- ================================================================================
-- Laga Tour - Chat & Messaging Schema (Step 1)
-- Database: lagatour_db
-- ================================================================================

USE `lagatour_db`;

-- --------------------------------------------------------
-- 1. Table structure for `conversations` (Direct & Group Chats)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `conversation_id` VARCHAR(255) NOT NULL,
  `type` ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  `title` VARCHAR(255) DEFAULT NULL COMMENT 'Group chat name, NULL for 1-on-1 direct chat',
  `avatar_url` LONGTEXT DEFAULT NULL COMMENT 'Custom group avatar or photo',
  `created_by` VARCHAR(255) DEFAULT NULL COMMENT 'Creator user_id for group chats',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`conversation_id`),
  KEY `fk_conv_creator` (`created_by`),
  CONSTRAINT `fk_conv_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for `conversation_members` (Participants & Unread Tracking)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversation_members` (
  `member_id` VARCHAR(255) NOT NULL,
  `conversation_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `unique_conversation_user` (`conversation_id`, `user_id`),
  KEY `fk_member_conv` (`conversation_id`),
  KEY `fk_member_user` (`user_id`),
  CONSTRAINT `fk_member_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table structure for `messages` (Message Stream & Media)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `message_id` VARCHAR(255) NOT NULL,
  `conversation_id` VARCHAR(255) NOT NULL,
  `sender_id` VARCHAR(255) NOT NULL,
  `message_text` TEXT NOT NULL,
  `media_url` LONGTEXT DEFAULT NULL,
  `message_type` ENUM('text', 'image', 'video', 'system') NOT NULL DEFAULT 'text',
  `is_read` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  KEY `fk_msg_conv` (`conversation_id`),
  KEY `fk_msg_sender` (`sender_id`),
  KEY `idx_conv_created` (`conversation_id`, `created_at`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`conversation_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Sample Seed Data (Initial Direct & Group Chats)
-- --------------------------------------------------------

-- Insert Conversations: 2 Direct Chats + 1 Group Chat
INSERT INTO `conversations` (`conversation_id`, `type`, `title`, `avatar_url`, `created_by`, `created_at`)
VALUES
  ('chat_1', 'direct', NULL, NULL, 'user_2', NOW() - INTERVAL 1 DAY),
  ('chat_2', 'direct', NULL, NULL, 'user_3', NOW() - INTERVAL 2 DAY),
  ('chat_group_1', 'group', 'St. Martin''s Weekend Expedition 🌊', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200', 'user_2', NOW() - INTERVAL 3 DAY)
ON DUPLICATE KEY UPDATE `type` = VALUES(`type`);

-- Insert Participants / Members
INSERT INTO `conversation_members` (`member_id`, `conversation_id`, `user_id`, `role`, `joined_at`)
VALUES
  -- Chat 1: Aria (user_1) & Nabil (user_2)
  ('cm_1_1', 'chat_1', 'user_1', 'member', NOW() - INTERVAL 1 DAY),
  ('cm_1_2', 'chat_1', 'user_2', 'admin', NOW() - INTERVAL 1 DAY),

  -- Chat 2: Aria (user_1) & Sadia (user_3)
  ('cm_2_1', 'chat_2', 'user_1', 'member', NOW() - INTERVAL 2 DAY),
  ('cm_2_2', 'chat_2', 'user_3', 'admin', NOW() - INTERVAL 2 DAY),

  -- Group Chat 1: Nabil (admin), Aria (member), Sadia (member)
  ('cm_g1_1', 'chat_group_1', 'user_2', 'admin', NOW() - INTERVAL 3 DAY),
  ('cm_g1_2', 'chat_group_1', 'user_1', 'member', NOW() - INTERVAL 3 DAY),
  ('cm_g1_3', 'chat_group_1', 'user_3', 'member', NOW() - INTERVAL 3 DAY)
ON DUPLICATE KEY UPDATE `role` = VALUES(`role`);

-- Insert Messages for Chat 1 (Aria & Nabil)
INSERT INTO `messages` (`message_id`, `conversation_id`, `sender_id`, `message_text`, `message_type`, `created_at`)
VALUES
  ('msg_1_1', 'chat_1', 'user_2', 'Hey Aria! Are you free for the St. Martin''s trip in November?', 'text', NOW() - INTERVAL 60 MINUTE),
  ('msg_1_2', 'chat_1', 'user_1', 'Yes Nabil! I just checked my calendar and joined the group. Super excited!', 'text', NOW() - INTERVAL 45 MINUTE),
  ('msg_1_3', 'chat_1', 'user_2', 'Great! Let''s update the checklist. I assigned barbecue prep to you.', 'text', NOW() - INTERVAL 30 MINUTE),
  ('msg_1_4', 'chat_1', 'user_1', 'On it! Will look up some good options.', 'text', NOW() - INTERVAL 15 MINUTE)
ON DUPLICATE KEY UPDATE `message_text` = VALUES(`message_text`);

-- Insert Messages for Chat 2 (Aria & Sadia)
INSERT INTO `messages` (`message_id`, `conversation_id`, `sender_id`, `message_text`, `message_type`, `created_at`)
VALUES
  ('msg_2_1', 'chat_2', 'user_3', 'Hi Aria, did you check the Sreemangal itinerary? Is Lawachara trek safe for kids?', 'text', NOW() - INTERVAL 2 HOUR),
  ('msg_2_2', 'chat_2', 'user_1', 'Yes, it is very safe. The main trail is fully paved. Just make sure to use mosquito repellent!', 'text', NOW() - INTERVAL 90 MINUTE)
ON DUPLICATE KEY UPDATE `message_text` = VALUES(`message_text`);

-- Insert Messages for Group Chat 1
INSERT INTO `messages` (`message_id`, `conversation_id`, `sender_id`, `message_text`, `message_type`, `created_at`)
VALUES
  ('msg_g1_1', 'chat_group_1', 'user_2', '🎉 Welcome everyone to the St. Martin''s Expedition group!', 'system', NOW() - INTERVAL 3 DAY),
  ('msg_g1_2', 'chat_group_1', 'user_2', 'Hey team! I booked the Keari Cruise ship tickets. We are set for Nov 15!', 'text', NOW() - INTERVAL 2 DAY),
  ('msg_g1_3', 'chat_group_1', 'user_1', 'Awesome! I will handle the food arrangements and the BBQ coordination.', 'text', NOW() - INTERVAL 1 DAY),
  ('msg_g1_4', 'chat_group_1', 'user_3', 'Should we rent cycles there or book a tour auto?', 'text', NOW() - INTERVAL 4 HOUR)
ON DUPLICATE KEY UPDATE `message_text` = VALUES(`message_text`);


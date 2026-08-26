-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 26, 2026 at 11:40 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lagatour_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `follows`
--

CREATE TABLE `follows` (
  `follow_id` varchar(255) NOT NULL,
  `follower_id` varchar(255) NOT NULL,
  `following_id` varchar(255) NOT NULL,
  `status` enum('pending','accepted','blocked') DEFAULT 'pending',
  `requested_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `places`
--

CREATE TABLE `places` (
  `place_id` varchar(255) NOT NULL,
  `place_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `division` varchar(100) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT NULL,
  `rating_count` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `post_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `caption` text DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `shares_count` int(11) DEFAULT 0,
  `saves_count` int(11) DEFAULT 0,
  `is_public` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_comments`
--

CREATE TABLE `post_comments` (
  `comment_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  `comment_text` text NOT NULL,
  `parent_comment_id` varchar(255) DEFAULT NULL,
  `commented_type` enum('post','tour_plan') NOT NULL,
  `is_edited` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_likes`
--

CREATE TABLE `post_likes` (
  `like_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `tour_plan_id` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  `liked_type` enum('post','tour_plan') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_media`
--

CREATE TABLE `post_media` (
  `media_id` varchar(255) NOT NULL,
  `post_id` varchar(255) NOT NULL,
  `media_url` varchar(500) NOT NULL,
  `media_type` enum('photo','video','text') DEFAULT NULL,
  `ai_verification_status` enum('pending','approved','rejected','flagged') DEFAULT 'pending',
  `ai_verified_at` datetime DEFAULT NULL,
  `verified_by_admin` varchar(255) DEFAULT NULL,
  `admin_review_notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `report_id` varchar(255) NOT NULL,
  `post_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `report_description` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_posts`
--

CREATE TABLE `saved_posts` (
  `saved_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `tour_plan_id` varchar(255) DEFAULT NULL,
  `saved_type` enum('post','tour_plan') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tour_plans`
--

CREATE TABLE `tour_plans` (
  `tour_plan_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `destination` varchar(255) NOT NULL,
  `starting_location` varchar(255) NOT NULL,
  `travel_start_date` date DEFAULT NULL,
  `travel_end_date` date DEFAULT NULL,
  `duration_days` int(11) DEFAULT NULL,
  `transportation` enum('Flight','Train','Bus','Car','Bike','Walk','Multiple') NOT NULL,
  `accommodation_type` enum('Hotel','Hostel','Airbnb','Home_Stay','Camping','Other') DEFAULT NULL,
  `accommodation_details` text DEFAULT NULL,
  `total_budget` decimal(12,2) DEFAULT NULL,
  `travel_tips` text DEFAULT NULL,
  `travel_type` enum('Solo','Friends','Family','Couple','Group') DEFAULT NULL,
  `season` enum('Spring','Summer','Fall','Winter') DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `views_count` int(11) DEFAULT 0,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `rating_avg` decimal(3,2) DEFAULT 0.00,
  `rating_count` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tour_plan_places_modified`
--

CREATE TABLE `tour_plan_places_modified` (
  `tour_plan_place_id` varchar(255) NOT NULL,
  `tour_plan_id` varchar(255) NOT NULL,
  `place_id` varchar(255) NOT NULL,
  `visit_date` date DEFAULT NULL,
  `location` varchar(250) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `transportation` enum('Flight','Train','Bus','Car','Bike','Walk','Multiple') NOT NULL,
  `accommodation_type` enum('Hotel','Hostel','Airbnb','Home_Stay','Camping','Other') DEFAULT NULL,
  `accommodation_details` text DEFAULT NULL,
  `Expense` double DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tour_ratings`
--

CREATE TABLE `tour_ratings` (
  `rating_id` varchar(255) NOT NULL,
  `tour_plan_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `overall_rating` decimal(2,1) NOT NULL,
  `review_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `preferred_travel_type` enum('Solo','Friends','Family','Couple','Group') DEFAULT NULL,
  `total_trips_shared` int(11) DEFAULT 0,
  `league_points` int(11) DEFAULT 0,
  `followers_count` int(11) DEFAULT 0,
  `following_count` int(11) DEFAULT 0,
  `is_verified` tinyint(1) DEFAULT 0,
  `account_status` enum('active','suspended','deleted') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `follows`
--
ALTER TABLE `follows`
  ADD PRIMARY KEY (`follow_id`),
  ADD UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  ADD KEY `fk_follow_following` (`following_id`);

--
-- Indexes for table `places`
--
ALTER TABLE `places`
  ADD PRIMARY KEY (`place_id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`post_id`),
  ADD KEY `fk_post_user` (`user_id`);

--
-- Indexes for table `post_comments`
--
ALTER TABLE `post_comments`
  ADD PRIMARY KEY (`comment_id`),
  ADD KEY `fk_comment_post` (`post_id`),
  ADD KEY `fk_comment_user` (`user_id`),
  ADD KEY `fk_comment_parent` (`parent_comment_id`);

--
-- Indexes for table `post_likes`
--
ALTER TABLE `post_likes`
  ADD PRIMARY KEY (`like_id`),
  ADD KEY `fk_like_post` (`post_id`),
  ADD KEY `fk_like_tour` (`tour_plan_id`),
  ADD KEY `fk_like_user` (`user_id`);

--
-- Indexes for table `post_media`
--
ALTER TABLE `post_media`
  ADD PRIMARY KEY (`media_id`),
  ADD KEY `fk_media_post` (`post_id`),
  ADD KEY `fk_media_admin` (`verified_by_admin`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `fk_report_post` (`post_id`),
  ADD KEY `fk_report_user` (`user_id`);

--
-- Indexes for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD PRIMARY KEY (`saved_id`),
  ADD KEY `fk_saved_user` (`user_id`),
  ADD KEY `fk_saved_post` (`post_id`),
  ADD KEY `fk_saved_tour` (`tour_plan_id`);

--
-- Indexes for table `tour_plans`
--
ALTER TABLE `tour_plans`
  ADD PRIMARY KEY (`tour_plan_id`),
  ADD KEY `fk_tour_plan_user` (`user_id`);

--
-- Indexes for table `tour_plan_places_modified`
--
ALTER TABLE `tour_plan_places_modified`
  ADD PRIMARY KEY (`tour_plan_place_id`),
  ADD KEY `fk_tpp_tour_plan` (`tour_plan_id`),
  ADD KEY `fk_tpp_place` (`place_id`);

--
-- Indexes for table `tour_ratings`
--
ALTER TABLE `tour_ratings`
  ADD PRIMARY KEY (`rating_id`),
  ADD UNIQUE KEY `unique_user_tour_rating` (`tour_plan_id`,`user_id`),
  ADD KEY `fk_rating_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `follows`
--
ALTER TABLE `follows`
  ADD CONSTRAINT `fk_follow_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_follow_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `post_comments`
--
ALTER TABLE `post_comments`
  ADD CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `post_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `post_likes`
--
ALTER TABLE `post_likes`
  ADD CONSTRAINT `fk_like_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_like_tour` FOREIGN KEY (`tour_plan_id`) REFERENCES `tour_plans` (`tour_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `post_media`
--
ALTER TABLE `post_media`
  ADD CONSTRAINT `fk_media_admin` FOREIGN KEY (`verified_by_admin`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_media_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_report_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `saved_posts`
--
ALTER TABLE `saved_posts`
  ADD CONSTRAINT `fk_saved_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_saved_tour` FOREIGN KEY (`tour_plan_id`) REFERENCES `tour_plans` (`tour_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_saved_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tour_plans`
--
ALTER TABLE `tour_plans`
  ADD CONSTRAINT `fk_tour_plan_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tour_plan_places_modified`
--
ALTER TABLE `tour_plan_places_modified`
  ADD CONSTRAINT `fk_tpp_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tpp_tour_plan` FOREIGN KEY (`tour_plan_id`) REFERENCES `tour_plans` (`tour_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tour_ratings`
--
ALTER TABLE `tour_ratings`
  ADD CONSTRAINT `fk_rating_tour` FOREIGN KEY (`tour_plan_id`) REFERENCES `tour_plans` (`tour_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_rating_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

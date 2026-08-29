-- phpMyAdmin SQL Dump
-- Database: `lagatour_db`
-- LagaTour Production Database Schema (Clean Initial State)

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
CREATE DATABASE IF NOT EXISTS `lagatour_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lagatour_db`;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `profile_picture_url` LONGTEXT DEFAULT NULL,
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
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Seed Data for table `users` (Admin Root Account)
-- Password is 'admin' (bcrypt hashed)
--

INSERT INTO `users` (`user_id`, `email`, `password_hash`, `username`, `first_name`, `last_name`, `profile_picture_url`, `bio`, `country`, `city`, `phone`, `preferred_travel_type`, `league_points`, `followers_count`, `following_count`, `account_status`) VALUES
('admin_root', 'admin@laga.tour', '$2a$10$9.0Uq7k9H7gUeR2m7W9LneZ6G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U', 'admin_root', 'System', 'Admin', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', 'LagaTour System Administrator', 'Bangladesh', 'Dhaka', '+8801500000000', 'Solo', 9999, 10000, 50, 'active')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- --------------------------------------------------------

--
-- Table structure for table `email_verifications`
--

CREATE TABLE IF NOT EXISTS `email_verifications` (
  `verification_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `purpose` enum('signup','forgot_password') NOT NULL DEFAULT 'signup',
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`verification_id`),
  KEY `idx_email_code` (`email`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `divisions`
--

CREATE TABLE IF NOT EXISTS `divisions` (
  `division_id` varchar(50) NOT NULL,
  `division_name` varchar(100) NOT NULL,
  PRIMARY KEY (`division_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Seed Data for table `divisions` (8 Bangladesh Divisions)
--

INSERT INTO `divisions` (`division_id`, `division_name`) VALUES
('div_barisal', 'Barishal'),
('div_chittagong', 'Chattogram'),
('div_dhaka', 'Dhaka'),
('div_khulna', 'Khulna'),
('div_mymensingh', 'Mymensingh'),
('div_rajshahi', 'Rajshahi'),
('div_rangpur', 'Rangpur'),
('div_sylhet', 'Sylhet')
ON DUPLICATE KEY UPDATE `division_name` = VALUES(`division_name`);

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE IF NOT EXISTS `districts` (
  `district_id` varchar(50) NOT NULL,
  `district_name` varchar(100) NOT NULL,
  `division_id` varchar(50) NOT NULL,
  PRIMARY KEY (`district_id`),
  KEY `fk_district_division` (`division_id`),
  CONSTRAINT `fk_district_division` FOREIGN KEY (`division_id`) REFERENCES `divisions` (`division_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Seed Data for table `districts` (64 Bangladesh Districts)
--

INSERT INTO `districts` (`district_id`, `district_name`, `division_id`) VALUES
('dis_bagerhat', 'Bagerhat', 'div_khulna'),
('dis_bandarban', 'Bandarban', 'div_chittagong'),
('dis_barguna', 'Barguna', 'div_barisal'),
('dis_barishal', 'Barishal', 'div_barisal'),
('dis_bhola', 'Bhola', 'div_barisal'),
('dis_bogura', 'Bogura', 'div_rajshahi'),
('dis_brahmanbaria', 'Brahmanbaria', 'div_chittagong'),
('dis_chandpur', 'Chandpur', 'div_chittagong'),
('dis_chapainawabganj', 'Chapainawabganj', 'div_rajshahi'),
('dis_chattogram', 'Chattogram', 'div_chittagong'),
('dis_chuadanga', 'Chuadanga', 'div_khulna'),
('dis_coxsbazar', 'Cox\'s Bazar', 'div_chittagong'),
('dis_cumilla', 'Cumilla', 'div_chittagong'),
('dis_dinajpur', 'Dinajpur', 'div_rangpur'),
('dis_faridpur', 'Faridpur', 'div_dhaka'),
('dis_feni', 'Feni', 'div_chittagong'),
('dis_gaibandha', 'Gaibandha', 'div_rangpur'),
('dis_gazipur', 'Gazipur', 'div_dhaka'),
('dis_gopalganj', 'Gopalganj', 'div_dhaka'),
('dis_habiganj', 'Habiganj', 'div_sylhet'),
('dis_jamalpur', 'Jamalpur', 'div_mymensingh'),
('dis_jashore', 'Jashore', 'div_khulna'),
('dis_jhalokati', 'Jhalokati', 'div_barisal'),
('dis_jhenaidah', 'Jhenaidah', 'div_khulna'),
('dis_joypurhat', 'Joypurhat', 'div_rajshahi'),
('dis_khagrachari', 'Khagrachari', 'div_chittagong'),
('dis_khulna', 'Khulna', 'div_khulna'),
('dis_kishoreganj', 'Kishoreganj', 'div_dhaka'),
('dis_kurigram', 'Kurigram', 'div_rangpur'),
('dis_kushtia', 'Kushtia', 'div_khulna'),
('dis_lakshmipur', 'Lakshmipur', 'div_chittagong'),
('dis_lalmonirhat', 'Lalmonirhat', 'div_rangpur'),
('dis_madaripur', 'Madaripur', 'div_dhaka'),
('dis_magura', 'Magura', 'div_khulna'),
('dis_manikganj', 'Manikganj', 'div_dhaka'),
('dis_meherpur', 'Meherpur', 'div_khulna'),
('dis_moulvibazar', 'Moulvibazar', 'div_sylhet'),
('dis_munshiganj', 'Munshiganj', 'div_dhaka'),
('dis_mymensingh', 'Mymensingh', 'div_mymensingh'),
('dis_naogaon', 'Naogaon', 'div_rajshahi'),
('dis_narail', 'Narail', 'div_khulna'),
('dis_narayanganj', 'Narayanganj', 'div_dhaka'),
('dis_narsingdi', 'Narsingdi', 'div_dhaka'),
('dis_natore', 'Natore', 'div_rajshahi'),
('dis_netrokona', 'Netrokona', 'div_mymensingh'),
('dis_nilphamari', 'Nilphamari', 'div_rangpur'),
('dis_noakhali', 'Noakhali', 'div_chittagong'),
('dis_pabna', 'Pabna', 'div_rajshahi'),
('dis_panchagarh', 'Panchagarh', 'div_rangpur'),
('dis_patuakhali', 'Patuakhali', 'div_barisal'),
('dis_pirojpur', 'Pirojpur', 'div_barisal'),
('dis_rajbari', 'Rajbari', 'div_dhaka'),
('dis_rajshahi', 'Rajshahi', 'div_rajshahi'),
('dis_rangamati', 'Rangamati', 'div_chittagong'),
('dis_rangpur', 'Rangpur', 'div_rangpur'),
('dis_satkhira', 'Satkhira', 'div_khulna'),
('dis_shariatpur', 'Shariatpur', 'div_dhaka'),
('dis_sherpur', 'Sherpur', 'div_mymensingh'),
('dis_sirajganj', 'Sirajganj', 'div_rajshahi'),
('dis_sunamganj', 'Sunamganj', 'div_sylhet'),
('dis_sylhet', 'Sylhet', 'div_sylhet'),
('dis_tangail', 'Tangail', 'div_dhaka'),
('dis_thakurgaon', 'Thakurgaon', 'div_rangpur')
ON DUPLICATE KEY UPDATE `district_name` = VALUES(`district_name`), `division_id` = VALUES(`division_id`);

-- --------------------------------------------------------

--
-- Table structure for table `places`
--

CREATE TABLE IF NOT EXISTS `places` (
  `place_id` varchar(255) NOT NULL,
  `place_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `division_id` varchar(50) DEFAULT NULL,
  `district_id` varchar(50) DEFAULT NULL,
  `division` varchar(100) DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `safety_rating` decimal(3,2) DEFAULT 5.00,
  `safety_rating_count` int(11) DEFAULT 0,
  `is_public` tinyint(1) DEFAULT 0,
  `created_by` varchar(255) DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `shares_count` int(11) DEFAULT 0,
  `saves_count` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`place_id`),
  KEY `fk_place_user` (`created_by`),
  CONSTRAINT `fk_place_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `place_images`
--

CREATE TABLE IF NOT EXISTS `place_images` (
  `img_id` varchar(255) NOT NULL,
  `place_id` varchar(255) NOT NULL,
  `image_url` LONGTEXT NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`img_id`),
  KEY `fk_img_place` (`place_id`),
  CONSTRAINT `fk_img_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `myplaces`
--

CREATE TABLE IF NOT EXISTS `myplaces` (
  `my_place_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `place_id` varchar(255) NOT NULL,
  `is_owner` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`my_place_id`),
  UNIQUE KEY `unique_user_place` (`user_id`,`place_id`),
  KEY `fk_myplace_user` (`user_id`),
  KEY `fk_myplace_place` (`place_id`),
  CONSTRAINT `fk_myplace_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_myplace_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `place_ratings`
--

CREATE TABLE IF NOT EXISTS `place_ratings` (
  `rating_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `place_id` varchar(255) NOT NULL,
  `place_rating` decimal(3,2) NOT NULL DEFAULT 5.00,
  `review_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `unique_user_place_rating` (`user_id`,`place_id`),
  KEY `fk_rating_user_idx` (`user_id`),
  KEY `fk_rating_place_idx` (`place_id`),
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pr_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE IF NOT EXISTS `posts` (
  `post_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `caption` text DEFAULT NULL,
  `likes_count` int(11) DEFAULT 0,
  `comments_count` int(11) DEFAULT 0,
  `shares_count` int(11) DEFAULT 0,
  `saves_count` int(11) DEFAULT 0,
  `is_public` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`post_id`),
  KEY `fk_post_user` (`user_id`),
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_media`
--

CREATE TABLE IF NOT EXISTS `post_media` (
  `media_id` varchar(255) NOT NULL,
  `post_id` varchar(255) NOT NULL,
  `media_url` LONGTEXT NOT NULL,
  `media_type` enum('photo','video','text') DEFAULT 'photo',
  `ai_verification_status` enum('pending','approved','rejected','flagged') DEFAULT 'approved',
  `ai_verified_at` datetime DEFAULT NULL,
  `verified_by_admin` varchar(255) DEFAULT NULL,
  `admin_review_notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`media_id`),
  KEY `fk_media_post` (`post_id`),
  KEY `fk_media_admin` (`verified_by_admin`),
  CONSTRAINT `fk_media_admin` FOREIGN KEY (`verified_by_admin`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_media_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_comments`
--

CREATE TABLE IF NOT EXISTS `post_comments` (
  `comment_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `place_id` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  `comment_text` text NOT NULL,
  `parent_comment_id` varchar(255) DEFAULT NULL,
  `commented_type` varchar(50) NOT NULL DEFAULT 'post',
  `is_edited` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`comment_id`),
  KEY `fk_comment_post` (`post_id`),
  KEY `fk_comment_user` (`user_id`),
  KEY `fk_comment_parent` (`parent_comment_id`),
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `post_comments` (`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_likes`
--

CREATE TABLE IF NOT EXISTS `post_likes` (
  `like_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `tour_plan_id` varchar(255) DEFAULT NULL,
  `place_id` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  `liked_type` varchar(50) NOT NULL DEFAULT 'post',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`like_id`),
  KEY `fk_like_post` (`post_id`),
  KEY `fk_like_user` (`user_id`),
  CONSTRAINT `fk_like_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_posts`
--

CREATE TABLE IF NOT EXISTS `saved_posts` (
  `saved_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `tour_plan_id` varchar(255) DEFAULT NULL,
  `place_id` varchar(255) DEFAULT NULL,
  `saved_type` varchar(50) NOT NULL DEFAULT 'post',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`saved_id`),
  KEY `fk_saved_user` (`user_id`),
  KEY `fk_saved_post` (`post_id`),
  CONSTRAINT `fk_saved_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_saved_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` varchar(255) NOT NULL,
  `post_id` varchar(255) DEFAULT NULL,
  `place_id` varchar(255) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  `report_type` varchar(50) NOT NULL DEFAULT 'post',
  `report_description` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`report_id`),
  KEY `fk_report_user` (`user_id`),
  CONSTRAINT `fk_report_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tour_plans`
--

CREATE TABLE IF NOT EXISTS `tour_plans` (
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
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`tour_plan_id`),
  KEY `fk_tour_plan_user` (`user_id`),
  CONSTRAINT `fk_tour_plan_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tour_plan_places_modified`
--

CREATE TABLE IF NOT EXISTS `tour_plan_places_modified` (
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
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`tour_plan_place_id`),
  KEY `fk_tpp_tour_plan` (`tour_plan_id`),
  KEY `fk_tpp_place` (`place_id`),
  CONSTRAINT `fk_tpp_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`place_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tpp_tour_plan` FOREIGN KEY (`tour_plan_id`) REFERENCES `tour_plans` (`tour_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tour_ratings`
--

CREATE TABLE IF NOT EXISTS `tour_ratings` (
  `rating_id` varchar(255) NOT NULL,
  `tour_plan_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `overall_rating` decimal(2,1) NOT NULL,
  `review_text` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`rating_id`),
  UNIQUE KEY `unique_user_tour_rating` (`tour_plan_id`,`user_id`),
  KEY `fk_rating_user` (`user_id`),
  CONSTRAINT `fk_rating_tour` FOREIGN KEY (`tour_plan_id`) REFERENCES `tour_plans` (`tour_plan_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rating_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `follows`
--

CREATE TABLE IF NOT EXISTS `follows` (
  `follow_id` varchar(255) NOT NULL,
  `follower_id` varchar(255) NOT NULL,
  `following_id` varchar(255) NOT NULL,
  `status` enum('pending','accepted','blocked') DEFAULT 'pending',
  `requested_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`follow_id`),
  UNIQUE KEY `unique_follow` (`follower_id`,`following_id`),
  KEY `fk_follow_following` (`following_id`),
  CONSTRAINT `fk_follow_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_follow_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

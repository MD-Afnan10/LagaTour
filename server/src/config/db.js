import mysql from "mysql2/promise";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lagatour_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool = null;

export async function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function query(sql, params = []) {
  const p = await getPool();
  const [results] = await p.query(sql, params);
  return results;
}


/**
 * Initializes the MySQL database and creates tables from lagatour_db.sql schema if missing.
 * Also seeds initial users and posts so the feed is populated immediately.
 */
export async function initDatabase() {
  try {
    // 1. Establish initial connection to MySQL server without database specified
    const initialConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    await initialConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await initialConn.end();

    const p = await getPool();

    // 2. Create Users table (with password_hash)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`user_id\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`password_hash\` varchar(255) DEFAULT NULL,
        \`username\` varchar(100) NOT NULL,
        \`first_name\` varchar(100) DEFAULT NULL,
        \`last_name\` varchar(100) DEFAULT NULL,
        \`profile_picture_url\` LONGTEXT DEFAULT NULL,
        \`bio\` text DEFAULT NULL,
        \`country\` varchar(100) DEFAULT NULL,
        \`city\` varchar(100) DEFAULT NULL,
        \`phone\` varchar(20) DEFAULT NULL,
        \`preferred_travel_type\` enum('Solo','Friends','Family','Couple','Group') DEFAULT NULL,
        \`total_trips_shared\` int(11) DEFAULT 0,
        \`league_points\` int(11) DEFAULT 0,
        \`followers_count\` int(11) DEFAULT 0,
        \`following_count\` int(11) DEFAULT 0,
        \`is_verified\` tinyint(1) DEFAULT 0,
        \`account_status\` enum('active','suspended','deleted') DEFAULT 'active',
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        \`last_login\` datetime DEFAULT NULL,
        PRIMARY KEY (\`user_id\`),
        UNIQUE KEY \`email\` (\`email\`),
        UNIQUE KEY \`username\` (\`username\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure profile_picture_url and media_url support large base64 images
    try {
      await p.query("ALTER TABLE `users` MODIFY `profile_picture_url` LONGTEXT NULL;");
      await p.query("ALTER TABLE `post_media` MODIFY `media_url` LONGTEXT NULL;");
    } catch (colErr) {
      // Ignored if already longtext
    }

    // Ensure password_hash column exists if table existed previously without it
    const [pwdCol] = await p.query("SHOW COLUMNS FROM users LIKE 'password_hash'");
    if (pwdCol.length === 0) {
      await p.query("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER email");
    }

    // 3. Create Email Verifications table for OTP codes
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`email_verifications\` (
        \`verification_id\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`code\` varchar(10) NOT NULL,
        \`purpose\` enum('signup','forgot_password') NOT NULL DEFAULT 'signup',
        \`expires_at\` datetime NOT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`verification_id\`),
        KEY \`idx_email_code\` (\`email\`, \`code\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Create Posts table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`posts\` (
        \`post_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`caption\` text DEFAULT NULL,
        \`likes_count\` int(11) DEFAULT 0,
        \`comments_count\` int(11) DEFAULT 0,
        \`shares_count\` int(11) DEFAULT 0,
        \`saves_count\` int(11) DEFAULT 0,
        \`is_public\` tinyint(1) DEFAULT 1,
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`post_id\`),
        KEY \`fk_post_user\` (\`user_id\`),
        CONSTRAINT \`fk_post_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Create Post Media table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`post_media\` (
        \`media_id\` varchar(255) NOT NULL,
        \`post_id\` varchar(255) NOT NULL,
        \`media_url\` LONGTEXT NOT NULL,
        \`media_type\` enum('photo','video','text') DEFAULT 'photo',
        \`ai_verification_status\` enum('pending','approved','rejected','flagged') DEFAULT 'approved',
        \`ai_verified_at\` datetime DEFAULT NULL,
        \`verified_by_admin\` varchar(255) DEFAULT NULL,
        \`admin_review_notes\` text DEFAULT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`media_id\`),
        KEY \`fk_media_post\` (\`post_id\`),
        CONSTRAINT \`fk_media_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`post_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Create Post Comments table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`post_comments\` (
        \`comment_id\` varchar(255) NOT NULL,
        \`post_id\` varchar(255) DEFAULT NULL,
        \`place_id\` varchar(255) DEFAULT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`comment_text\` text NOT NULL,
        \`parent_comment_id\` varchar(255) DEFAULT NULL,
        \`commented_type\` varchar(50) NOT NULL DEFAULT 'post',
        \`is_edited\` tinyint(1) DEFAULT 0,
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`comment_id\`),
        KEY \`fk_comment_post\` (\`post_id\`),
        KEY \`fk_comment_user\` (\`user_id\`),
        CONSTRAINT \`fk_comment_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`post_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_comment_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Create Post Likes table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`post_likes\` (
        \`like_id\` varchar(255) NOT NULL,
        \`post_id\` varchar(255) DEFAULT NULL,
        \`tour_plan_id\` varchar(255) DEFAULT NULL,
        \`place_id\` varchar(255) DEFAULT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`liked_type\` varchar(50) NOT NULL DEFAULT 'post',
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`like_id\`),
        KEY \`fk_like_post\` (\`post_id\`),
        KEY \`fk_like_user\` (\`user_id\`),
        CONSTRAINT \`fk_like_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`post_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_like_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Create Saved Posts table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`saved_posts\` (
        \`saved_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`post_id\` varchar(255) DEFAULT NULL,
        \`tour_plan_id\` varchar(255) DEFAULT NULL,
        \`place_id\` varchar(255) DEFAULT NULL,
        \`saved_type\` varchar(50) NOT NULL DEFAULT 'post',
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`saved_id\`),
        KEY \`fk_saved_user\` (\`user_id\`),
        KEY \`fk_saved_post\` (\`post_id\`),
        CONSTRAINT \`fk_saved_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`post_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_saved_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Create Reports table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`reports\` (
        \`report_id\` varchar(255) NOT NULL,
        \`post_id\` varchar(255) DEFAULT NULL,
        \`place_id\` varchar(255) DEFAULT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`report_type\` varchar(50) NOT NULL DEFAULT 'post',
        \`report_description\` text NOT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`report_id\`),
        KEY \`fk_report_user\` (\`user_id\`),
        CONSTRAINT \`fk_report_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Table structure for conversations (Direct & Group Chats)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`conversations\` (
        \`conversation_id\` VARCHAR(255) NOT NULL,
        \`type\` ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
        \`title\` VARCHAR(255) DEFAULT NULL COMMENT 'Group chat name, NULL for 1-on-1 direct chat',
        \`avatar_url\` LONGTEXT DEFAULT NULL COMMENT 'Custom group avatar or photo',
        \`created_by\` VARCHAR(255) DEFAULT NULL COMMENT 'Creator user_id for group chats',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`conversation_id\`),
        KEY \`fk_conv_creator\` (\`created_by\`),
        CONSTRAINT \`fk_conv_creator\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Table structure for conversation_members (Participants & Unread Tracking)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`conversation_members\` (
        \`member_id\` VARCHAR(255) NOT NULL,
        \`conversation_id\` VARCHAR(255) NOT NULL,
        \`user_id\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('admin', 'member') NOT NULL DEFAULT 'member',
        \`joined_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`last_read_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`member_id\`),
        UNIQUE KEY \`unique_conversation_user\` (\`conversation_id\`, \`user_id\`),
        KEY \`fk_member_conv\` (\`conversation_id\`),
        KEY \`fk_member_user\` (\`user_id\`),
        CONSTRAINT \`fk_member_conv\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\` (\`conversation_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_member_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Table structure for messages (Message Stream & Media)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`messages\` (
        \`message_id\` VARCHAR(255) NOT NULL,
        \`conversation_id\` VARCHAR(255) NOT NULL,
        \`sender_id\` VARCHAR(255) NOT NULL,
        \`message_text\` TEXT NOT NULL,
        \`media_url\` LONGTEXT DEFAULT NULL,
        \`message_type\` ENUM('text', 'image', 'video', 'system') NOT NULL DEFAULT 'text',
        \`is_read\` TINYINT(1) DEFAULT 0,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`message_id\`),
        KEY \`fk_msg_conv\` (\`conversation_id\`),
        KEY \`fk_msg_sender\` (\`sender_id\`),
        KEY \`idx_conv_created\` (\`conversation_id\`, \`created_at\`),
        CONSTRAINT \`fk_msg_conv\` FOREIGN KEY (\`conversation_id\`) REFERENCES \`conversations\` (\`conversation_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_msg_sender\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. Create Divisions table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`divisions\` (
        \`division_id\` varchar(50) NOT NULL,
        \`division_name\` varchar(100) NOT NULL,
        PRIMARY KEY (\`division_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 14. Create Districts table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`districts\` (
        \`district_id\` varchar(50) NOT NULL,
        \`district_name\` varchar(100) NOT NULL,
        \`division_id\` varchar(50) NOT NULL,
        PRIMARY KEY (\`district_id\`),
        KEY \`fk_district_division\` (\`division_id\`),
        CONSTRAINT \`fk_district_division\` FOREIGN KEY (\`division_id\`) REFERENCES \`divisions\` (\`division_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 15. Create Places table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`places\` (
        \`place_id\` varchar(255) NOT NULL,
        \`place_name\` varchar(255) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`division_id\` varchar(50) DEFAULT NULL,
        \`district_id\` varchar(50) DEFAULT NULL,
        \`division\` varchar(100) DEFAULT NULL,
        \`district\` varchar(100) DEFAULT NULL,
        \`latitude\` decimal(10,8) NOT NULL,
        \`longitude\` decimal(11,8) NOT NULL,
        \`address\` varchar(500) DEFAULT NULL,
        \`safety_rating\` decimal(3,2) DEFAULT 5.00,
        \`safety_rating_count\` int(11) DEFAULT 0,
        \`is_public\` tinyint(1) DEFAULT 0,
        \`created_by\` varchar(255) DEFAULT NULL,
        \`likes_count\` int(11) DEFAULT 0,
        \`comments_count\` int(11) DEFAULT 0,
        \`shares_count\` int(11) DEFAULT 0,
        \`saves_count\` int(11) DEFAULT 0,
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`place_id\`),
        KEY \`fk_place_user\` (\`created_by\`),
        CONSTRAINT \`fk_place_user\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure missing columns exist in places table if created previously
    try {
      const [placeCols] = await p.query("SHOW COLUMNS FROM places");
      const colNames = placeCols.map(c => c.Field);
      if (!colNames.includes("division_id")) await p.query("ALTER TABLE places ADD COLUMN division_id varchar(50) NULL");
      if (!colNames.includes("district_id")) await p.query("ALTER TABLE places ADD COLUMN district_id varchar(50) NULL");
      if (!colNames.includes("safety_rating")) await p.query("ALTER TABLE places ADD COLUMN safety_rating decimal(3,2) DEFAULT 5.00");
      if (!colNames.includes("safety_rating_count")) await p.query("ALTER TABLE places ADD COLUMN safety_rating_count int(11) DEFAULT 0");
      if (!colNames.includes("is_public")) await p.query("ALTER TABLE places ADD COLUMN is_public tinyint(1) DEFAULT 0");
      if (!colNames.includes("created_by")) await p.query("ALTER TABLE places ADD COLUMN created_by varchar(255) DEFAULT NULL");
      if (!colNames.includes("likes_count")) await p.query("ALTER TABLE places ADD COLUMN likes_count int(11) DEFAULT 0");
      if (!colNames.includes("comments_count")) await p.query("ALTER TABLE places ADD COLUMN comments_count int(11) DEFAULT 0");
      if (!colNames.includes("shares_count")) await p.query("ALTER TABLE places ADD COLUMN shares_count int(11) DEFAULT 0");
      if (!colNames.includes("saves_count")) await p.query("ALTER TABLE places ADD COLUMN saves_count int(11) DEFAULT 0");
    } catch (alterErr) {
      console.warn("Places table check warning:", alterErr.message);
    }

    // Ensure place_id column in post_likes, post_comments, saved_posts, reports
    try {
      await p.query("ALTER TABLE `post_likes` MODIFY `liked_type` varchar(50) NOT NULL DEFAULT 'post';");
      await p.query("ALTER TABLE `post_comments` MODIFY `commented_type` varchar(50) NOT NULL DEFAULT 'post';");
      await p.query("ALTER TABLE `saved_posts` MODIFY `saved_type` varchar(50) NOT NULL DEFAULT 'post';");
      
      const [likeCols] = await p.query("SHOW COLUMNS FROM post_likes LIKE 'place_id'");
      if (likeCols.length === 0) await p.query("ALTER TABLE post_likes ADD COLUMN place_id varchar(255) NULL");

      const [commCols] = await p.query("SHOW COLUMNS FROM post_comments LIKE 'place_id'");
      if (commCols.length === 0) await p.query("ALTER TABLE post_comments ADD COLUMN place_id varchar(255) NULL");

      const [saveCols] = await p.query("SHOW COLUMNS FROM saved_posts LIKE 'place_id'");
      if (saveCols.length === 0) await p.query("ALTER TABLE saved_posts ADD COLUMN place_id varchar(255) NULL");

      const [repCols] = await p.query("SHOW COLUMNS FROM reports LIKE 'place_id'");
      if (repCols.length === 0) await p.query("ALTER TABLE reports ADD COLUMN place_id varchar(255) NULL");
      
      const [repTypeCols] = await p.query("SHOW COLUMNS FROM reports LIKE 'report_type'");
      if (repTypeCols.length === 0) await p.query("ALTER TABLE reports ADD COLUMN report_type varchar(50) DEFAULT 'post'");
    } catch (e) {
      // safe fallback
    }

    // 16. Create Place Images table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`place_images\` (
        \`img_id\` varchar(255) NOT NULL,
        \`place_id\` varchar(255) NOT NULL,
        \`image_url\` LONGTEXT NOT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`img_id\`),
        KEY \`fk_img_place\` (\`place_id\`),
        CONSTRAINT \`fk_img_place\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 17. Create MyPlaces table (User's personal recorded places collection)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`myplaces\` (
        \`my_place_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`place_id\` varchar(255) NOT NULL,
        \`is_owner\` tinyint(1) DEFAULT 1,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`my_place_id\`),
        UNIQUE KEY \`unique_user_place\` (\`user_id\`, \`place_id\`),
        KEY \`fk_myplace_user\` (\`user_id\`),
        KEY \`fk_myplace_place\` (\`place_id\`),
        CONSTRAINT \`fk_myplace_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_myplace_place\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 18. Create Place Ratings table (Community Safety Ratings)
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`place_ratings\` (
        \`rating_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`place_id\` varchar(255) NOT NULL,
        \`place_rating\` decimal(3,2) NOT NULL DEFAULT 5.00,
        \`review_text\` text DEFAULT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`rating_id\`),
        UNIQUE KEY \`unique_user_place_rating\` (\`user_id\`, \`place_id\`),
        KEY \`fk_rating_user_idx\` (\`user_id\`),
        KEY \`fk_rating_place_idx\` (\`place_id\`),
        CONSTRAINT \`fk_pr_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_pr_place\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 19. Create Tour Plans table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`tour_plans\` (
        \`tour_plan_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`destination\` varchar(255) NOT NULL,
        \`starting_location\` varchar(255) NOT NULL,
        \`travel_start_date\` date DEFAULT NULL,
        \`travel_end_date\` date DEFAULT NULL,
        \`duration_days\` int(11) DEFAULT NULL,
        \`transportation\` enum('Flight','Train','Bus','Car','Bike','Walk','Multiple') NOT NULL DEFAULT 'Bus',
        \`accommodation_type\` enum('Hotel','Hostel','Airbnb','Home_Stay','Camping','Other') DEFAULT 'Hotel',
        \`accommodation_details\` text DEFAULT NULL,
        \`total_budget\` decimal(12,2) DEFAULT NULL,
        \`travel_tips\` text DEFAULT NULL,
        \`travel_type\` enum('Solo','Friends','Family','Couple','Group') DEFAULT 'Friends',
        \`season\` enum('Spring','Summer','Fall','Winter') DEFAULT 'Winter',
        \`is_public\` tinyint(1) DEFAULT 1,
        \`views_count\` int(11) DEFAULT 0,
        \`likes_count\` int(11) DEFAULT 0,
        \`comments_count\` int(11) DEFAULT 0,
        \`rating_avg\` decimal(3,2) DEFAULT 0.00,
        \`rating_count\` int(11) DEFAULT 0,
        \`saves_count\` int(11) DEFAULT 0,
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`tour_plan_id\`),
        KEY \`fk_tour_plan_user\` (\`user_id\`),
        CONSTRAINT \`fk_tour_plan_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure missing columns exist in tour_plans table if created previously
    try {
      const [tpCols] = await p.query("SHOW COLUMNS FROM tour_plans");
      const colNames = tpCols.map(c => c.Field);
      if (!colNames.includes("saves_count")) await p.query("ALTER TABLE tour_plans ADD COLUMN saves_count int(11) DEFAULT 0");
      if (!colNames.includes("views_count")) await p.query("ALTER TABLE tour_plans ADD COLUMN views_count int(11) DEFAULT 0");
      if (!colNames.includes("likes_count")) await p.query("ALTER TABLE tour_plans ADD COLUMN likes_count int(11) DEFAULT 0");
      if (!colNames.includes("comments_count")) await p.query("ALTER TABLE tour_plans ADD COLUMN comments_count int(11) DEFAULT 0");
      if (!colNames.includes("rating_avg")) await p.query("ALTER TABLE tour_plans ADD COLUMN rating_avg decimal(3,2) DEFAULT 0.00");
      if (!colNames.includes("rating_count")) await p.query("ALTER TABLE tour_plans ADD COLUMN rating_count int(11) DEFAULT 0");
    } catch (tpAlterErr) {
      // safe fallback
    }


    // 20. Create Tour Plan Places Modified table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`tour_plan_places_modified\` (
        \`tour_plan_place_id\` varchar(255) NOT NULL,
        \`tour_plan_id\` varchar(255) NOT NULL,
        \`place_id\` varchar(255) NOT NULL,
        \`visit_date\` date DEFAULT NULL,
        \`location\` varchar(250) DEFAULT NULL,
        \`notes\` text DEFAULT NULL,
        \`transportation\` enum('Flight','Train','Bus','Car','Bike','Walk','Multiple') NOT NULL DEFAULT 'Bus',
        \`accommodation_type\` enum('Hotel','Hostel','Airbnb','Home_Stay','Camping','Other') DEFAULT 'Hotel',
        \`accommodation_details\` text DEFAULT NULL,
        \`Expense\` double DEFAULT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`tour_plan_place_id\`),
        KEY \`fk_tpp_tour_plan\` (\`tour_plan_id\`),
        KEY \`fk_tpp_place\` (\`place_id\`),
        CONSTRAINT \`fk_tpp_place\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_tpp_tour_plan\` FOREIGN KEY (\`tour_plan_id\`) REFERENCES \`tour_plans\` (\`tour_plan_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 21. Create Tour Ratings table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`tour_ratings\` (
        \`rating_id\` varchar(255) NOT NULL,
        \`tour_plan_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`overall_rating\` decimal(2,1) NOT NULL,
        \`review_text\` text DEFAULT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`rating_id\`),
        UNIQUE KEY \`unique_user_tour_rating\` (\`tour_plan_id\`,\`user_id\`),
        KEY \`fk_rating_user\` (\`user_id\`),
        CONSTRAINT \`fk_rating_tour\` FOREIGN KEY (\`tour_plan_id\`) REFERENCES \`tour_plans\` (\`tour_plan_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_rating_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 22. Create Follows table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`follows\` (
        \`follow_id\` varchar(255) NOT NULL,
        \`follower_id\` varchar(255) NOT NULL,
        \`following_id\` varchar(255) NOT NULL,
        \`status\` enum('pending','accepted','blocked') DEFAULT 'pending',
        \`requested_at\` datetime DEFAULT current_timestamp(),
        \`accepted_at\` datetime DEFAULT NULL,
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`follow_id\`),
        UNIQUE KEY \`unique_follow\` (\`follower_id\`,\`following_id\`),
        KEY \`fk_follow_following\` (\`following_id\`),
        CONSTRAINT \`fk_follow_follower\` FOREIGN KEY (\`follower_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_follow_following\` FOREIGN KEY (\`following_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 23. Create Expedition Groups table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`expedition_groups\` (
        \`group_id\` varchar(255) NOT NULL,
        \`organizer_id\` varchar(255) NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`destination\` varchar(255) NOT NULL,
        \`travel_date\` date DEFAULT NULL,
        \`estimated_budget\` decimal(12,2) DEFAULT NULL,
        \`max_members\` int(11) DEFAULT 10,
        \`transportation\` varchar(100) DEFAULT 'Bus',
        \`accommodation_plan\` text DEFAULT NULL,
        \`itinerary\` text DEFAULT NULL,
        \`status\` enum('planning','open','full','completed','cancelled') DEFAULT 'open',
        \`created_at\` datetime DEFAULT current_timestamp(),
        \`updated_at\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`group_id\`),
        KEY \`fk_exp_group_organizer\` (\`organizer_id\`),
        CONSTRAINT \`fk_exp_group_organizer\` FOREIGN KEY (\`organizer_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 24. Seed default users & places & chats if empty
    await seedInitialData(p);


    console.log("✅ MySQL Database & Tables initialized successfully (lagatour_db)");
  } catch (error) {
    console.error("⚠️ Database initialization error:", error.message);
    throw error;
  }
}

async function seedInitialData(p) {
  const adminPasswordHash = await bcrypt.hash("admin", 10);

  try {
    // Guarantee admin user exists in MySQL database
    await p.query(`
      INSERT INTO users (user_id, email, password_hash, username, first_name, last_name, profile_picture_url, bio, country, city, phone, preferred_travel_type, league_points, followers_count, following_count)
      VALUES ('admin_root', 'admin@laga.tour', ?, 'admin_root', 'System', 'Admin', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', 'LagaTour System Administrator', 'Bangladesh', 'Dhaka', '+8801500000000', 'Solo', 9999, 10000, 50)
      ON DUPLICATE KEY UPDATE 
        password_hash = COALESCE(users.password_hash, VALUES(password_hash))
    `, [adminPasswordHash]);
  } catch (cleanErr) {
    // Non-fatal if tables are already empty
  }


  // 1. Seed Bangladesh Geographic Divisions (Reference Data)
  const divisionsData = [
    ["div_dhaka", "Dhaka"],
    ["div_chittagong", "Chattogram"],
    ["div_rajshahi", "Rajshahi"],
    ["div_khulna", "Khulna"],
    ["div_barisal", "Barishal"],
    ["div_sylhet", "Sylhet"],
    ["div_rangpur", "Rangpur"],
    ["div_mymensingh", "Mymensingh"]
  ];

  for (const [id, name] of divisionsData) {
    await p.query(
      "INSERT INTO divisions (division_id, division_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE division_name = VALUES(division_name)",
      [id, name]
    );
  }

  // 2. Seed 64 Bangladesh Districts (Reference Data)
  const districtsData = [
    // Dhaka
    ["dis_dhaka", "Dhaka", "div_dhaka"],
    ["dis_gazipur", "Gazipur", "div_dhaka"],
    ["dis_narayanganj", "Narayanganj", "div_dhaka"],
    ["dis_tangail", "Tangail", "div_dhaka"],
    ["dis_kishoreganj", "Kishoreganj", "div_dhaka"],
    ["dis_manikganj", "Manikganj", "div_dhaka"],
    ["dis_munshiganj", "Munshiganj", "div_dhaka"],
    ["dis_narsingdi", "Narsingdi", "div_dhaka"],
    ["dis_faridpur", "Faridpur", "div_dhaka"],
    ["dis_gopalganj", "Gopalganj", "div_dhaka"],
    ["dis_madaripur", "Madaripur", "div_dhaka"],
    ["dis_rajbari", "Rajbari", "div_dhaka"],
    ["dis_shariatpur", "Shariatpur", "div_dhaka"],
    // Chattogram
    ["dis_chattogram", "Chattogram", "div_chittagong"],
    ["dis_coxsbazar", "Cox's Bazar", "div_chittagong"],
    ["dis_rangamati", "Rangamati", "div_chittagong"],
    ["dis_bandarban", "Bandarban", "div_chittagong"],
    ["dis_khagrachari", "Khagrachari", "div_chittagong"],
    ["dis_cumilla", "Cumilla", "div_chittagong"],
    ["dis_feni", "Feni", "div_chittagong"],
    ["dis_brahmanbaria", "Brahmanbaria", "div_chittagong"],
    ["dis_noakhali", "Noakhali", "div_chittagong"],
    ["dis_chandpur", "Chandpur", "div_chittagong"],
    ["dis_lakshmipur", "Lakshmipur", "div_chittagong"],
    // Rajshahi
    ["dis_rajshahi", "Rajshahi", "div_rajshahi"],
    ["dis_bogura", "Bogura", "div_rajshahi"],
    ["dis_joypurhat", "Joypurhat", "div_rajshahi"],
    ["dis_naogaon", "Naogaon", "div_rajshahi"],
    ["dis_natore", "Natore", "div_rajshahi"],
    ["dis_chapainawabganj", "Chapainawabganj", "div_rajshahi"],
    ["dis_pabna", "Pabna", "div_rajshahi"],
    ["dis_sirajganj", "Sirajganj", "div_rajshahi"],
    // Khulna
    ["dis_khulna", "Khulna", "div_khulna"],
    ["dis_jashore", "Jashore", "div_khulna"],
    ["dis_satkhira", "Satkhira", "div_khulna"],
    ["dis_bagerhat", "Bagerhat", "div_khulna"],
    ["dis_kushtia", "Kushtia", "div_khulna"],
    ["dis_chuadanga", "Chuadanga", "div_khulna"],
    ["dis_meherpur", "Meherpur", "div_khulna"],
    ["dis_jhenaidah", "Jhenaidah", "div_khulna"],
    ["dis_magura", "Magura", "div_khulna"],
    ["dis_narail", "Narail", "div_khulna"],
    // Barishal
    ["dis_barishal", "Barishal", "div_barisal"],
    ["dis_patuakhali", "Patuakhali", "div_barisal"],
    ["dis_bhola", "Bhola", "div_barisal"],
    ["dis_pirojpur", "Pirojpur", "div_barisal"],
    ["dis_barguna", "Barguna", "div_barisal"],
    ["dis_jhalokati", "Jhalokati", "div_barisal"],
    // Sylhet
    ["dis_sylhet", "Sylhet", "div_sylhet"],
    ["dis_moulvibazar", "Moulvibazar", "div_sylhet"],
    ["dis_habiganj", "Habiganj", "div_sylhet"],
    ["dis_sunamganj", "Sunamganj", "div_sylhet"],
    // Rangpur
    ["dis_rangpur", "Rangpur", "div_rangpur"],
    ["dis_dinajpur", "Dinajpur", "div_rangpur"],
    ["dis_gaibandha", "Gaibandha", "div_rangpur"],
    ["dis_kurigram", "Kurigram", "div_rangpur"],
    ["dis_lalmonirhat", "Lalmonirhat", "div_rangpur"],
    ["dis_nilphamari", "Nilphamari", "div_rangpur"],
    ["dis_panchagarh", "Panchagarh", "div_rangpur"],
    ["dis_thakurgaon", "Thakurgaon", "div_rangpur"],
    // Mymensingh
    ["dis_mymensingh", "Mymensingh", "div_mymensingh"],
    ["dis_jamalpur", "Jamalpur", "div_mymensingh"],
    ["dis_netrokona", "Netrokona", "div_mymensingh"],
    ["dis_sherpur", "Sherpur", "div_mymensingh"]
  ];

  for (const [id, name, divId] of districtsData) {
    await p.query(
      "INSERT INTO districts (district_id, district_name, division_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE district_name = VALUES(district_name), division_id = VALUES(division_id)",
      [id, name, divId]
    );
  }

  // 3. Seed Community Travelers if user count is low
  const [userCount] = await p.query("SELECT COUNT(*) as count FROM users WHERE user_id != 'admin_root'");
  if (userCount[0].count < 3) {
    console.log("🌱 Seeding top ranking community travelers into lagatour_db...");
    const samplePasswordHash = await bcrypt.hash("traveler123", 10);
    
    await p.query(`
      INSERT INTO users (user_id, email, password_hash, username, first_name, last_name, profile_picture_url, bio, country, city, preferred_travel_type, total_trips_shared, league_points, followers_count, following_count, is_verified, account_status)
      VALUES
        ('user_tariq', 'tariqul@laga.tour', ?, 'tariq_adventures', 'Tariqul', 'Islam', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Bandarban & Sajek mountaineering leader. Exploring the high peaks of Bangladesh.', 'Bangladesh', 'Bandarban', 'Group', 38, 4850, 12400, 180, 1, 'active'),
        ('user_nusrat', 'nusrat@laga.tour', ?, 'nusrat_trails', 'Nusrat', 'Jahan', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', 'Sylhet rainforest explorer, tea garden backpacker, and wildlife photographer.', 'Bangladesh', 'Sylhet', 'Friends', 26, 3420, 8900, 240, 1, 'active'),
        ('user_siam', 'siam@laga.tour', ?, 'siam_nomad', 'Siam', 'Ahmed', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'Coastal tracker, scuba diver, and St. Martin Island local guide.', 'Bangladesh', 'Cox\\'s Bazar', 'Solo', 19, 2890, 7200, 310, 1, 'active'),
        ('user_tanvir', 'tanvir@laga.tour', ?, 'tanvir_heritage', 'Tanvir', 'Hossain', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Heritage and historical architecture specialist across Bagerhat & Rajshahi.', 'Bangladesh', 'Rajshahi', 'Family', 15, 1750, 4300, 150, 1, 'active'),
        ('user_farhana', 'farhana@laga.tour', ?, 'farhana_wander', 'Farhana', 'Yasmin', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', 'Mangrove researcher, houseboat traveler, and eco-tourism advocate.', 'Bangladesh', 'Khulna', 'Couple', 10, 890, 2100, 195, 0, 'active'),
        ('user_nabil', 'nabil@laga.tour', ?, 'nabil_roams', 'Nabil', 'Khan', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400', 'Weekend camper, cycle trekker, and campfire storyteller.', 'Bangladesh', 'Dhaka', 'Friends', 7, 650, 1450, 120, 0, 'active')
      ON DUPLICATE KEY UPDATE league_points = VALUES(league_points), followers_count = VALUES(followers_count);
    `, [samplePasswordHash, samplePasswordHash, samplePasswordHash, samplePasswordHash, samplePasswordHash, samplePasswordHash]);
  }

  // 4. Seed Verified Places & Destinations
  const [placesCount] = await p.query("SELECT COUNT(*) as count FROM places");
  if (placesCount[0].count === 0) {
    console.log("🌱 Seeding top ranked places into lagatour_db...");
    await p.query(`
      INSERT INTO places (place_id, place_name, description, division_id, district_id, division, district, latitude, longitude, address, safety_rating, safety_rating_count, is_public, created_by, likes_count, comments_count, saves_count)
      VALUES
        ('place_sajek', 'Sajek Valley (Valley of Clouds)', 'Nestled among the hills of Kasalong range in Rangamati. Famous for fluffy white clouds floating right into your resort balcony.', 'div_chittagong', 'dis_rangamati', 'Chattogram', 'Rangamati', 23.3820, 92.2938, 'Sajek Union, Baghaichhari, Rangamati', 4.95, 84, 1, 'user_tariq', 340, 45, 185),
        ('place_stmartin', 'Saint Martin\\'s Island & Chera Dwip', 'Bangladesh\\'s sole coral island surrounded by crystal-clear azure waters, coconut groves, and vibrant marine life.', 'div_chittagong', 'dis_coxsbazar', 'Chattogram', 'Cox\\'s Bazar', 20.6274, 92.3225, 'Bay of Bengal, Teknaf, Cox\\'s Bazar', 4.88, 120, 1, 'user_siam', 420, 62, 230),
        ('place_tanguar', 'Tanguar Haor Ramsar Wetland', 'Spectacular freshwater wetland ecosystem beneath the Meghalaya hills, best explored on traditional wooden houseboats.', 'div_sylhet', 'dis_sunamganj', 'Sylhet', 'Sunamganj', 25.1235, 91.0762, 'Tahirpur, Sunamganj', 4.82, 65, 1, 'user_nusrat', 280, 38, 140),
        ('place_lawachara', 'Lawachara Rainforest Sanctuary', 'Lush semi-evergreen forest famous for hoolock gibbons, canopy trees, and scenic railway tracks slicing through green hills.', 'div_sylhet', 'dis_moulvibazar', 'Sylhet', 'Moulvibazar', 24.3267, 91.7850, 'Kamalganj, Moulvibazar', 4.75, 48, 1, 'user_nusrat', 195, 22, 95),
        ('place_keokradong', 'Keokradong Peak & Boga Lake', 'One of the highest reachable mountain peaks in Bangladesh, sitting atop the mystic volcano-like Boga Lake.', 'div_chittagong', 'dis_bandarban', 'Chattogram', 'Bandarban', 21.9500, 92.5167, 'Ruma, Bandarban', 4.70, 52, 1, 'user_tariq', 260, 34, 115),
        ('place_sundarbans', 'Sundarbans Mangrove Tiger Reserve', 'The world\\'s largest contiguous mangrove forest and UNESCO World Heritage site, home to the Royal Bengal Tiger.', 'div_khulna', 'dis_bagerhat', 'Khulna', 'Bagerhat', 21.9497, 89.1833, 'Mongla, Bagerhat', 4.85, 92, 1, 'user_farhana', 310, 41, 160)
      ON DUPLICATE KEY UPDATE place_name = VALUES(place_name);
    `);

    await p.query(`
      INSERT INTO place_images (img_id, place_id, image_url)
      VALUES
        ('img_sajek', 'place_sajek', 'https://images.unsplash.com/photo-1627894483216-2138af692e32?w=800'),
        ('img_stmartin', 'place_stmartin', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'),
        ('img_tanguar', 'place_tanguar', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'),
        ('img_lawachara', 'place_lawachara', 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800'),
        ('img_keokradong', 'place_keokradong', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800'),
        ('img_sundarbans', 'place_sundarbans', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800')
      ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);
    `);
  }

  // 5. Seed Top Tour Plans
  const [plansCount] = await p.query("SELECT COUNT(*) as count FROM tour_plans");
  if (plansCount[0].count === 0) {
    console.log("🌱 Seeding top ranked tour plans into lagatour_db...");
    await p.query(`
      INSERT INTO tour_plans (tour_plan_id, user_id, title, description, destination, starting_location, duration_days, transportation, accommodation_type, total_budget, travel_tips, travel_type, season, is_public, views_count, likes_count, comments_count, rating_avg, rating_count, saves_count)
      VALUES
        ('plan_sajek_3d', 'user_tariq', '3-Day Sajek Valley & Konglak Peak Cloud Walk', 'Complete itinerary covering Dighinala, Sajek Valley, Ruilui Para, and sunrise at Konglak Peak. Includes 4x4 Chander Gari transport breakdown.', 'Sajek Valley', 'Dhaka', 3, 'Car', 'Hotel', 6500.00, 'Book morning army convoy escort from Dighinala by 10 AM. Carry national ID copies.', 'Friends', 'Winter', 1, 1420, 215, 34, 4.95, 48, 142),
        ('plan_stmartin_3d', 'user_siam', '3-Day St. Martin\\'s Island & Chera Dwip Coral Escape', 'Unwind in the blue waters of Bangladesh\\'s only coral paradise. Includes ship booking tips, cycle rentals, and night BBQ near West Beach.', 'St. Martin\\'s Island', 'Chattogram', 3, 'Multiple', 'Home_Stay', 8500.00, 'Board Keari Sindbad from Teknaf jetty. Chera Dwip speed boat ride is best during low tide.', 'Group', 'Winter', 1, 1850, 310, 48, 4.90, 62, 185),
        ('plan_tanguar_2d', 'user_nusrat', '2-Day Tanguar Haor Luxury Houseboat & Niladri Lake', 'Cruise through the serene waters of Sunamganj haor, visit Shimul Bagan, Niladri blue lake quarry, and Jadukata river.', 'Tanguar Haor', 'Sylhet', 2, 'Bus', 'Home_Stay', 5500.00, 'Pre-book licensed houseboats in Tahirpur. Best experienced from July to October for high water.', 'Friends', 'Summer', 1, 980, 165, 26, 4.85, 35, 110),
        ('plan_sreemangal_2d', 'user_nusrat', '2-Day Sreemangal Tea Trails & Hum Hum Trek', 'Explore the scenic rolling tea gardens of Sreemangal, Baikka Beel bird sanctuary, Lawachara forest, and 7-layer Nilkantha tea.', 'Sreemangal', 'Dhaka', 2, 'Train', 'Hostel', 4200.00, 'Take the Parabat Express train from Dhaka Kamalapur station. Hire a CNG auto for local spots.', 'Solo', 'Spring', 1, 1200, 180, 19, 4.80, 42, 95),
        ('plan_sundarbans_4d', 'user_farhana', '4-Day Sundarbans Deep Mangrove Cruiser Expedition', 'Sail into the untamed wilderness from Mongla port to Kotka, Hiron Point, and Kochikhali canal safaris.', 'Sundarbans', 'Khulna', 4, 'Multiple', 'Home_Stay', 14500.00, 'Carry binoculars for wildlife spotting. Follow Forest Department armed guard instructions at all times.', 'Couple', 'Winter', 1, 850, 125, 18, 4.75, 28, 80)
      ON DUPLICATE KEY UPDATE title = VALUES(title);
    `);
  }

  // Seed sample conversations & messages if empty

  const [convCount] = await p.query("SELECT COUNT(*) as count FROM conversations");
  if (convCount[0].count === 0) {
    console.log("🌱 Seeding initial conversations & messages into lagatour_db...");

    await p.query(`
      INSERT INTO \`conversations\` (\`conversation_id\`, \`type\`, \`title\`, \`avatar_url\`, \`created_by\`, \`created_at\`)
      VALUES
        ('chat_1', 'direct', NULL, NULL, 'user_2', NOW() - INTERVAL 1 DAY),
        ('chat_2', 'direct', NULL, NULL, 'user_3', NOW() - INTERVAL 2 DAY),
        ('chat_group_1', 'group', 'St. Martin\\'s Weekend Expedition 🌊', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200', 'user_2', NOW() - INTERVAL 3 DAY)
      ON DUPLICATE KEY UPDATE \`type\` = VALUES(\`type\`);
    `);

    await p.query(`
      INSERT INTO \`conversation_members\` (\`member_id\`, \`conversation_id\`, \`user_id\`, \`role\`, \`joined_at\`)
      VALUES
        ('cm_1_1', 'chat_1', 'user_1', 'member', NOW() - INTERVAL 1 DAY),
        ('cm_1_2', 'chat_1', 'user_2', 'admin', NOW() - INTERVAL 1 DAY),
        ('cm_2_1', 'chat_2', 'user_1', 'member', NOW() - INTERVAL 2 DAY),
        ('cm_2_2', 'chat_2', 'user_3', 'admin', NOW() - INTERVAL 2 DAY),
        ('cm_g1_1', 'chat_group_1', 'user_2', 'admin', NOW() - INTERVAL 3 DAY),
        ('cm_g1_2', 'chat_group_1', 'user_1', 'member', NOW() - INTERVAL 3 DAY),
        ('cm_g1_3', 'chat_group_1', 'user_3', 'member', NOW() - INTERVAL 3 DAY)
      ON DUPLICATE KEY UPDATE \`role\` = VALUES(\`role\`);
    `);

    await p.query(`
      INSERT INTO \`messages\` (\`message_id\`, \`conversation_id\`, \`sender_id\`, \`message_text\`, \`message_type\`, \`created_at\`)
      VALUES
        ('msg_1_1', 'chat_1', 'user_2', 'Hey Aria! Are you free for the St. Martin\\'s trip in November?', 'text', NOW() - INTERVAL 60 MINUTE),
        ('msg_1_2', 'chat_1', 'user_1', 'Yes Nabil! I just checked my calendar and joined the group. Super excited!', 'text', NOW() - INTERVAL 45 MINUTE),
        ('msg_1_3', 'chat_1', 'user_2', 'Great! Let\\'s update the checklist. I assigned barbecue prep to you.', 'text', NOW() - INTERVAL 30 MINUTE),
        ('msg_1_4', 'chat_1', 'user_1', 'On it! Will look up some good options.', 'text', NOW() - INTERVAL 15 MINUTE),
        ('msg_2_1', 'chat_2', 'user_3', 'Hi Aria, did you check the Sreemangal itinerary? Is Lawachara trek safe for kids?', 'text', NOW() - INTERVAL 2 HOUR),
        ('msg_2_2', 'chat_2', 'user_1', 'Yes, it is very safe. The main trail is fully paved. Just make sure to use mosquito repellent!', 'text', NOW() - INTERVAL 90 MINUTE),
        ('msg_g1_1', 'chat_group_1', 'user_2', '🎉 Welcome everyone to the St. Martin\\'s Expedition group!', 'system', NOW() - INTERVAL 3 DAY),
        ('msg_g1_2', 'chat_group_1', 'user_2', 'Hey team! I booked the Keari Cruise ship tickets. We are set for Nov 15!', 'text', NOW() - INTERVAL 2 DAY),
        ('msg_g1_3', 'chat_group_1', 'user_1', 'Awesome! I will handle the food arrangements and the BBQ coordination.', 'text', NOW() - INTERVAL 1 DAY),
        ('msg_g1_4', 'chat_group_1', 'user_3', 'Should we rent cycles there or book a tour auto?', 'text', NOW() - INTERVAL 4 HOUR)
      ON DUPLICATE KEY UPDATE \`message_text\` = VALUES(\`message_text\`);
    `);
  }

}

export default {
  getPool,
  query,
  initDatabase
};

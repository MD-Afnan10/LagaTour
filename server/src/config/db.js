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
  const [results] = await p.execute(sql, params);
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
        \`user_id\` varchar(255) NOT NULL,
        \`comment_text\` text NOT NULL,
        \`parent_comment_id\` varchar(255) DEFAULT NULL,
        \`commented_type\` enum('post','tour_plan') NOT NULL DEFAULT 'post',
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
        \`user_id\` varchar(255) NOT NULL,
        \`liked_type\` enum('post','tour_plan') NOT NULL DEFAULT 'post',
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
        \`saved_type\` enum('post','tour_plan') NOT NULL DEFAULT 'post',
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
        \`post_id\` varchar(255) NOT NULL,
        \`user_id\` varchar(255) NOT NULL,
        \`report_description\` text NOT NULL,
        \`created_at\` datetime DEFAULT current_timestamp(),
        PRIMARY KEY (\`report_id\`),
        KEY \`fk_report_post\` (\`post_id\`),
        KEY \`fk_report_user\` (\`user_id\`),
        CONSTRAINT \`fk_report_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`post_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_report_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Seed default users & posts if empty
    await seedInitialData(p);

    console.log("✅ MySQL Database & Tables initialized successfully (lagatour_db)");
  } catch (error) {
    console.error("⚠️ Database initialization error:", error.message);
    throw error;
  }
}

async function seedInitialData(p) {
  const defaultPasswordHash = await bcrypt.hash("password", 10);
  const adminPasswordHash = await bcrypt.hash("admin", 10);

  // Check if users exist or update password_hash on seed users
  const [usersCount] = await p.query("SELECT COUNT(*) as count FROM users");
  if (usersCount[0].count === 0) {
    console.log("🌱 Seeding initial users into lagatour_db with hashed passwords...");
    const sampleUsers = [
      ["user_1", "aria@laga.tour", defaultPasswordHash, "aria_travels", "Aria", "Jahan", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", "Adventure seeker. Mapping the world one coffee at a time ☕🏕️", "Bangladesh", "Dhaka", "+8801700000001", "Solo", 2450, 1240, 480],
      ["user_2", "nabil@laga.tour", defaultPasswordHash, "nabil_wanderer", "Nabil", "Ahmed", "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150", "Full-time explorer, photographer, and budget backpacker. 📸🏔️", "Bangladesh", "Chittagong", "+8801800000002", "Friends", 4800, 5300, 340],
      ["user_3", "sadia@laga.tour", defaultPasswordHash, "sadia_expeditions", "Sadia", "Rahman", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", "Nature lover & weekend trekker. 🎒🌲", "Bangladesh", "Sylhet", "+8801900000003", "Group", 850, 320, 190],
      ["user_4", "rashed@laga.tour", defaultPasswordHash, "rashed_backpacks", "Rashed", "Karim", "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150", "Novice traveler. Dreaming of St. Martin's 🌊⛵", "Bangladesh", "Dhaka", "+8801600000004", "Family", 120, 45, 110],
      ["admin_root", "admin@laga.tour", adminPasswordHash, "admin_root", "System", "Admin", "https://api.dicebear.com/7.x/adventurer/svg?seed=admin", "LagaTour System Administrator", "Bangladesh", "Dhaka", "+8801500000000", "Solo", 9999, 10000, 50]
    ];

    for (const u of sampleUsers) {
      await p.query(`
        INSERT INTO users (user_id, email, password_hash, username, first_name, last_name, profile_picture_url, bio, country, city, phone, preferred_travel_type, league_points, followers_count, following_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          password_hash=VALUES(password_hash),
          username=VALUES(username)
      `, u);
    }
  } else {
    // Ensure existing seed users have password hashes populated if they were created before password_hash was added
    await p.query(`UPDATE users SET password_hash = ? WHERE password_hash IS NULL AND user_id != 'admin_root'`, [defaultPasswordHash]);
    await p.query(`UPDATE users SET password_hash = ? WHERE user_id = 'admin_root' AND (password_hash IS NULL OR password_hash = '')`, [adminPasswordHash]);
  }

  // Check if posts exist
  const [postsCount] = await p.query("SELECT COUNT(*) as count FROM posts");
  if (postsCount[0].count === 0) {
    console.log("🌱 Seeding initial posts and media into lagatour_db...");
    
    // Post 1
    await p.query(`
      INSERT INTO posts (post_id, user_id, caption, likes_count, comments_count, shares_count, saves_count, is_public)
      VALUES ('post_1', 'user_1', 'Sunset at Cox\\'s Bazar marine drive is magic. 🌅 Blue waves crashing against green hills, a dream route for any traveler! #oceanvibes #coxsbazar #traveldiary', 215, 2, 14, 29, 1)
    `);
    await p.query(`
      INSERT INTO post_media (media_id, post_id, media_url, media_type, ai_verification_status)
      VALUES 
        ('media_1_1', 'post_1', 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800', 'photo', 'approved'),
        ('media_1_2', 'post_1', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'photo', 'approved')
    `);
    await p.query(`
      INSERT INTO post_comments (comment_id, post_id, user_id, comment_text)
      VALUES 
        ('c_1', 'post_1', 'user_2', 'Stunning shot! The lighting is perfect.'),
        ('c_2', 'post_1', 'user_3', 'Can\\'t wait to visit next week!')
    `);

    // Post 2
    await p.query(`
      INSERT INTO posts (post_id, user_id, caption, likes_count, comments_count, shares_count, saves_count, is_public)
      VALUES ('post_2', 'user_2', 'Woke up above the clouds today in Sajek Valley. ☁️🏕️ The morning breeze and lush green mountain peaks are absolutely worth the bumpy Chander Gari ride!', 487, 2, 38, 110, 1)
    `);
    await p.query(`
      INSERT INTO post_media (media_id, post_id, media_url, media_type, ai_verification_status)
      VALUES 
        ('media_2_1', 'post_2', 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?w=800', 'photo', 'approved'),
        ('media_2_2', 'post_2', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 'video', 'approved')
    `);
    await p.query(`
      INSERT INTO post_comments (comment_id, post_id, user_id, comment_text)
      VALUES 
        ('c_3', 'post_2', 'user_1', 'Take me back there! 🥺'),
        ('c_4', 'post_2', 'user_4', 'Which cottage has this view?')
    `);

    // Sample initial report for admin moderation
    await p.query(`
      INSERT INTO reports (report_id, post_id, user_id, report_description)
      VALUES ('rep_1', 'post_2', 'user_3', 'Contains potentially dangerous cliff trekking tips without safety warnings.')
    `);
  }
}

export default {
  getPool,
  query,
  initDatabase
};

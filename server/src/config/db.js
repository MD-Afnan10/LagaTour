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

    // 10. Create Divisions table
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`divisions\` (
        \`division_id\` varchar(50) NOT NULL,
        \`division_name\` varchar(100) NOT NULL,
        PRIMARY KEY (\`division_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Create Districts table
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

    // 12. Create Places table
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

    // 13. Create Place Images table
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

    // 14. Create MyPlaces table (User's personal recorded places collection)
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

    // 15. Create Place Ratings table (Community Safety Ratings)
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

    // 16. Seed default users & places if empty
    await seedInitialData(p);

    console.log("✅ MySQL Database & Tables initialized successfully (lagatour_db)");
  } catch (error) {
    console.error("⚠️ Database initialization error:", error.message);
    throw error;
  }
}

async function seedInitialData(p) {
  const adminPasswordHash = await bcrypt.hash("admin", 10);

  // Guarantee admin user exists in MySQL database
  await p.query(`
    INSERT INTO users (user_id, email, password_hash, username, first_name, last_name, profile_picture_url, bio, country, city, phone, preferred_travel_type, league_points, followers_count, following_count)
    VALUES ('admin_root', 'admin@laga.tour', ?, 'admin_root', 'System', 'Admin', 'https://api.dicebear.com/7.x/adventurer/svg?seed=admin', 'LagaTour System Administrator', 'Bangladesh', 'Dhaka', '+8801500000000', 'Solo', 9999, 10000, 50)
    ON DUPLICATE KEY UPDATE 
      password_hash = COALESCE(users.password_hash, VALUES(password_hash))
  `, [adminPasswordHash]);

  // Clean up any previously seeded dummy users, posts, and places if they exist
  try {
    await p.query("DELETE FROM users WHERE user_id IN ('user_1', 'user_2', 'user_3', 'user_4')");
    await p.query("DELETE FROM posts WHERE post_id IN ('post_1', 'post_2')");
    await p.query("DELETE FROM places WHERE place_id IN ('place_cxb_beach', 'place_sajek_valley', 'place_sreemangal_tea', 'place_st_martin', 'place_ratargul_swamp')");
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
}

export default {
  getPool,
  query,
  initDatabase
};

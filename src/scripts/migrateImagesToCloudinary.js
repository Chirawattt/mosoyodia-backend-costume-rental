require("dotenv").config();
const cloudinary = require("../config/cloudinary");
const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");

// ตั้งค่า Sequelize
const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  }
);

// ฟังก์ชันสำหรับอัพโหลดรูปภาพไปยัง Cloudinary
async function uploadToCloudinary(imagePath) {
  try {
    // อ่านไฟล์รูปภาพ
    const filePath = path.join(__dirname, "../../public", imagePath);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      return null;
    }

    // อัพโหลดไปยัง Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "costumes",
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error(`Error uploading ${imagePath}:`, error);
    return null;
  }
}

// ฟังก์ชันหลักสำหรับย้ายรูปภาพ
async function migrateImages() {
  try {
    // เชื่อมต่อกับฐานข้อมูล
    await sequelize.authenticate();
    console.log("Connected to database");

    // ดึงข้อมูลชุดทั้งหมดที่มีรูปภาพ
    const costumes = await sequelize.query(
      `SELECT id, image_path FROM costumes WHERE image_path IS NOT NULL`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log(`Found ${costumes.length} costumes with images`);

    // ย้ายรูปภาพทีละชุด
    for (const costume of costumes) {
      console.log(`Processing costume ${costume.id}: ${costume.image_path}`);

      // อัพโหลดรูปภาพไปยัง Cloudinary
      const cloudinaryData = await uploadToCloudinary(costume.image_path);

      if (cloudinaryData) {
        // อัปเดตข้อมูลในฐานข้อมูล
        await sequelize.query(
          `UPDATE costumes SET image_path = ?, image_public_id = ? WHERE id = ?`,
          {
            replacements: [
              cloudinaryData.url,
              cloudinaryData.public_id,
              costume.id,
            ],
          }
        );

        console.log(`Successfully migrated image for costume ${costume.id}`);
      }
    }

    console.log("Migration completed");
  } catch (error) {
    console.error("Error during migration:", error);
  } finally {
    // ปิดการเชื่อมต่อกับฐานข้อมูล
    await sequelize.close();
  }
}

// รันฟังก์ชันหลัก
migrateImages();

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // เพิ่มคอลัมน์ใหม่สำหรับ Cloudinary โดยไม่ลบ image_path เดิม
    await queryInterface.addColumn("costumes", "image_public_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ลบคอลัมน์ image_public_id
    await queryInterface.removeColumn("costumes", "image_public_id");
  },
};

"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // เพิ่มคอลัมน์ image_public_id สำหรับเก็บ public_id ของ Cloudinary
    await queryInterface.addColumn("review_images", "image_public_id", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // ลบคอลัมน์ image_public_id
    await queryInterface.removeColumn("review_images", "image_public_id");
  },
};

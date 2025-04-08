"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // เปลี่ยนชื่อคอลัมน์จาก image_url เป็น image_path
    await queryInterface.renameColumn("costumes", "image_url", "image_path");
  },

  down: async (queryInterface, Sequelize) => {
    // เปลี่ยนชื่อคอลัมน์กลับจาก image_path เป็น image_url
    await queryInterface.renameColumn("costumes", "image_path", "image_url");
  },
};

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Costume = require("./Costume");

const ReviewImage = sequelize.define("review_images", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  costume_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  image_path: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

Costume.hasMany(ReviewImage, {
  foreignKey: "costume_id",
  onDelete: "CASCADE",
});

ReviewImage.belongsTo(Costume, {
  foreignKey: "costume_id",
});

module.exports = ReviewImage;

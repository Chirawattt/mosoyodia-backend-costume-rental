const { DataTypes, Sequelize } = require("sequelize");
const sequelize = require("../config/database");

const Costume = sequelize.define(
  "costumes",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    age_group: {
      type: DataTypes.ENUM("adult", "child", "both"),
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1, // 1 = available, 0 = not available
    },
    isRentable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    category: {
      type: DataTypes.TINYINT, // 0 = Kimono, 1 = Yukata, 2 = Cosplay
      allowNull: false,
    },
    image_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal(
        "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
      ),
    },
  },
  {
    tableName: "costumes",
    freezeTableName: true,
    timestamps: true,
  }
);

module.exports = Costume;

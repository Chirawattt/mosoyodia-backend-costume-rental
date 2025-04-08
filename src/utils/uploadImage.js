const cloudinary = require("../config/cloudinary");
const path = require("path");

const uploadImage = async (file, folder = "costumes") => {
  try {
    // อัพโหลดไฟล์ไปยัง Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: "auto",
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};

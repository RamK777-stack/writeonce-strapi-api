require("dotenv").config();
let cloudinary = require("cloudinary").v2;
cloudinary.config({
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
  cloud_name: process.env.cloud_name,
});

module.exports = {
  upload: () => {
    cloudinary.uploader.upload();
  },

  uploadFromURL: async (file) => {
    try {
      const result = await cloudinary.uploader.upload(file, {
        upload_preset: "ml_default",
      });
      const response = {
        format: result?.format,
        resource_type: result?.resource_type,
        secure_url: result?.secure_url,
        original_filename: result?.original_filename,
      }
      return response;
    } catch (e) {
      return e;
    }
  },

  getObject: () => {},
};

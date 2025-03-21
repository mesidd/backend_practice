import {v2 as cloudinary} from "cloudinary";

import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary = async (localFilePath) => {
  try{
    if(!localFilePath) return null
    const response = cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    console.log("Successful file uploaded in cloudinary",(await response).url);
    return response

  } catch (error) {
    fs.unlinkSync(localFilePath) // remove the locally saved temporary
    return null;
  }
}

export {uploadOnCloudinary}

// cloudinary.v2.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//   { public_id: "shoes"},
//   function(error, result)
//   { console.log(result);});
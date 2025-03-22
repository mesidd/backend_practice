import { asyncHandler } from "../utils/asyncHandler.js"; 
import{ApiError} from "../utils/ApiError.js" ;
import {User} from "../models/user.model.js" ;
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave : false })
    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, " Something went wrong?")
  }
}

const registerUser = asyncHandler( async (req, res)=> 
{

  const {fullName, email, username, password} = req.body

  if (
    [fullName, email, username, password ].some((field) => field?.trim() === "")
  ) 
  {
    throw new ApiError(400,"All fields are mandatory")
  }

  const existedUser = await User.findOne({
   $or:[ {username} , {email}]
  })

  if(existedUser){
    throw new ApiError(409, "User with email or username already exists.")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  
  let coverImageLocalPath ;
  if ( req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath ){
    throw new ApiError(400, "Avatar file is required")
  }

const avatar = await uploadOnCloudinary(avatarLocalPath);

const coverImage = await uploadOnCloudinary(coverImageLocalPath);

if(!avatar){
  throw new ApiError(400, "Avatar file is required")
}

const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

if(!createdUser){
  throw new ApiError(500,"Something went wrong while registering the user")
}

return res.status(201).json(
  new ApiResponse(200, createdUser, "User registered Successfully")
)

})

const loginUser = asyncHandler(async (req, res )=> {
  // req boyd -> data
  // username or email 
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const {email,username,password} = req.body

  if( !username && !email){
    throw new ApiError(400, "username or email is required")
  }

const user = await User.findOne({
  $or : [ {username}, {email}]
})

if (!user){
  throw new ApiError(400, "user doesn't exist")
}

const isPasswordValid = await user.isPasswordCorrect(password)

if(!isPasswordValid) {
  throw new ApiError(401, "Wrong login credentials")
}

const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options = {
  httpOnly : true,
  secure : true
}

return res
.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
  new ApiResponse(
    200,
    {
      user: loggedInUser, accessToken,
      refreshToken
    },
    "User Loggen In Successfully"
  )
)

})

const logoutUser = asyncHandler(async(req, res) => {
 await User.findByIdAndUpdate(
  req.user._id,
{
  $set: {
    refreshToken: undefined
  }
},
{
  new : true
}
  ) 

  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refrehToken

  {
    if(!incomingRefreshToken){
      throw new ApiError(401, "Unauthorized request")
    }
  }


 try {
  const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
   )
 
   const user = await User.findById(decodedToken?._id)
 
   if(!user){
     throw new ApiError(401, "Invalid request Token")
   }
  
 
 if( incomingRefreshToken !== user?.refrehToken){
   throw new ApiError(401, "Refresh token expired")
 }
 
 const options = {
   httpOnly: true,
   secure : true
 }
 
 
 const {accessToken, newRefrehToken} = await generateAccessAndRefreshTokens(user._id)
 
 return res
 .status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refreshToken", newRefrehToken , options)
 .json(
   new ApiResponse(
     200,
     {accessToken, refrehToken: newRefrehToken},
     "ACcess Token Successfull"
   )
 )
 } catch (error) {
  throw new ApiError(401, error?.message || "Invalid refresh toien")
 }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword } = req.body  

  // const {oldPassword, newPassword, confPassword} = req.body
  // if (!(newPassword === confPassword)){
  //   throw new ApiError()
  // }

  const user = await User.findById(req.user?.id)
  const isPassword = await user.isPasswordCorrect(oldPassword)

  if(!isPassword){
    throw new ApiError(400, "Invalid Old Password")
  }
  user.password = newPassword
  user.saave({validateBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password Changed Successfully"))
})

const getCurrentUser = asyncHandler( async(req,res)=> {
  return res.
  status(200)
  .json(200, req.user, "Current User Fetched Successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=> {
  const { fullName, email } = req.body

  if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account Details Updated Successfully"))

})

const updateUserAvatar = asyncHandler(async(req, res) => 
  {
    const avatarLocalPath = req.file?.path  // single file

    if (!avatarLocalPath) {
      throw new ApiError(400,"Avatar file missinng!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
      throw new ApiError(400,"Error while uploading on avatar!")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar : avatar.url,
        }
      },
      {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Avatar Image updated successfully")
    )
})

const updateCoverImage = asyncHandler(async(req, res) => 
  {
    const coverImageLocalPath = req.file?.path  // single file

    if (!coverImageLocalPath) {
      throw new ApiError(400,"Cover Image file missinng!")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
      throw new ApiError(400,"Error while uploading cover Image!")
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage : coverImage.url,
        }
      },
      {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover Image updated successfully")
    )
})

const gerUserChannelProfile = asyncHandler(async(req, res)=> {
  if(!username?.trim()) {
    throw new ApiError(400, "Username is missing")
  }
const channel = await User.aggregate([
  {
    $match: {
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as : "subscribers"
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as : "subscribedTo"
    }
  },
  {
    $addFields : {
      subscribersCount : {
        $size:"$subscribers"
      },
      channelsSubscribedToCount: {
        $size: "$subscribedTo"
      },
      isSubscribed: {
        $cond : {
          if : {$in: [req.user?._id, "$subscribers.subscriber"]},
          then: true,
          else: false
        }
      }
    }
  },
  {
    $project : {
      fullName: 1,
      username: 1,
      subscribersCount: 1,
      channelsSubscribedToCount: 1,
      isSubscribed: 1,
      avatar: 1,
      coverImage: 1,
      email: 1
    }
  }
])

console.log(channel);

if(!channel?.length){
  throw new ApiError(404, "channel does not exists")
}

return res
.status(200)
.json(
    new ApiResponse(200, channel[0], "User Channel Fetched Successfully")
)
})

const getWatchHistory = asyncHandler( async(req,res)=> {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    }, 
    {
      $lookup : {
        from: "videos",
        localField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }

        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch History Fetched succesfully"
    )
  )
})

export 
{
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
  gerUserChannelProfile,
  getWatchHistory,
}

// Algorithms :
// get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user creation
// return res
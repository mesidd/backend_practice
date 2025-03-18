import mongoose from 'mongoose'

new userSchema = new mongoose.Schema(
  {
    username: {
      type : String,
      unique: true,
      required : true,
      lowercase : true
    },
    email:  {
      type: String,
      required : true,
      unique : true,
      lowercase : true,
    },
    password:{
      type: String,
      required : [true, "password is required"]
    }
  }, {timestamps: true}
)

export const User = mongoose.model("User", userSchema)

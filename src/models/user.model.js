import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    role: {
        type: String,
        required: true,
        enum: ["consumer", "seller", "admin"]
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    phoneNo: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String
    },
    addresses: [
        {
            type:{
                type:String,
                enum:["home" , "office" , "store"]
            },
            street: String,
            landmark: String,
            city: String,
            state: String,
            pincode: Number,
            isDefault: Boolean
        }
    ],
    isStoreApproved: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    }

}, { timestamps: true })

userSchema.pre("save" , async function(next){
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password , 10)
    next();
    
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            role:this.role,
            fullname:this.fullname,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
        
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id,
            role:this.role,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
        
    )
}

export const User = mongoose.model("Users", userSchema)
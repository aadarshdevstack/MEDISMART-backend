import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const consumerSchema = new Schema({
    role: {
        type: String,
        required: true,
        enum: ["consumer"],
        default:"consumer"
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
        type: String,
        default : ""
    },

    refreshToken: {
        type: String
    },
    addresses: [
        {
            type: {
                type: String,
                enum: ["home", "office", "rent"]
            },
            street: String,
            landmark: String,
            city: String,
            state: String,
            pincode: Number,
            isDefault: {
                type: Boolean,
                default: false
            }
        }
    ],

}, { timestamps: true })

consumerSchema.pre("save" , async function(){
    if (!this.isModified("password")) return 
    this.password = await bcrypt.hash(this.password , 10)   
})

consumerSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)
}

consumerSchema.methods.generateAccessToken= function(){
    return jwt.sign(                               
        {
            _id:this._id,
            role:this.role,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,  
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

consumerSchema.methods.generateRefreshToken= function(){
    return jwt.sign(
        {
            _id:this._id,                      
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const Consumer = mongoose.model("Consumer", consumerSchema)
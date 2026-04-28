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

    fullName: {
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
        unique:true
    },

    password: {
        type: String,
        required: true,
        minlength:6
    },

    avatar: {
        type: String,
        default : ""
    },

    refreshToken: {
        type: String,
        default:null
    },

    addresses: [
        {  
            fullName: { type: String, required: true },     
            phoneNo: { type: String, required: true },     

            pincode: { type: String, required: true },
            state: { type: String, required: true },
            city: { type: String, required: true },

            street: { type: String, required: true },       
            landmark: { type: String , required: true},    
            addressType: { 
                type: String, 
                enum: ["home", "work", "other"], 
                default: "home"
                },                 

            isDefault: { type: Boolean, default: false }
        }
    ]

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
            phoneNo:this.phoneNo,
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
import mongoose, { Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const sellerSchema = new Schema({
    role: {
        type: String,
        required: true,
        enum: ["seller"],
        default: "seller"
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
        unique: true,
        trim:true
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
    },

    avatar: {
        url: {
            type: String,
            default: ""
        },
        public_id: {
            type: String,
            default: ""
        }
    },

    storeProfile: {
        storeName: {
            type: String,
            trim: true,
            index: true,
            default: ""
        },

        storeImage: {
            url: {
                type: String,
                default: ""
            },
            public_id: {
                type: String,
                default: ""
            }
        }
    },

    storeAddress: [
        {
            street: {
                type: String,
                required: true
            },
            landmark: {
                type: String
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            }
        }
    ],

    isApproved: {
        type: Boolean,
        default: false
    },

    refreshToken: {
        type: String
    },

}, { timestamps: true })

sellerSchema.pre("save", async function () {
    if (!this.isModified("password")) return
    this.password = await bcrypt.hash(this.password, 10)
})

sellerSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

sellerSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            role: this.role,
            email: this.email,
            phoneNo: this.phoneNo,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

sellerSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const Seller = mongoose.model("Seller", sellerSchema)
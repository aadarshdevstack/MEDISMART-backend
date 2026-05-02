import mongoose, { Schema } from "mongoose";
import slugify from "slugify"

const categorySchema = new Schema({
    name:{
        type:String,
        required : true,
        trim:true,
        index:true,
        unique:true,
        minlength:3,
        maxlength:30,
        lowercase:true
    },

    displayName:{
        type:String,
    },

    slug:{
        type:String,
        index:true
    },

    description:{
        type:String,
        required:true,
        trim:true,
        minlength:20,
        maxlength:200
    },

    categoryImage: {
        url: {
            type: String,
            default: ""
        },
        public_id: {
            type: String,
            default: ""
        }
    },

    isActive:{
        type:Boolean ,
        default:true
    }
}, { timestamps: true })

categorySchema.pre("save" , function(){
    if(this.isModified("name")){
        this.slug=slugify(this.name , {
            lower : true ,
            trim:true,
            strict:true 
        })
    }
    
})

export const Category = mongoose.model("Category", categorySchema)
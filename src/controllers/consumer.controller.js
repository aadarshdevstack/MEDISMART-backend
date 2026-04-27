import { Consumer } from "../models/consumer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const updateConsumerProfie = asyncHandler(async(req,res)=>{
    /*Algorithm
    take requires fields from req.body except email and avatarimage from req.fields
    validate that min 1 field or image is required to update profile
    check that given field except fullname is already present in db if yes give error
    upload avatar on cloudinary
    check user from req.user which is coming from verifyjwt
    update given fields
    return response
     */

    let {fullName , phoneNo } = req.body

    const normalize = (val) => (
    typeof val === "string" ? val.trim() : "")

    fullName = normalize(fullName);
    phoneNo = normalize(phoneNo);

    console.log(fullName);
    console.log(phoneNo)
    console.log("File:", req.file);
    
    let avatarLocalPath;
    if (req.file?.path) {
        avatarLocalPath = req.file.path;
    }
    

    if((!fullName && !phoneNo && !avatarLocalPath)){
        throw new ApiError(400 , "minimum one field is required to update profile")
    }

    if (phoneNo) {
        const existedPhoneNo = await Consumer.findOne({
            phoneNo,
            _id: { $ne: req.user._id }  
        });
    
        if(existedPhoneNo){
            throw new ApiError(409 , "PhoneNo already existed")
        }
    }

    let uploadedAvatar;
    if (avatarLocalPath) {
    const result = await uploadOnCloudinary(avatarLocalPath , "MediSmart/Consumer/Avatar");
    console.log(result);
    
    if (!result) {
        throw new ApiError(500, "Avatar upload failed");
    }
    uploadedAvatar = result;
    }
    
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (phoneNo) updates.phoneNo = phoneNo;
    if (uploadedAvatar) updates.avatar = uploadedAvatar.url; 

    const user = await Consumer.findByIdAndUpdate(
        req.user?._id,
        {
            $set:updates
        },
        {
            new:true
        }
    ).select(
        "-password -refreshToken -__v"
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user ,  "Profile updated successfully")
    )

})

export {updateConsumerProfie}
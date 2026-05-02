import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary, cloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { Seller } from "../models/seller.model.js";


const updateSellerProfile = asyncHandler(async (req, res) => {
    /*Algorithm
    take requires fields from req.body except email and avatarimage from req.fields
    validate that min 1 field or image is required to update profile
    check that given field except fullname is already present in db if yes give error
    upload avatar on cloudinary
    check user from req.user which is coming from verifyjwt
    update given fields
    delete old avatar from cloudinary
    return response
     */

    //Otp or Email based verification while changing email and phoneNo  => to be launched in future

    let { fullName, phoneNo } = req.body

    const normalize = (val) => (
        typeof val === "string" ? val.trim() : "")

    fullName = normalize(fullName);
    phoneNo = normalize(phoneNo);

    //console.log("File:", req.file);

    let avatarLocalPath;
    if (req.file?.path) {
        avatarLocalPath = req.file.path;
    }

    if ((!fullName && !phoneNo && !avatarLocalPath)) {
        throw new ApiError(400, "minimum one field is required to update profile")
    }

    if (phoneNo) {
        const existedPhoneNo = await Seller.findOne({
            phoneNo,
            _id: { $ne: req.user._id },

        });

        if (existedPhoneNo) {
            throw new ApiError(409, "PhoneNo already existed")
        }
    }

    const existingSeller = await Seller.findById(req.user._id);
    const oldPublicId = existingSeller?.avatar?.public_id;

    let uploadedAvatar;
    if (avatarLocalPath) {
        const result = await uploadOnCloudinary(avatarLocalPath, "MediSmart/Seller/Avatar");
        //console.log(result);

        if (!result) {
            throw new ApiError(500, "Avatar upload failed");
        }
        uploadedAvatar = result;
    }

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (phoneNo) updates.phoneNo = phoneNo;
    if (uploadedAvatar) {
        updates.avatar = {
            url: uploadedAvatar.url,
            public_id: uploadedAvatar.public_id
        };
    }

    const seller = await Seller.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updates
        },
        {
            new: true,
            runValidators: true
        }
    ).select(
        "-password -refreshToken -__v -avatar.public_id -storeProfile.storeImage.public_id"
    )

    if (!seller) {
        throw new ApiError(404, "User not found");
    }

    //console.log("Old Public ID:", oldPublicId);
    //console.log("Uploaded Avatar:", uploadedAvatar);

    try {
        if (oldPublicId && uploadedAvatar) {
            await cloudinary.uploader.destroy(oldPublicId);
        }
    } catch (err) {
        console.log("Cloudinary delete failed:", err);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, seller, "Profile updated successfully")
        )

})

const updateStoreProfile = asyncHandler(async (req, res) => {
    /*Algorithm
    take requires fields from req.body and storeImage from req.fields
    validate that min 1 field is required to update storeProfile
    check that storeName is already present in db if yes give error
    upload storeImage on cloudinary
    check user from req.user which is coming from verifyjwt
    update given fields
    delete old images from cloudinary  
    return response
     */

    //Otp or Email based verification while changing storeName and StoreImage  => to be launched in future

    let { storeName } = req.body

    const normalize = (val) => (
        typeof val === "string" ? val.trim() : "")

    storeName = normalize(storeName);

    console.log("File:", req.file);

    let storeImageLocalPath;
    if (req.file?.path) {
        storeImageLocalPath = req.file.path;
    }

    if (!storeName && !storeImageLocalPath) {
        throw new ApiError(400, "minimum one field is required to update Store profile")
    }

    if (storeName) {
        const existedStoreName = await Seller.findOne({
            storeName,
            _id: { $ne: req.user._id },

        });

        if (existedStoreName) {
            throw new ApiError(409, "Store Name Already existed give another Name")
        }
    }

    const existingSeller = await Seller.findById(req.user._id);
    const oldPublicId = existingSeller?.storeProfile?.storeImage?.public_id;

    let uploadedStoreImage;
    if (storeImageLocalPath) {
        const result = await uploadOnCloudinary(storeImageLocalPath, "MediSmart/Seller/storeImages");
        //console.log(result);

        if (!result) {
            throw new ApiError(500, "store image upload failed");
        }
        uploadedStoreImage = result;
    }

    const updates = {
        storeProfile: {}
    };

    if (storeName) updates.storeProfile.storeName = storeName;
    if (uploadedStoreImage) {
        updates.storeProfile.storeImage = {
            url: uploadedStoreImage.url,
            public_id: uploadedStoreImage.public_id
        };
    }

    const seller = await Seller.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updates
        },
        {
            new: true,
            runValidators: true
        }
    ).select(
        "-password  -refreshToken   -__v   -avatar.public_id     -storeProfile.storeImage.public_id"
    )

    if (!seller) {
        throw new ApiError(404, "User not found");
    }


    //console.log("Old Public ID:", oldPublicId);
    //console.log("Uploaded storeImage:", uploadedStoreImage);

    try {
        if (oldPublicId && uploadedStoreImage) {
            await cloudinary.uploader.destroy(oldPublicId);
        }
    } catch (err) {
        console.log("Cloudinary delete failed:", err);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, seller, "Profile updated successfully")
        )

})

const addStoreAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take address in req.body
    check validation in address that all fields are required
    post this address in verifed user from jwt
    send response */

    const { pincode, state, city, street, landmark } = req.body

    if ([pincode, state, city, street, landmark].some(
        (fields) => (
            typeof fields !== "string" || fields?.trim() === ""
        )
    )) {
        throw new ApiError(400, "please fill all the required fields")
    }

    const seller = await Seller.findById(req.user?._id)

    if (!seller) {
        throw new ApiError(401, "unauthorized access")
    }

    const newAddress = { pincode, state, city, street, landmark }

    const updatedSeller = await Seller.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                storeAddress: newAddress
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedSeller) {
        throw new ApiError(404, "User not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, updatedSeller.storeAddress, "Address added successfully"
            )
        )

})

const getStoreAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take authentic user from verifyJwt
    take address array from user data
    send that array in response */

    const seller = await Seller.findById(req.user?._id)

    if (!seller) {
        throw new ApiError(401, "Unauthorized Access")
    }

    const address = seller.storeAddress

    if (!address || address.length === 0) {
        throw new ApiError(404, "No Address Found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, address, "Address fetched successfully")
        )
})

const updateStoreAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take required fields from the user for address
    validate required fields 
    take user from verifyJwt
    validate user
    take out specific address to be updated
    validate address
    update address in cuurent address id
    return response  */

    let { pincode, state, city, street, landmark } = req.body

    const normalize = (field) => (
        typeof field === "string" ? field.trim() : field
    )

    pincode = normalize(pincode)
    state = normalize(state)
    city = normalize(city)
    street = normalize(street)
    landmark = normalize(landmark)

    if (!pincode && !state && !city && !street && !landmark) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const seller = await Seller.findById(req.user?._id)

    if (!seller) {
        throw new ApiError(401, "unauthorized access")
    }

    const address = seller.storeAddress.id(req.params.id);

    //console.log(req.params.id);
    //console.log(address);
    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    const updateFields = {};

    if (pincode) updateFields["storeAddress.$.pincode"] = pincode;
    if (state) updateFields["storeAddress.$.state"] = state;
    if (city) updateFields["storeAddress.$.city"] = city;
    if (street) updateFields["storeAddress.$.street"] = street;
    if (landmark) updateFields["storeAddress.$.landmark"] = landmark;


    const updatedSeller = await Seller.findOneAndUpdate(
        {
            _id: req.user._id,
            "storeAddress._id": req.params.id
        },
        {
            $set: updateFields
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedSeller) {
        throw new ApiError(404, "User not found ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, updatedSeller.storeAddress, "Address updated successfully"
            )
        )

})

const deleteStoreAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take authentic user from jwtverify
    take out specific address to be deleted
    */
    const seller = await Seller.findById(req.user?._id);

    if (!seller) {
        throw new ApiError(401, "Unauthorized Access");
    }

    const address = seller.storeAddress.id(req.params.id);

    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    const updatedSeller = await Seller.findByIdAndUpdate(
        req.user._id,
        {
            $pull: {
                storeAddress: { _id: req.params.id }
            }
        },
        { new: true }
    );

    if (!updatedSeller) {
        throw new ApiError(404, "User not found ");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                updatedSeller.storeAddress, "Address deleted successfully"
            )
        )

})

const isAllProfileComplete = asyncHandler(async (req, res) => {
    /*Algorithm-
    take out cuurent seller from verifyJwt
    check all fields are complete
    if not give response to compete profile
     */

    const seller = await Seller.findById(req.user._id);

    if (!seller) {
        throw new ApiError(404, "Seller not found");
    }

    const isSellerProfileComplete = Boolean(
        seller.fullName &&
        seller.phoneNo &&
        seller.email &&
        seller.avatar?.url
    );

    const isStoreProfileComplete = Boolean(
        seller.storeProfile?.storeName &&
        seller.storeProfile?.storeImage?.url &&
        seller.storeAddress.length > 0
    );

    const isComplete = isSellerProfileComplete && isStoreProfileComplete;

    return res.status(200).json(
        new ApiResponse(
            200,
            { isComplete },
            isComplete
                ? "Profile is complete"
                : "Please complete your seller and store profile"
        )
    );
})

//In future add bydeafult functionality which  make address default if only one adddress is there when we delete all address except this

export {
    updateSellerProfile,
    updateStoreProfile,
    addStoreAddress,
    getStoreAddress,
    updateStoreAddress,
    deleteStoreAddress,
    isAllProfileComplete
}
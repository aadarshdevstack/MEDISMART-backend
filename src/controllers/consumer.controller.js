import { Consumer } from "../models/consumer.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary, cloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"

const updateConsumerProfile = asyncHandler(async (req, res) => {
    /*Algorithm
    take requires fields from req.body except email and avatarimage from req.fields
    validate that min 1 field or image is required to update profile
    check that given field except fullname is already present in db if yes give error
    upload avatar on cloudinary
    check user from req.user which is coming from verifyjwt
    update given fields
    remove old image from cloudinary
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
        const existedPhoneNo = await Consumer.findOne({
            phoneNo,
            _id: { $ne: req.user._id }
        });

        if (existedPhoneNo) {
            throw new ApiError(409, "PhoneNo already existed")
        }
    }

    const existingConsumer = await Consumer.findById(req.user._id);
    const oldPublicId = existingConsumer?.avatar?.public_id;

    let uploadedAvatar;
    if (avatarLocalPath) {
        const result = await uploadOnCloudinary(avatarLocalPath, "MediSmart/Consumer/Avatar");
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

    const consumer = await Consumer.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updates
        },
        {
            new: true
        }
    ).select(
        "-password -refreshToken -__v -avatar.public_id"
    )

    if (!consumer) {
        throw new ApiError(404, "User Not Found")
    }

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
            new ApiResponse(200, consumer, "Profile updated successfully")
        )

})

const addConsumerAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take address in req.body
    check validation in address if its fileds are compulsary requires and optional
    post this address in verifed user from jwt
    send response */

    const { fullName, phoneNo, pincode, state, city, street, landmark, addressType, isDefault } = req.body

    if ([fullName, phoneNo, pincode, state, city, street, landmark, addressType].some(
        (fields) => (
            typeof fields !== "string" || fields?.trim() === ""
        )
    )) {
        throw new ApiError(400, "please fill all the required fields")
    }

    const consumer = await Consumer.findById(req.user?._id)

    if (!consumer) {
        throw new ApiError(401, "unauthorized access")
    }

    const isFirstAddress = consumer.addresses.length === 0;

    const makeDefault =
        isFirstAddress || isDefault === true || isDefault === "true";

    if (makeDefault) {
        await Consumer.updateOne(
            { _id: req.user._id },
            {
                $set: {
                    "addresses.$[].isDefault": false
                }
            }
        );
    }

    const newAddress = {
        fullName, phoneNo, pincode,
        state, city, street,
        landmark, addressType,
        isDefault: makeDefault
    }

    const updatedConsumer = await Consumer.findByIdAndUpdate(
        req.user._id,
        {
            $push: {
                addresses: newAddress
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedConsumer) {
        throw new ApiError(404, "User Not Found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, updatedConsumer.addresses, "Address added successfully"
            )
        )

})

const getConsumerAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take authentic user from verifyJwt
    take address array from user data
    send that array in response */

    const consumer = await Consumer.findById(req.user?._id)

    if (!consumer) {
        throw new ApiError(401, "unauthorized access")
    }

    const address = consumer.addresses

    if (!address || address.length === 0) {
        throw new ApiError(404, "No address found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, address, "Address fetched successfully")
        )
})

const updateConsumerAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take required fields from the user for address
    validate required fields 
    take user from verifyJwt
    validate user
    take out specific address to be updated
    validate address
    update address in cuurent address id
    return response  */

    let { fullName, phoneNo, pincode, state, city, street, landmark, addressType, isDefault } = req.body

    const normalize = (field) => (
        typeof field === "string" ? field.trim() : field
    )

    fullName = normalize(fullName)
    phoneNo = normalize(phoneNo)
    pincode = normalize(pincode)
    state = normalize(state)
    city = normalize(city)
    street = normalize(street)
    landmark = normalize(landmark)
    addressType = normalize(addressType)


    if (!fullName && !phoneNo && !pincode && !state && !city && !street && !landmark && !addressType && isDefault === undefined) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const consumer = await Consumer.findById(req.user?._id)

    if (!consumer) {
        throw new ApiError(401, "unauthorized access")
    }

    const address = consumer.addresses.id(req.params.id);

    //console.log(req.params.id);
    //console.log(address);
    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    const updateFields = {};

    if (isDefault !== undefined) {
        const flag = isDefault === true || isDefault === "true";

        if (flag) {
            await Consumer.updateOne(
                { _id: req.user._id },
                { $set: { "addresses.$[].isDefault": false } }
            );
            updateFields["addresses.$.isDefault"] = true;
        }
    }

    if (fullName) updateFields["addresses.$.fullName"] = fullName;
    if (phoneNo) updateFields["addresses.$.phoneNo"] = phoneNo;
    if (pincode) updateFields["addresses.$.pincode"] = pincode;
    if (state) updateFields["addresses.$.state"] = state;
    if (city) updateFields["addresses.$.city"] = city;
    if (street) updateFields["addresses.$.street"] = street;
    if (landmark) updateFields["addresses.$.landmark"] = landmark;
    if (addressType) updateFields["addresses.$.addressType"] = addressType;

    const updatedConsumer = await Consumer.findOneAndUpdate(
        {
            _id: req.user._id,
            "addresses._id": req.params.id
        },
        {
            $set: updateFields
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!updatedConsumer) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, updatedConsumer.addresses, "Address updated successfully"
            )
        )

})

const deleteConsumerAddress = asyncHandler(async (req, res) => {
    /*Algorithm-
    take authentic user from jwtverify
    take out specific address to be deleted
    */
    const consumer = await Consumer.findById(req.user?._id);

    if (!consumer) {
        throw new ApiError(401, "Unauthorized access");
    }

    const address = consumer.addresses.id(req.params.id);

    if (!address) {
        throw new ApiError(404, "Address not found");
    }

    const updatedConsumer = await Consumer.findByIdAndUpdate(
        req.user._id,
        {
            $pull: {
                addresses: { _id: req.params.id }
            }
        },
        { new: true }
    );

    if (!updatedConsumer) {
        new ApiError(404, "user Not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,
                updatedConsumer.addresses, "Address deleted successfully"
            )
        )

})

//In future add bydeafult functionality which  make address default if only one adddress is there when we delete all address except this

export {
    updateConsumerProfile,
    addConsumerAddress,
    getConsumerAddress,
    updateConsumerAddress,
    deleteConsumerAddress
}
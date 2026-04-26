import { Consumer } from "../models/consumer.model.js";
import {Seller} from "../models/seller.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const registerUser= (Model) => asyncHandler(async(req,res)=>{
    /*Algorithm:-
    take all required fields from consumer
    validate validation
    check if user existed in db: email , phoneNo
    create userConsumer Object
    remove sensitive information like password and unnecessary information related to consumer
    check user creation 
    return response 
    */

    const {fullname , email , phoneNo , password} = req.body
    console.log(req.body);

    if(
        [fullname , email , phoneNo , password ].some(
            (field)=> (typeof field !== "string" || field?.trim() === "")
        
        )
    ){
        throw new ApiError(400 , "All Fields Are Required")
    }

    const existedUser = await Model.findOne({
        $or:[{email} , {phoneNo}]
    })

    if(existedUser){
        throw new ApiError(409 , "User with Email or Phoneno Already Exists ")
    }

    const user = await Model.create({
        fullname,
        email,
        phoneNo,
        password,
    
    })

    const createdUser = await Model.findById(user._id).select(
        "-password -refreshToken -__v"
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    res
    .status(201)
    .json(
        new ApiResponse(201 , createdUser , "User Register SuccessFully")
    )
    
})

export {registerUser}
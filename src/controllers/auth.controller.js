import { Consumer } from "../models/consumer.model.js";
import {Seller} from "../models/seller.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(Model , userId) =>{
    try {
        const user = await Model.findById(userId)
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})
    
        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500 , "something went wrong while generating access and refresh token")
    }

}

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

    const {fullName , email , phoneNo , password} = req.body
    //console.log(req.body);

    if(
        [fullName , email , phoneNo , password ].some(
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
        fullName,
        email,
        phoneNo,
        password,
    
    })

    const createdUser = await Model.findById(user._id).select(
        "-password -refreshToken -__v -avatar.public_id  -storeProfile.storeImage.public_id"
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

const loginUser = (Model) => asyncHandler(async(req,res)=>{
    /*Algorithm
    take data from user
    validate validation
    check its existance from email or phoneNo
    checkpassword
    generate access and refresh refreshToken
    send response with cookies */

    let {email , phoneNo , password } = req.body
    //console.log(req.body);
    
    
    const normalize = (val) => (
    typeof val === "string" ? val.trim() : "")

    email = normalize(email);
    phoneNo = normalize(phoneNo);
    password = normalize(password);

    if(!(email||phoneNo) || !password){
        throw new ApiError(400 , "Email or PhoneNo and Passowrd are required" )
    }

    const user = await Model.findOne({
        $or:[{email} , {phoneNo}]
    })

    if(!user){
        throw new ApiError(404 , "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(Model , user._id)

    const loggedInUser = await Model.findById(user._id).select(
        "-password -refreshToken -__v -avatar.public_id  -storeProfile.storeImage.public_id"
    )

    const options={
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser , accessToken
            },
            "logged in SuccessFully"
        )
    )

})

const logoutUser = (Model) => asyncHandler(async(req,res)=>{
    /*Algorithm-
    find user from Model by using valid user id from VerifyJWT 
    unset refresh token from that user
    return response in which we have to clear cookies*/

    await Model.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        },
        {
            new:true
        }
    )

    const options={
         httpOnly:true,
         secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200 , {} , "logged out")
    )
})

const refreshAccessToken = (Model) => asyncHandler(async(req,res)=>{
    /*Algorithm-
    take refresh token from cookies or body 
    validate refresh token
    deocde refreshToken
    find user from Model with help of decoded token
    valiate user
    check incoming refresh token is equal to user refresh token in db if this is not it means refresh token expired
    then generate both ref and acc token
    set cookies */

    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401 , "unauthorized request")
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET )
    
        const user = await Model.findById(decodedRefreshToken?._id)
    
        if(!user){
            throw new ApiError(401 , "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token is expired or used")
        }
    
        const {accessToken , refreshToken } = await generateAccessAndRefreshToken(Model , user._id)
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , refreshToken , options)
        .json(
            new ApiResponse(200,
                {accessToken} ,
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , {} , error?.message || "invalid refresh token")
    }

})

const changeCurrentPassword = (Model) => asyncHandler(async(req ,res)=>{
    /*Algorithm-
    take old and new password from user
    validate all fields are required
    finout user from Models eith help of user which is comming from verifyJwt middleware
    match oldpassword from db
    if match update it 
    set user validate before save beacause in db passwod is true
    send response */

    const {oldPassword , newPassword} = req.body

    if(
        [oldPassword , newPassword].some((fields)=>(
        typeof fields !== "string" ||  fields?.trim() === ""
    ))
    ){
        throw new ApiError(400 , "all fields are required")
    }

    if(oldPassword===newPassword){
        throw new ApiError(400 , "new passwod must be different")
    }
    
    const user = await Model.findById(req.user?._id)

    if(!user){
        throw new ApiError(404 , "user not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200 , {} , "password changed successfully")
    )
})

const getCurrentUser = (Model) => asyncHandler(async(req,res)=>{
    /*Algorithm-
    get curent user from verifyJWT middleware
    validate req.user
    return req.user */
    
     if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
})


export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser
}
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/AsyncHandler.js"
import jwt from "jsonwebtoken"

const verifyJWT = (Model) => asyncHandler(async(req ,_, next)=>{
    /*Algorithm 
    extract accessToken from cookies and also from header
    validate validation
    decode token
    check which user belongs to it
    validate user 
    pass user to next middleware or res  */
    
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
    
        if(!token){
            throw new ApiError(401 , "unauthorized request")
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        const user = await Model.findById(decodedToken?._id).select(
            "-password -refreshToken -__v -avatar.public_id -storeProfile.storeImage.public_id"
        )
    
        if(!user){
            throw new ApiError(401 , "Invalid AccessToken")
        }
    
        req.user= user
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Access Token")
    }

})

export {verifyJWT}
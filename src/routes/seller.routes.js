import {Router} from "express"
import { registerUser , loginUser , logoutUser , refreshAccessToken , changeCurrentPassword, getCurrentUser} from "../controllers/auth.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Seller } from "../models/seller.model.js"

const router = Router()

//register route
router.route("/register").post(registerUser(Seller))

//login route
router.route("/login").post(loginUser(Seller))



/*secured routes */

//logOut route
router.route("/logout").post(verifyJWT(Seller) , logoutUser(Seller))

//refresh_token route
router.route("/refresh-token").post(refreshAccessToken(Seller))

//changePassword
router.route("/change-password").post(verifyJWT(Seller) , changeCurrentPassword(Seller))

//getCurrentUser
router.route("/me").get(verifyJWT(Seller) , getCurrentUser(Seller))



export default router
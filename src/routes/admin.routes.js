import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { loginUser ,  logoutUser , refreshAccessToken , changeCurrentPassword , getCurrentUser } from "../controllers/auth.controller.js"
import {Admin} from "../models/admin.model.js"

const router = Router()

//login route
router.route("/login").post(loginUser(Admin))



/*Secured routes*/

//logout route
router.route("/logout").post(verifyJWT(Admin), logoutUser(Admin))

//refresh_token route
router.route("/refresh-token").post(refreshAccessToken(Admin))

//changePassword
router.route("/change-password").post(verifyJWT(Admin), changeCurrentPassword(Admin))

//getCurrentUser
router.route("/me").get(verifyJWT(Admin), getCurrentUser(Admin))

export default router
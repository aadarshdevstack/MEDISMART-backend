import {Router} from "express"
import { loginUser, registerUser , logoutUser, refreshAccessToken , changeCurrentPassword, getCurrentUser} from "../controllers/auth.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Consumer } from "../models/consumer.model.js"
import { upload } from "../middlewares/multer.middleware.js"
import { updateConsumerProfie } from "../controllers/consumer.controller.js"


const router = Router()

//register route
router.route("/register").post(registerUser(Consumer))

//login route
router.route("/login").post(loginUser(Consumer))


/*Secured routes*/

//logout route
router.route("/logout").post(verifyJWT(Consumer) , logoutUser(Consumer))

//refresh_token route
router.route("/refresh-token").post(refreshAccessToken(Consumer))

//changePassword
router.route("/change-password").post(verifyJWT(Consumer) , changeCurrentPassword(Consumer))

//getCurrentUser
router.route("/me").get(verifyJWT(Consumer) , getCurrentUser(Consumer))
export default router

//updateProfile
router.route("/update-profile").patch(
    verifyJWT(Consumer) , upload.single("avatar") , updateConsumerProfie
)
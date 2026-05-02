import { Router } from "express"
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser } from "../controllers/auth.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Seller } from "../models/seller.model.js"
import { addStoreAddress, deleteStoreAddress, getStoreAddress, isAllProfileComplete, updateSellerProfile, updateStoreAddress, updateStoreProfile } from "../controllers/seller.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

//register route
router.route("/register").post(registerUser(Seller))

//login route
router.route("/login").post(loginUser(Seller))



/*secured routes */

//logOut route
router.route("/logout").post(verifyJWT(Seller), logoutUser(Seller))

//refresh_token route
router.route("/refresh-token").post(refreshAccessToken(Seller))

//changePassword
router.route("/change-password").post(verifyJWT(Seller), changeCurrentPassword(Seller))

//getCurrentUser
router.route("/me").get(verifyJWT(Seller), getCurrentUser(Seller))

//updateSellerProfile
router.route("/update-profile").patch(
    verifyJWT(Seller), upload.single("avatar"), updateSellerProfile
)

//updateStoreProfile
router.route("/update-store-profile").patch(
    verifyJWT(Seller), upload.single("storeImage"), updateStoreProfile
)

//Add&GetAddress
router.route("/store-address")
    .post(verifyJWT(Seller), addStoreAddress)
    .get(verifyJWT(Seller), getStoreAddress)

//isAllProfileComplete
router.route("/profile-status").get(verifyJWT(Seller) , isAllProfileComplete)    

//updateAndDeleteAddress
router.route("/store-address/:id")
    .patch(verifyJWT(Seller), updateStoreAddress)
    .delete(verifyJWT(Seller), deleteStoreAddress)

export default router
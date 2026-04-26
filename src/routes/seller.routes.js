import {Router} from "express"
import { registerUser } from "../controllers/auth.controller.js"
import { Seller } from "../models/seller.model.js"
const router = Router()

//register route
router.route("/register").post(registerUser(Seller))

//login route

export default router
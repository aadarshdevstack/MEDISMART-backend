import {Router} from "express"
import { registerUser } from "../controllers/auth.controller.js"
import { Consumer } from "../models/consumer.model.js"

const router = Router()

//register route
router.route("/register").post(registerUser(Consumer))

//login route

export default router
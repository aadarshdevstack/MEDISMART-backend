import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { Admin } from "../models/admin.model.js"
import {upload} from "../middlewares/multer.middleware.js"

import {
    activateCategory,
    createCategory,
    deactivateCategory,
    getAllActiveCategory,
    getAllCategory,
    getActiveCategory,
    getCategory,
    searchCategory,
    updateCategory
} from "../controllers/category.controller.js"

const router = Router()

//get All Active Category
router.route("/active").get(getAllActiveCategory)

//search Category
router.route("/search").get(searchCategory)

//create category and get All category
router.route("/")
.post(verifyJWT(Admin), upload.single("categoryImage"), createCategory)
.get(verifyJWT(Admin) , getAllCategory)

//activate Category
router.route("/:id/activate").patch(verifyJWT(Admin), activateCategory)

//deactivate Category
router.route("/:id/deactivate").patch(verifyJWT(Admin), deactivateCategory)

//get Active Category
router.route("/:id/active").get(getActiveCategory)

//update Category and get Category
router.route("/:id")
.get(verifyJWT(Admin) , getCategory)
.patch(verifyJWT(Admin), upload.single("categoryImage") , updateCategory)


export default router
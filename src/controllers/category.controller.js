import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary , cloudinary} from "../utils/Cloudinary.js";

const createCategory = asyncHandler(async (req, res) => {
    /*Algorithm-
    take out required fields from admin
    also take image from multer middleware
    validate required fields
    upload image on cloudinary 
    extract url & public id from return 
    if all ok then create category in category db with help of category model */

    const { name, description } = req.body
   
    const categoryImageLocalPath = req.file?.path

    if ([name, description].some(
        (fields) => (
            typeof fields !== "string" || fields.trim() === ""
        )
    )) {
        throw new ApiError(400, "All fields are required")
    }

    if (!categoryImageLocalPath) {
        throw new ApiError(400, "Category image is required")
    }

    if (name.length < 3 || name.length > 30) {
        throw new ApiError(
            400, "name should be between 3-30 character"
        )
    }

    if (description.length < 20 || description.length > 200) {
        throw new ApiError(400, "description should be between 10-200 characters")
    }

    const normalizedName = name.trim().toLowerCase()

    const existingCategory = await Category.findOne({ name: normalizedName })

    if (existingCategory) {
        throw new ApiError(400, "Category name already existed")
    }

    const uploadedCategoryImage = await uploadOnCloudinary(categoryImageLocalPath, "MediSmart/Category Image")

    if (!uploadedCategoryImage) {
        throw new ApiError(500, "Image uploaded failed")
    }

    const category = await Category.create(
        {
            name: normalizedName,
            displayName: name,
            description,
            categoryImage: {
                url: uploadedCategoryImage.url,
                public_id: uploadedCategoryImage.public_id
            }
        }
    )

    const createdCategory = await Category.findById(category._id).select(
        "-__v -categoryImage.public_id"
    )

    if (!createdCategory) {
        throw new ApiError(500, "something went wrong while creating category")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201, createdCategory, "Category Created SuccessFully"
            )
        )

})

const getAllCategory = asyncHandler(async (req, res) => {
    /*Algorithm :
    take out all category name from Category model 
    send response */

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allCategory = await Category.find()
        .skip(skip)
        .limit(limit)
        .select(
            "-__v -categoryImage.public_id"
        )


    const total = await Category.countDocuments();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data: allCategory,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalCategories: total
                },
                allCategory.length ? "Categories fetched successfully" : "No categories found"
            )
        )
})

const getAllActiveCategory = asyncHandler(async (req, res) => {
    /*Algorithm :
    take out all active category  from Category model 
    send response */

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const allActiveCategory = await Category.find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .select(
            "-__v -categoryImage.public_id"
        )

    const total = await Category.countDocuments({ isActive: true });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data: allActiveCategory,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalCategories: total
                },
                allActiveCategory.length ? "Categories fetched successfully" : "No categories found"
            )
        )
})

const getCategory = asyncHandler(async (req, res) => {
    /*Algorithm-
    take required category in params
    findout required id with help pf findbyid method
    check it is present or not , if not give error
    return res
     */

    const category = await Category.findById(req.params.id).select(
        "-__v -categoryImage.public_id"
    )

    if (!category) {
        throw new ApiError(404, "Category not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, category, "Category fetched successfully"
            )
        )

})

const getActiveCategory = asyncHandler(async (req, res) => {
    /*Algorithm-
    take required category in params
    findout required id with help pf findbyid method and give condition
    check it is present or not , if not give error
    return res
     */

    const category = await Category.findOne({
        _id: req.params.id,
        isActive: true
    })
        .select(
            "-__v -categoryImage.public_id"
        )

    if (!category) {
        throw new ApiError(404, "Category not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, category, "Category fetched successfully"
            )
        )

})

const updateCategory = asyncHandler(async (req, res) => {
    /*Algorithm-
    take required fields and image from admin
    validate Fields
    take category id from req.params.id which has to update
    condition wise update fields
    return res */

    let { name, description } = req.body
    
    const normalize = (val) => (
        typeof val === "string" ? val.trim() : "")

    const normalizedName = normalize(name)?.toLowerCase();
    description = normalize(description);

    let categoryImageLocalPath;
    if (req.file?.path) {
        categoryImageLocalPath = req.file.path;
    }

    if ((!normalizedName && !description && !categoryImageLocalPath)) {
        throw new ApiError(400, "At least one field is required to update category")
    }

    const updates = {}

    if (normalizedName) {
        if (normalizedName.length < 3 || normalizedName.length > 30) {
            throw new ApiError(
                400, "name should be between 3-30 characters"
            )
        }

        const existedName = await Category.findOne({
            name:normalizedName,
            _id: {
                $ne: req.params.id
            }
        })

        if (existedName) {
            throw new ApiError(400, "Category name already exists")
        }
        updates.name = normalizedName
        updates.displayName = name
    }

    if (description) {
        if (description.length < 20 || description.length > 200) {
            throw new ApiError(400, "description should be between 20-200 characters")
        }
        updates.description = description
    }

    const existingCategory = await Category.findById(req.params.id);
    const oldPublicId = existingCategory?.categoryImage?.public_id;
      
    let uploadedCategoryImage
    if (categoryImageLocalPath) {

        const result = await uploadOnCloudinary(categoryImageLocalPath, "MediSmart/Category Image")
        uploadedCategoryImage = result

        if (!result) {
            throw new ApiError(500, "Image uploaded failed")
        }
        updates.categoryImage = {
            url: result.url,
            public_id: result.public_id
        }
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
        throw new ApiError(404, "category not found")
    }

    Object.assign(category, updates);

    const updatededCategory = await category.save(
        {
            validateBeforeSave:true,
            
        }
    )

    if (!updatededCategory) {
        throw new ApiError(500,"Error occoured while updating")
    }

    try {
        if (oldPublicId && uploadedCategoryImage) {
            await cloudinary.uploader.destroy(oldPublicId);
        }
    } catch (err) {
        console.log("Cloudinary delete failed:", err);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200, updatededCategory, "category updated successfully"
            )
        )
})

const deactivateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params?.id,
        {
            $set: { isActive: false }
        },
        {
            new: true,
            runValidators: true


        }
    ).select("-__v -categoryImage.public_id")

    if (!category) {
        throw new ApiError(404, "category not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                category,
                "Category deactivated SuccessFully"
            )
        )
})

const activateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params?.id,
        {
            $set: { isActive: true }
        },
        {
            new: true,
            runValidators: true


        }
    ).select("-__v -categoryImage.public_id")

    if (!category) {
        throw new ApiError(404, "category not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                category,
                "Category activated SuccessFully"
            )
        )
})

const searchCategory = asyncHandler(async (req, res) => {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { keyword } = req.query

    if (!keyword || keyword.trim() === "") {
        throw new ApiError(400, "Keyword is required");
    }

    const normalizedKeyword = keyword.trim();

    const category = await Category.find({
        isActive: true,
        name: { $regex: normalizedKeyword, $options: "i" }
    })
        .skip(skip)
        .limit(limit)
        .select(
            "-__v -categoryImage.public_id"
        )

    const total = await Category.countDocuments({
        isActive: true,
        name: { $regex: normalizedKeyword, $options: "i" }
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    data: category,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalCategories: total
                },
                category.length ? "Categories fetched successfully" : "No Categories found"
            )
        )

})


export {
    createCategory,
    getAllCategory,
    getAllActiveCategory,
    getCategory,
    getActiveCategory,
    updateCategory,
    deactivateCategory,
    activateCategory,
    searchCategory
}
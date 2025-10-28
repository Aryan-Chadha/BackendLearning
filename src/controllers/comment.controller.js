import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { apiResponse } from "../utils/apiResponse.js"
import { isValidObjectId } from "mongoose"
import { ApiError } from "../utils/apiError.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video reference")
    }

    const aggregation = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $sort: {
                "createdAt": -1
            }
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const comments = await Comment.aggregatePaginate(aggregation, options)

    return res
        .status(200)
        .json(new apiResponse(200, comments, "Comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    const { content } = req.body
    const userId  = req.user?._id

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video reference")
    }

    if (!content) {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    })

    if (!comment) {
        throw new ApiError(500, "Somenthing went wrong while saving in DB")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, comment, "Comment saved successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment reference")
    }

    if (!content) {
        throw new ApiError(400, "Content is required for updation")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if (!comment) {
        throw new ApiError(500, "Somenthing went wrong while updation in DB")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,comment,"Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment reference")
    }

    const comment = await Comment.findByIdAndDelete(commentId)

    if (!comment) {
        throw new ApiError(404, "Error while deletion from DB or Comment not Exist")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,comment,"Comment deleted successfully")
    )

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
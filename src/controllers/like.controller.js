import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model"
import { asyncHandler } from "../utils/asyncHandler"
import { ApiError } from "../utils/apiError"
import { Like } from "../models/like.model"
import { apiResponse } from "../utils/apiResponse"
import { Tweet } from "../models/tweet.model"
import { Comment } from "../models/comment.model"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const likedBy = req.user?._id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video reference")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "invalid video reference")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: likedBy
    })

    let response;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        response = {
            isLiked: false,
            message: "Video unliked successfully"
        }
    } else {
        await Like.create({
            video: videoId,
            likedBy: likedBy
        })

        response = {
            isLiked: true, 
            message: "Video liked successfully"
        }
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, response, "success")
    )

    //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const {commentId} = req.params
    const likedBy = req.user?._id

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment reference")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "invalid comment reference")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: likedBy
    })

    let response;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        response = {
            isLiked: false,
            message: "Comment unliked successfully"
        }
    } else {
        await Like.create({
            comment: commentId,
            likedBy: likedBy
        })

        response = {
            isLiked: true, 
            message: "Comment liked successfully"
        }
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, response, "success")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params
    const likedBy = req.user?._id

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet reference")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "invalid tweet reference")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: likedBy
    })

    let response;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        response = {
            isLiked: false,
            message: "Tweet unliked successfully"
        }
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: likedBy
        })

        response = {
            isLiked: true, 
            message: "Tweet liked successfully"
        }
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, response, "success")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedBy = req.user?._id
    const videos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(likedBy),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project:{
                                        _id:1,
                                        username:1,
                                        fullName:1,
                                        avatar:1,
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind:"$owner"
                    },
                    {
                        $project:{
                            videoFile:0
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $addFields:{
                "video.likedAt": "$createdAt"
            }
        },
        {
            $replaceRoot:{
                newRoot: "$video"
            }
        },
        {
            $sort: {
                likedAt: -1
            }
        }
    ])

    if (!videos.length) {
        return res.status(200).json(200,videos,"No liked videos found")
    }    

    return res
    .status(200)
    .json(
        new apiResponse(200,videos,"Liked videos fetched successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}
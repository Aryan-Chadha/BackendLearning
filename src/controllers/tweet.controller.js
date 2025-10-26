import mongoose,{isValidObjectId} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import { Tweet } from "../models/tweet.model.js"
import { apiResponse } from "../utils/apiResponse.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if (!content) {
        throw new ApiError(404, "content is required")
    }
    const owner = req.user?._id
    const tweet = await Tweet.create({
        content,
        owner
    })
    if (!tweet) {
        throw new ApiError(500,"Somenthing went wrong while saving in DB")
    }

    return res
    .status(200)
    .json( new apiResponse(200,tweet,"Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId,sortBy,sortType} = req.query
    if (!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid userId")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: userId
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id:1,
                            username: 1,
                            avatar: 1
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
                [sortBy || 'createdAt']: sortType === 'asc' ? 1 : -1
            },
        }
    ])
    if (!tweets.length) {
        throw new ApiError(404,"No tweet found for the User")
    }

    return res
    .status(200)
    .json( new apiResponse(200,tweets,"Tweets fetched successfully") )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Invalid tweet reference")
    }
    if (!content) {
        throw new ApiError(400, "content required for updation")
    }
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {new: true}
    )

    if (!tweet) {
        throw new ApiError(500,"Error while updating in DB: tweet doesn't found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,tweet,"Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400,"Invalid tweet reference")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if (!tweet) {
        throw new ApiError(500,"Error while deletion from DB")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,tweet,"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
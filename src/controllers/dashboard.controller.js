import mongoose from 'mongoose'
import { Subscription } from '../models/subscription.model.js'
import { Video } from '../models/video.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { apiResponse } from '../utils/apiResponse.js'
import { ApiError } from '../utils/apiError.js'
import { Like } from '../models/like.model.js'

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const  channelId  = req.user?._id
    const stats = {}

    // Get total subscribers
    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "subscribers"
        }
    ])

    stats.totalSubscribers = totalSubscribers[0]?.subscribers || 0

    // get total videos, total video views 

    const totalVideosAndViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ])

    stats.totalVideos = totalVideosAndViews[0]?.totalVideos || 0
    stats.totalViews = totalVideosAndViews[0]?.totalViews || 0

    // get total likes

    const totalLikes = await Like.aggregate([
        {
            $match: {
                video: {
                    $exists: true,
                    $ne: null
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $unwind: "$videoDetails"
        },
        {
            $match: {
                "videoDetails.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "likes"
        }
    ])

    stats.totalLikes = totalLikes[0]?.likes || 0

    return res
        .status(200)
        .json(
            new apiResponse(200, stats, "Stats fetched successfully")
        )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelId = req.user?._id

    const videos = await Video.find({
        owner: channelId
    })

    if (!videos || videos.length === 0) {
        throw new ApiError(404, "No videos found for this channel");
    }

    return res.status(200).json(new apiResponse(200, videos, "Videos fetched successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}
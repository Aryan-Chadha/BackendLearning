import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError"
import { apiResponse } from "../utils/apiResponse"
import { asyncHandler } from "../utils/asyncHandler"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user?._id
    // TODO: toggle subscription

    const channel = await User.findById(userId)

    if (!channel) {
        throw new ApiError(404, "invalid video reference")
    }

    const existingSubscribed = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    let response;

    if (existingSubscribed) {
        await Subscription.findByIdAndDelete(existingLike._id)
        response = {
            isSubscribed: false,
            message: "Channel unsubscribed successfully"
        }

    } else {
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        })

        response = {
            isSubscribed: true,
            message: "Channel subscribed successfully"
        }
    }

     return res
    .status(200)
    .json(
        new apiResponse(200, response, "success")
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
            $unwind: "$subscriber"
        },
        {
            $replaceRoot:{
                newRoot: "$subscriber"
            }
        }
    ])

    if (!subscribers.length) {
        return res.status(200).json(200,subscribers,"Zero Subscribers Found for the channel")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,subscribers,"Subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const channels = await Subscription.aggregate([
        {
            $match:{
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
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
            $unwind: "$channel"
        },
        {
            $replaceRoot:{
                newRoot: "$channel"
            }
        }
    ])

     if (!channels.length) {
        return res.status(200).json(200,channels,"Zero Subscribed Channel found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,channels,"Channels fetched successfully")
    )

})


export{
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}
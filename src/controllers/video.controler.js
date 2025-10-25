import { Video } from '../models/video.model.js'
import { ApiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js'

const getAllvideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const match = {}
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    }

    if (userId) {
        match.owner = userId
    }

    const aggregation = Video.aggregate([
        {
            $match: match
        },
        {
            $lookup: {
                from: 'User',
                localField: 'owner',
                foreignField: '_id',
                as: 'owner',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$owner'
        },
        {
            $sort: {
                [sortBy || 'createdAt']: sortType === 'asc' ? 1 : -1
            },
        }
    ])

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    }

    const videos = await Video.aggregatePaginate(aggregation, options)

    return res
        .status(200)
        .json(new apiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description } = req.body

    if (
        [title, description].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const owner = req.user?._id

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile) {
        throw new ApiError(500, "Error while uploading video file")
    }

    if (!thumbnail) {
        throw new ApiError(500, "Error while uploading thumbnail")
    }

    const video = await Video.create({
        videoFile: {
            url: videoFile.url,
            publicId: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            publicId: thumbnail.public_id
        },
        title,
        description,
        duration: videoFile.duration,
        owner
    })

    if (!video) {
        throw new ApiError(500, "Somenthing went wrong while saving in DB")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, video, "Video published successfully")
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!videoId.trim()) {
        throw new ApiError(400, "video reference is required")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: videoId
            }
        },
        {
            $lookup: {
                from: "User",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    if (!video.length) {
        throw new ApiError(500, "Video doesn't exist")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, video[0], "Video fetched successfully")
        )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    const thumbnailLocalPath = req.file?.path

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At least one field is required for updation")
    }

    const videoDetails = await Video.findById(videoId)

    let thumbnail;
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if (!thumbnail.url) {
            throw new ApiError(400, "Error while uploading thumbnail")
        }

        const deleteOldThumbnail = await deleteFromCloudinary(videoDetails?.thumbnail?.publicId)

        if (!deleteOldThumbnail || deleteOldThumbnail.result !== "ok") {
            await deleteFromCloudinary(thumbnail.public_id); //rollback new thumbnail upload
            throw new ApiError(500, "Failed to delete old avatar. Rolled back new upload.")
        }
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                ...(title && { title }),
                ...(description && { description }),
                ...(thumbnailLocalPath && {
                    thumbnail: {
                        url: thumbnail.url,
                        publicId: thumbnail.public_id,
                    }
                })
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(
            new apiResponse(200, video, "Video details updated successfully")
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const VideoDetailsDeleted = await Video.findByIdAndDelete(videoId)
    if (!VideoDetailsDeleted) {
        throw new ApiError(404, "Error while deletion from DB or Video not Exist")
    }
    try {
        await deleteFromCloudinary(VideoDetailsDeleted.videoFile.publicId)
        await deleteFromCloudinary(VideoDetailsDeleted.thumbnail.publicId)
    } catch (error) {
        console.error("Cloudinary failed:", error);
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, VideoDetailsDeleted, "Video deleted successfully")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const toggle = await Video.findByIdAndUpdate(
        videoId,
        [
            {
                $set: {
                    isPublished: { $not: '$isPublished' }
                }
            }
        ],
        { new: true }
    )
    if (!toggle) {
        throw new ApiError(404, "Video not found");
    }
    return res
        .status(200)
        .json(
            new apiResponse(200, toggle, "Publish status toggled successfully")
        );
})



export {
    getAllvideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
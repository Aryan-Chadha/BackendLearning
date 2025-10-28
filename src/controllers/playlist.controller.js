import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model"
import { ApiError } from "../utils/apiError"
import { apiResponse } from "../utils/apiResponse"
import { asyncHandler } from "../utils/asyncHandler"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "Both Name and description are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(500, "Error while saving")
    }

    return res
        .status(201)
        .json(
            new apiResponse(201, playlist, "Playlist created successfully")
        )

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    const playlists = await Playlist.find({
        owner: userId
    }).select("-owner")

    if (!playlists.length) {
        return res.status(204).json(new apiResponse(204, playlists, "No playlist found"))
    }

    return res
        .status(200)
        .json(new apiResponse(200, playlists, "Playlists fetched successfully"))
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playllist reference")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
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
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: {
                            path: "$owner",
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            duration: 1,
                            views: 1,
                            isPublished: 1,
                            owner: 1
                        }
                    }
                ]
            }
        }
    ])

    if (!playlist.length) {
        throw new ApiError(404, "No playlist found for the given reference")
    }

    return res
        .status(200)
        .json(new apiResponse(200, playlist[0], "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Both Playlist and Video reference are required")
    }

    const videoAddedToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!videoAddedToPlaylist) {
        throw new ApiError(500, "Error while adding video")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, videoAddedToPlaylist, "Video added successfully")
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
     if (!playlistId || !videoId) {
        throw new ApiError(400, "Both Playlist and Video reference are required")
    }

    const videoRemovedFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!videoRemovedFromPlaylist) {
        throw new ApiError(500, "Error while removing video")
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, videoRemovedFromPlaylist, "Video removed successfully")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist reference")
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId)

    if (!deletePlaylist) {
        throw new ApiError(500, "Error while deletion")
    }

    return res
    .status(204)
    .json(
        new apiResponse(204,deletePlaylist,"Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist reference")
    }
    if (!name && !description) {
        throw new ApiError(400, "Atleast Name or description is required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                ...(name && {name}),
                ...(description && {description})
            }
        },
        {new:true}
    )

    if (!playlist) {
        throw new ApiError(500,"Error while updation")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200,playlist,"Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
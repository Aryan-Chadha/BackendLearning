import { apiResponse } from "../utils/apiResponse"
import { asyncHandler } from "../utils/asyncHandler"

const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    
    return res
    .status(200)
    .json( new apiResponse(200,{status: "OK"} ,"Healthcheck Ok"))
})

export {
    healthcheck
    }
    
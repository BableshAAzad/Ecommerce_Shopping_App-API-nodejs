import jwt from 'jsonwebtoken';
import UserModel from '../models/user.js';

const checkUserAuth = async (req, res, next) => {
    const authorization = req.headers.cookie;

    let accessToken;
    let refreshToken;

    // Extract 'at' and 'rt' tokens from cookies
    if (authorization) {
        const cookies = authorization.split('; ');
        cookies.forEach(cookie => {
            if (cookie.startsWith('at=')) {
                accessToken = cookie.split('=')[1];
            }
            if (cookie.startsWith('rt=')) {
                refreshToken = cookie.split('=')[1];
            }
        });
    }

    try {
        // Validate Access Token (at)
        if (accessToken) {
            const { userId } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
            
            // Get User from Token
            const user = await UserModel.findById(userId).select('-password -termAndCondition -isDeleted');
            if (!user) {
                return res.status(404).send({ status: 404, message: "User not found" });
            }

            req.user = {
                userId: user._id,
                username: user.username,
                email: user.email,
                userRole: user.userRole
            };
            return next();
        }

        // Validate Refresh Token (rt) if Access Token is not present or invalid
        // if (refreshToken) {
        //     const { userID } = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);

            // Check if user exists for the refresh token
        //     const user = await UserModel.findById(userID).select('-password');
        //     if (!user) {
        //         return res.status(404).send({ status: 404, message: "User not found" });
        //     }

        //     req.user = {
        //         userId: user._id,
        //         username: user.username,
        //         email: user.email,
        //         userRole: user.userRole
        //     };
        //     return next();
        // }
        
        // If both tokens are invalid
        throw new Error("Unauthorized User++++");
        
    } catch (error) {
        console.error(error);
        res.status(401).send({ status: 401, message: "Unauthorized User----" });
    }
};

export default checkUserAuth;

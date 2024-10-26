import jwt from 'jsonwebtoken';
import UserModel from '../models/user.js';

var checkUserAuth = async (req, res, next) => {
    const authorization = req.headers.cookie;

    let accessToken;
    let refreshToken;

    // Extract 'at' and 'rt' tokens from cookie
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
            const { userID } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
            
            // Get User from Token
            let user = await UserModel.findById(userID).select('-password -termAndCondition -isDeleted');
            req.user = {
                userId: user._id,
                username: user.username,
                email: user.email,
                userRole: user.userRole
            }
            return next();
        }

        // If access token is not valid, try validating Refresh Token (rt)
        if (refreshToken) {
            const { userID } = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
            
            // Re-issue a new Access Token if refresh token is valid
            const newAccessToken = jwt.sign(
                { userID },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '15m' } // or any desired expiry time
            );
            
            // Set new Access Token in response header or cookie
            res.cookie('at', newAccessToken, { httpOnly: true });
            
            req.user = await UserModel.findById(userID).select('-password');
            return next();
        }
        
        // If both tokens are invalid
        throw new Error("Unauthorized User");
        
    } catch (error) {
        console.log(error);
        res.status(401).send({ "status": 401, "message": "Unauthorized User" });
    }
};

export default checkUserAuth;

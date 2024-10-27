import UserModel from '../models/user.js';
import jwt from 'jsonwebtoken';

let refreshLogin = async (req, res) => {
    try {
        const authorization = req.headers.cookie;
        let refreshToken;

        // Extract 'rt' token from cookie
        if (authorization) {
            refreshToken = authorization.split('=')[1];
            console.log(authorization);
        }

        if (refreshToken) {
            // Verify and decode the token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
            const previousExpiration = decoded.exp; // existing expiration time in seconds since UNIX epoch
            const _id = decoded.userId;

            // Find user by decoded ID
            let user = await UserModel.findById({ _id });
            
            // Check if user exists
            if (!user) {
                return res.status(404).send({
                    status: 404,
                    message: "User not found",
                    rootCause: "Invalid user ID in token"
                });
            }

            // Create new access token
            const accessToken = jwt.sign(
                { userId: user._id, userRole: user.userRole },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '1h' }
            );

            res.cookie('at', accessToken, {
                httpOnly: true,   // This flag makes the cookie inaccessible to JavaScript
                secure: process.env.NODE_ENV === 'production', // Secure flag for HTTPS in production
                sameSite: 'strict',  // Helps prevent CSRF attacks or `Lax`
                maxAge: 60 * 60 * 1000 // Token expires in 1 hour
            });

            res.status(200).send({
                status: 200,
                message: "Access token refreshed",
                data: {
                    userId: user._id,
                    username: user.username,
                    userRole: user.userRole,
                    accessExpiration: 60 * 60,
                    refreshExpiration: previousExpiration
                }
            });
        } else {
            res.status(401).send({
                status: 401,
                message: "Login first",
                rootCause: "Please login first"
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            status: 500,
            message: "Token verification failed",
            rootCause: "Invalid or expired token"
        });
    }
};

export default refreshLogin;

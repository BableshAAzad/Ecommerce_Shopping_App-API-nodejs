import UserModel from '../models/user.js'
import jwt from 'jsonwebtoken'

let refreshLogin = async (req, res) => {
    try {
        const authorization = req.headers.cookie;
        let refreshToken;
        // Extract 'at' and 'rt' tokens from cookie
        if (authorization) {
            refreshToken = authorization.split('=')[1];
        }

        if (refreshToken) {
            // Verify and decode the token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
            const _id = decoded.userId;
            let user = await UserModel.findById({ _id })

            const accessToken = jwt.sign({ userId: user._id, userRole: user.userRole }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
            res.cookie('at', accessToken, {
                httpOnly: true,   // This flag makes the cookie inaccessible to JavaScript
                secure: process.env.NODE_ENV === 'production' || "dev", // Secure flag for HTTPS in production
                sameSite: 'strict',  // Helps prevent CSRF attacks or `Lax`
                maxAge: 60 * 60 * 1000 // Token expires in 1 hours
            })

            res.status(200).send({
                "status": 200, "message": "Refresh token created", "data": {
                    userId: user._id,
                    username: user.username,
                    userRole: user.userRole,
                    accessExpiration: 60 * 60,
                    refreshExpiration: 15 * 24 * 60 * 60
                }
            });
        } else {
            res.status(500).send({ "status": 500, "message": "Login first", "rootCause": "Please login first" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ "status": 500, "message": "Login first", "rootCause": "Please login first" })
    }
}

export default refreshLogin
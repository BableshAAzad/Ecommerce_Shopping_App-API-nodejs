import UserModel from '../models/user.js'
import jwt from 'jsonwebtoken'
import cookie from 'cookie' // to parse cookie strings

let refreshLogin = async (req, res) => {
    try {
        const authorization = req.headers.cookie;
        let refreshToken;

        // Parse cookies and extract `rt` token if available
        if (authorization) {
            const cookies = cookie.parse(authorization);
            refreshToken = cookies.rt;  // Extract refresh token (`rt`) from parsed cookies
            console.log(`Refresh token: ${refreshToken}`);
        }

        if (refreshToken) {
            // Verify and decode the token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
            const previousExpiration = decoded.exp; // existing expiration time in seconds since UNIX epoch
            const _id = decoded.userId;
            let user = await UserModel.findById({ _id });

            if (!user) {
                return res.status(404).send({ status: 404, message: "User not found" });
            }

            // Generate a new access token
            const accessToken = jwt.sign(
                { userId: user._id, userRole: user.userRole },
                process.env.JWT_SECRET_KEY,
                { expiresIn: '1h' }
            );

            // Set access token in a cookie
            res.cookie('at', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' || "dev",
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000
            });

            res.status(200).send({
                status: 200,
                message: "Refresh token created",
                data: {
                    userId: user._id,
                    username: user.username,
                    userRole: user.userRole,
                    accessExpiration: 60 * 60,
                    refreshExpiration: previousExpiration
                }
            });
        } else {
            res.status(401).send({ status: 401, message: "Login first", rootCause: "Please login first" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ status: 500, message: "Invalid token", rootCause: "Please login again" });
    }
};

export default refreshLogin;

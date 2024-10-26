
// Logout route
let logout = async (req, res) => {
    const authorization = req.headers.cookie;
    // console.log(authorization)
    
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

    if (accessToken || refreshToken) {
        res.clearCookie('rt', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || "dev",
            sameSite: 'strict',
        });
        res.clearCookie('at', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' || "dev",
            sameSite: 'strict',
        });
        res.status(200).send({ status: 200, message: 'Logout successful done' });
    } else {
        res.status(500).send({ "status": 500, "message": "Login first", "rootCause": "Please login first" })
    }
};

export default logout;

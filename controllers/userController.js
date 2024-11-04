import UserModel from '../models/user.js'
import bcrypt from 'bcrypt'
import NodeCache from 'node-cache';
import jwt from 'jsonwebtoken'
import transporter from '../config/emailConfig.js'

// Create a cache instance with a default TTL of 15 minutes (900 seconds)
const cache_user = new NodeCache({ stdTTL: 900 });
// Create a cache instance with a default TTL of 5 minutes (300 seconds)
const cache_otp = new NodeCache({ stdTTL: 300 })

class UserController {
    // ^---------------------------------------------------------------------------------------------------------
    static userRegistration = async (req, res) => {
        const { email, password, password_confirmation, termAndCondition } = req.body
        const user = await UserModel.findOne({ email: email })

        //& Check if user already exists
        if (user) {
            res.status(409).send({ "status": "failed", "message": "Email already exists" })
            //! 409 Conflict for the case where the email already exists.
        } else {
            // ~ // Check if all fields are provided
            if (email && password && password_confirmation && termAndCondition) {
                //~ Check if password and password confirmation match
                if (password === password_confirmation) {
                    try {
                        const userRole = req.addRoll; // This will be "SELLER" or "CUSTOMER" depending on the route
                        const user = {
                            userId: null,
                            username: null,
                            email: email,
                            password: password,
                            termAndCondition: termAndCondition,
                            userRole: userRole
                        }

                        let otp = Math.floor(100000 + Math.random() * 900000);

                        // Store user and OTP in cache with separate keys
                        cache_user.set(`user_${email}`, user);
                        cache_otp.set(`otp_${email}`, otp);

                        // Calculate expiration time (current time + 5 minutes)
                        const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
                        const time = expirationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        // send mail with opt
                        let info = await transporter.sendMail({
                            from: process.env.EMAIL_FROM,
                            to: user.email,
                            subject: "OTP - Ecommerce-Shopping-App",
                            html: `<h2>Your otp is : ${otp} </h2></br><p>Otp will be expired after 5 minutes: ${time}</p>`
                        })
                        res.status(202).send({
                            "status": 202, "message": "Otp sended", "data": {
                                userId: null,
                                username: null,
                                email: email,
                                termAndCondition: termAndCondition,
                                userRole: userRole
                            }
                        })
                    } catch (error) {
                        console.log(error)
                        res.status(500).send({ "status": "failed", "message": "Unable to Register" })
                        // ! 500 Internal Server Error for server errors during registration.
                    }
                } else {
                    res.status(400).send({ "status": "failed", "message": "Password and Confirm Password doesn't match" })
                    //! 400 Bad Request for missing fields or password mismatch.
                }
            } else {
                res.status(400).send({ "status": "failed", "message": "All fields are required" })
                //! 400 Bad Request for missing fields or password mismatch.
            }
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static userRegistrationWithOtp = async (req, res) => {
        let { email, otp } = req.body
        if (email && otp) {
            // Retrieve the object from the cache
            const user = cache_user.get(`user_${email}`);
            const cache_otp_v = cache_otp.get(`otp_${email}`);
            if (user && otp) {
                if (cache_otp_v == otp) {
                    try {
                        const salt = await bcrypt.genSalt(10) // 10 times hashing to password
                        const hashPassword = await bcrypt.hash(user.password, salt)
                        let username = await this.usernameGenerate(email) // username generate dynamically

                        const doc = new UserModel({
                            username: username,
                            email: email,
                            password: hashPassword,
                            termAndCondition: user.termAndCondition,
                            userRole: user.userRole,
                            isDeleted: false
                        })
                        await doc.save()
                        const saved_user = await UserModel.findOne({ email: email }).select("-password")

                        await transporter.sendMail({
                            from: process.env.EMAIL_FROM,
                            to: user.email,
                            subject: "Registration successfully done - Ecommerce-Shopping-App",
                            html: `<h2>Your username is : ${username} </h2></br><p>Thanks for registration 😄🙏🙏🙏</p>`
                        })

                        // remove otp and mail to cache
                        cache_user.del(`user_${email}`)
                        cache_otp.del(`otp_${email}`)

                        res.status(201).send({
                            "status": 201, "message": "Seller registration done", "data": {
                                userId: saved_user._id,
                                username: username,
                                email: email,
                                termAndCondition: user.termAndCondition,
                                userRole: user.userRole
                            }
                        })
                    } catch (error) {
                        console.log(error)
                        res.status(500).send({ "status": "failed", "message": "Unable to Register" })
                        // ! 500 Internal Server Error for server errors during registration.
                    }
                } else {
                    res.status(400).send({ "status": 400, "message": "Otp is expired", "rootCause": "Session expired try again..." })
                    // ! 500 Internal Server Error for server errors during registration. 
                }
            } else {
                res.status(400).send({ "status": 400, "message": "Otp is expired", "rootCause": "Session expired try again..." })
                // ! 500 Internal Server Error for server errors during registration. 
            }
        } else {
            res.status(400).send({ "status": 400, "message": "All fields are required", "rootCause": "Please fill all fields properly..." })
            //! 400 Bad Request for missing fields or password mismatch.
        }


    }
    // ^---------------------------------------------------------------------------------------------------------
    static async usernameGenerate(email) {
        const str = email.split("@")
        let username = str[0]
        let temp = 0
        while (await UserModel.findOne({ username })) {
            username = `${str[0]}${temp}`
            temp++
        }
        return username
    }
    // ^---------------------------------------------------------------------------------------------------------
    static userLogin = async (req, res, next) => {
        let { username, password } = req.body
        if (username && password) {
            let user = await UserModel.findOne({ username })
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    try {
                        //^ Generate JWT Token
                        const refreshToken = jwt.sign({ userId: user._id, userRole: user.userRole }, process.env.JWT_SECRET_KEY, { expiresIn: '15d' })
                        res.cookie('rt', refreshToken, {
                            httpOnly: true,   // This flag makes the cookie inaccessible to JavaScript
                            secure: process.env.NODE_ENV === 'production' || "dev", // Secure flag for HTTPS in production
                            sameSite: 'strict',  // Helps prevent CSRF attacks or `Lax`
                            maxAge: 15 * 24 * 60 * 60 * 1000 // Token expires in 15 days
                        })
                        const accessToken = jwt.sign({ userId: user._id, userRole: user.userRole }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
                        res.cookie('at', accessToken, {
                            httpOnly: true,   // This flag makes the cookie inaccessible to JavaScript
                            secure: process.env.NODE_ENV === 'production' || "dev", // Secure flag for HTTPS in production
                            sameSite: 'strict',  // Helps prevent CSRF attacks or `Lax`
                            maxAge: 60 * 60 * 1000 // Token expires in 1 hours
                        })
                        res.status(200).send({
                            "status": 200, "message": "Login successfully done", "data": {
                                userId: user._id,
                                username: user.username,
                                userRole: user.userRole,
                                accessExpiration: 60 * 60,
                                refreshExpiration: 15 * 24 * 60 * 60
                            }
                        })
                    } catch (error) {
                        console.log(error)
                        res.status(500).send({ "status": 500, "message": "Unable to login", "rootCause": "Please fill correct information" })
                        // ! 500 Internal Server Error for server errors during registration.
                    }
                } else {
                    res.status(400).send({ "status": 400, "message": "Login failed", "rootCause": "User not validate" })
                    //! 400 Bad Request for missing fields or password mismatch. 
                }
            } else {
                res.status(400).send({ "status": 400, "message": "Login failed", "rootCause": "User not validate" })
                //! 400 Bad Request for missing fields or password mismatch.  
            }
        } else {
            res.status(400).send({ "status": 400, "message": "All fields are required", "rootCause": "Please fill all fields properly..." })
            //! 400 Bad Request for missing fields or password mismatch.
        }
    }
    // ^---------------------------------------------------------------------------------------------------------

    static loggedUser = async (req, res) => {
        // console.log(req.user)
        res.status(200).send({ "status": 200, "message": "User founded", "data": req.user })
    }
    // ^---------------------------------------------------------------------------------------------------------
    static resendOtp = async (req, resp) => {
        let { email } = req.body
        if (email) {
            const user = cache_user.get(`user_${email}`);
            if (user) {
                // Generate new otp
                let otp = Math.floor(100000 + Math.random() * 900000);
                // Store user and OTP in cache with separate keys
                const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
                const time = expirationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // ~ Set new otp
                cache_otp.set(`otp_${email}`, otp);

                // send mail with opt
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: user.email,
                    subject: "OTP - Ecommerce-Shopping-App",
                    html: `<h2>Your new otp is : ${otp} </h2></br><p>Otp will be expired after 5 minutes: ${time}</p>`
                })
                resp.status(202).send({
                    "status": 202, "message": "Otp re-sended", "data": {
                        userId: null,
                        username: null,
                        email: email,
                        termAndCondition: user.termAndCondition,
                        userRole: user.userRole
                    }
                })
            } else {
                resp.status(500).send({ status: 500, message: "Registration failed : Season expired", rootCause: "Please try again" })
            }
        } else {
            resp.status(400).send({ status: 400, message: "All fields are required", rootCause: "Registration failed" })
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static sendUserPasswordResetEmail = async (req, resp) => {
        let { email } = req.body
        if (email) {
            let user = await UserModel.findOne({ email: email })
            if (user) {

                const secret = user._id + process.env.JWT_SECRET_KEY
                const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '5m' })
                const link = `http://localhost:5173/reset-password/${user._id}/${token}`
                console.log("----------password reset link-----------")
                console.log(link)

                const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
                const time = expirationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                // send mail with opt
                await transporter.sendMail({
                    from: process.env.EMAIL_FROM,
                    to: user.email,
                    subject: "Password Reset - Ecommerce-Shopping-App",
                    html: `<h2>Click below link and set new password : 👇 </h2>
                      </br>
                      <p><a href=${link}>Click Here</a> to Reset Your Password</p>
                      </br>
                      <p>Link will be expire in ${time}</p>`
                })
                resp.status(200).send({ status: 200, message: "Password reset link sended", data: "Check your mail id" })
            } else {
                resp.status(400).send({ status: 400, message: "Invalid Email", rootCause: "User Not Exist" })
            }
        } else {
            resp.status(400).send({ status: 400, message: "All fields are required", rootCause: "Password reset failed" })
        }
    }
    // ^---------------------------------------------------------------------------------------------------------
    static userPasswordReset = async (req, res) => {
        const { password, password_confirmation, termAndCondition } = req.body
        const { id, token } = req.params
        const user = await UserModel.findById(id)
        if (user) {
            const new_secret = user._id + process.env.JWT_SECRET_KEY
            try {
                jwt.verify(token, new_secret)
                if (password && password_confirmation && termAndCondition) {
                    if (password !== password_confirmation) {
                        res.status(400).send({ status: 400, message: "New Password and Confirm New Password doesn't match", rootCause : "Please fill proper data" })
                    } else {
                        const salt = await bcrypt.genSalt(10)
                        const newHashPassword = await bcrypt.hash(password, salt)
                        await UserModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })
                        res.status(200).send({ status: 200, message: "Password Reset Successfully", data: "Login with new password" })
                    }
                } else {
                    res.status(400).send({ status: 400, message: "All Fields are Required", rootCause : "Password Reset Failed" })
                }
            } catch (error) {
                console.log(error)
                res.status(400).send({ status: 400, message: "Invalid Token", rootCause: "Password reset Link expired" })
            }
        } else {
            res.status(400).send({ status: 400, message: "Invalid User Id", rootCause : "User not exist" })
        }
    }
    // ^---------------------------------------------------------------------------------------------------------

}

export default UserController

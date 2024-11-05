import dotenv from 'dotenv'
dotenv.config()
import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  // port: process.env.EMAIL_PORT,
  port: 465, // try 465 or 2525
  secure: true, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER, // Admin Gmail ID
    pass: process.env.EMAIL_PASS, // Admin Gmail Password
  },
  // logger: true, // logs to console
  // debug: true   // include SMTP traffic in logs
})

export default transporter
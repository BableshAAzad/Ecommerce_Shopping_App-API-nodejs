import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import connectDB from "./config/connectdb.js"
import userRoutes from './routes/userRoutes.js'
// const userRoutes = require("./routes/userRoutes.js")

//! invoke dotenv
dotenv.config();

const app = express();
const port = process.env.PORT

const DATABASE_URL = process.env.DATABASE_URL
const DATABASE_NAME = process.env.DATABASE_NAME

//^ CORS Policy
app.use(cors())

//* Database Connection
connectDB(DATABASE_URL, DATABASE_NAME)

//& convert incoming data into JSON
app.use(express.json())

//~ Load Routes
app.use("/api/v1", userRoutes)

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})
import dotenv from "dotenv"
import express from "express"
import cors from "cors"
import connectDB from "./config/connectdb.js"
import userRoutes from './routes/userRoutes.js'
// const userRoutes = require("./routes/userRoutes.js")
import productRoutes from "./routes/productRoutes.js"
import bodyParser from 'body-parser';
import addressRoutes from "./routes/addressRoutes.js"
import contactRoutes from "./routes/contactRoutes.js"
import cartRoutes from "./routes/cartRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"

//! invoke dotenv
dotenv.config();

const app = express();
const port = process.env.PORT

const DATABASE_URL = process.env.DATABASE_URL
const DATABASE_NAME = process.env.DATABASE_NAME

//^ Define CORS options
const corsOptions = {
    origin: ["http://localhost:5173", "https://ecommerce.bableshaazad.com"], // specify allowed domains
    methods: ["GET", "POST", "PUT", "DELETE"], // specify allowed methods
    credentials: true, // if you want to enable cookies with CORS
    optionsSuccessStatus: 200 // some browsers (IE11) need this for compatibility
};
// Apply CORS with options
app.use(cors(corsOptions))


//* Database Connection
connectDB(DATABASE_URL, DATABASE_NAME)

//& convert incoming data into JSON &  Middleware for parsing request bodies
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));


//^ Middleware to catch JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error("Bad JSON format:", err.message);
        return res.status(400).json({ message: "Invalid JSON format" });
    }
    next();
});

//! General error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error" });
});

//~ Load Routes
app.use("/api/v1", userRoutes)
app.use("/api/v1", productRoutes)
app.use("/api/v1", addressRoutes)
app.use("/api/v1", contactRoutes)
app.use("/api/v1", cartRoutes)
app.use("/api/v1", orderRoutes)


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})
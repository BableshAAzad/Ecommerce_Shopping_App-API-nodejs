import mongoose from "mongoose";

const connectDB = async (DATABASE_URL, DATABASE_NAME) => {
    try {
        const DB_OPTIONS = {
            dbName: DATABASE_NAME,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };
        await mongoose.connect(DATABASE_URL, DB_OPTIONS);
        console.log('Connected to MongoDB successfully.');
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error; // Optional: re-throw if you want the caller to handle it
    }
};

export default connectDB;

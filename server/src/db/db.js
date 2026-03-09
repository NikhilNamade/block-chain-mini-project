import mongoose from "mongoose";

const connectTomongoose = async()=>{
    await mongoose.connect(process.env.MONGOOSE_URL)
    console.log("Connected to DB");
};

export default connectTomongoose;
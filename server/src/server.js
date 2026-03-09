import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import CERTIFICATE_ROUTE from "./routes/certificate.route.js"
import connectTomongoose from "./db/db.js";
connectTomongoose()
const app = express();

app.use(cors({
    origin:"*",
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}));

app.use(express.json());
app.use(express.urlencoded());

app.use("/server/api",CERTIFICATE_ROUTE);


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    statusCode,
  });
});

app.listen(3000,()=>{
    console.log('Server is running on port 3000');
})
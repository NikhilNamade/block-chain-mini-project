import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    course: {
      type: String,
      required: true,
    },
    ipfsHash: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
    },
    ipfsUrl: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;

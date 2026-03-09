import AppError from "../errorHandling/AppError.js";
import wrapAsync from "../errorHandling/wrapAsync.js";
import Certificate from "../model/certificate.js";
import pinataSDK from "@pinata/sdk";
import contract from "../utils/blockchain.js";
import streamifier from "streamifier";
import crypto from "crypto";
import axios from "axios";
import QRCode from "qrcode";
export const saveCertificateToDb = wrapAsync(async (req, res) => {
  const {
    certificateId,
    studentName,
    course,
    ipfsHash,
    txHash,
    ipfsUrl,
    fileHash,
  } = req.body;

  if (!studentName || !course || !ipfsHash || !txHash) {
    throw new AppError("All fields are required", 400);
  }

  const existingCertificate = await Certificate.findOne({ txHash });

  if (existingCertificate) {
    throw new AppError("Certificate already exists for this transaction", 409);
  }

  const certificate = await Certificate.create({
    certificateId,
    studentName,
    course,
    ipfsHash,
    txHash,
    ipfsUrl,
    fileHash,
  });

  res.status(201).json({
    success: true,
    message: "Certificate stored successfully",
    data: {
      id: certificate._id,
      studentName: certificate.studentName,
      course: certificate.course,
      ipfsHash: certificate.ipfsHash,
      txHash: certificate.txHash,
      fileHash: certificate.fileHash,
      createdAt: certificate.createdAt,
    },
  });
});

export const saveCertificateToIPFS = wrapAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError("No file uploaded", 400);
  }

  const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY,
  );

  const readableStream = streamifier.createReadStream(req.file.buffer);
  const options = {
    pinataMetadata: {
      name: req.file.originalname, // give your file a name
    },
    pinataOptions: {
      cidVersion: 1, // optional
    },
  };
  const result = await pinata.pinFileToIPFS(readableStream, options);

  const ipfsHash = result.IpfsHash;
  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  const fileHash = crypto
    .createHash("sha256")
    .update(req.file.buffer)
    .digest("hex");

  res.status(200).json({
    success: true,
    message: "File uploaded to IPFS successfully",
    ipfsHash: ipfsHash,
    ipfsUrl: ipfsUrl,
    fileHash: fileHash,
  });
});

export const saveCertificateToBlockChain = wrapAsync(async (req, res) => {
  const { certificateId, studentName, course, ipfsHash, fileHash } = req.body;

  if (!certificateId || !studentName || !course || !ipfsHash || !fileHash) {
    throw new AppError("All fields are required", 400);
  }

  // call smart contract
  const tx = await contract.issueCertificate(
    certificateId,
    studentName,
    course,
    ipfsHash,
    fileHash,
  );

  // wait for blockchain confirmation
  await tx.wait();

  const txHash = tx.hash;

  res.status(200).json({
    success: true,
    message: "Certificate stored on blockchain",
    txHash: txHash,
  });
});

export const verifyCertificate = wrapAsync(async (req, res) => {
  const { id } = req.params;

  const cert = await contract.verifyCertificate(id);

  const certificateId = cert[0];
  const studentName = cert[1];
  const course = cert[2];
  const ipfsHash = cert[3];
  const blockchainFileHash = cert[4];

  if (!certificateId) {
    throw new AppError("Certificate not found", 404);
  }

  const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  const response = await axios.get(ipfsUrl, {
    responseType: "arraybuffer",
  });

  const fileBuffer = Buffer.from(response.data);
  const generatedHash = crypto
    .createHash("sha256")
    .update(fileBuffer)
    .digest("hex");

  const isValid = generatedHash === blockchainFileHash;

if (!isValid) {
    return res.status(400).send("Certificate file has been tampered");
  }

  // ✅ Valid → open file directly
  return res.redirect(ipfsUrl);
});

export const generateCertificateQR = async (req, res) => {

  const { certificateId } = req.params;

  const verifyUrl = `http://localhost:5173/server/api/verify/${certificateId}`;

  try {

    const qrImage = await QRCode.toDataURL(verifyUrl);

    res.json({
      success: true,
      certificateId,
      qrImage
    });

  } catch (err) {

    res.status(500).json({
      success:false,
      message:"QR generation failed"
    });

  }

};
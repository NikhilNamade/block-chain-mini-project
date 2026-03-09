import express from "express";
import multer from "multer";
import {
  generateCertificateQR,
  saveCertificateToBlockChain,
  saveCertificateToDb,
  saveCertificateToIPFS,
  verifyCertificate,
} from "../controller/certificate.controller.js";
const route = express.Router();
const upload = multer();

//to save all data to db
route.post("/save", saveCertificateToDb);
route.post("/ipfs", upload.single("certificate"), saveCertificateToIPFS);
route.post("/blockchain", saveCertificateToBlockChain);
route.get("/verify/:id", verifyCertificate);
route.get("/qr/:certificateId", generateCertificateQR);
export default route;

import axios from "axios";
import { useState, useRef, useEffect } from "react";

const AdminWithModal = () => {
  const [formData, setFormData] = useState({
    certificateId: "",
    studentName: "",
    course: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewingFile, setViewingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files allowed");
      return;
    }

    const url = URL.createObjectURL(file);

    setSelectedFile(file);
    setFileUrl(url);
  };

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  const uploadCertificate = async () => {
    try {
      if (!selectedFile) {
        console.error("No file selected");
        return;
      }

      const formDataObj = new FormData();

      formDataObj.append("certificate", selectedFile);

      const response = await axios.post(
        "http://localhost:3000/server/api/ipfs",
        formDataObj,
      );

      console.log("API Response:", response.data);
      return {
        ipfsHash: response.data["ipfsHash"],
        ipfsUrl: response.data["ipfsUrl"],
        fileHash: response.data["fileHash"],
      };
    } catch (error) {
      if (error.response) {
        // Server responded with error
        console.error("Server Error:", error.response.data);
        console.error("Status:", error.response.status);
      } else if (error.request) {
        // Request made but no response
        console.error("No response from server:", error.request);
      } else {
        // Something else
        console.error("Error:", error.message);
      }
    }
  };

  const sendCertificateDataToBlockChain = async (ipfsHash, fileHash) => {
    try {
      const formDataObj = new FormData();
      console.log(formData.certificateId);
      formDataObj.append("certificateId", formData.certificateId);
      formDataObj.append("studentName", formData.studentName);
      formDataObj.append("course", formData.course);
      formDataObj.append("ipfsHash", ipfsHash);
      formDataObj.append("fileHash", fileHash);

      const response = await axios.post(
        "http://localhost:3000/server/api/blockchain",
        formDataObj,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("API Success Response:", response.data);
      return {
        txHash: response.data["txHash"],
      };
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        console.error("Server Error:");
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      } else if (error.request) {
        // Request made but no response
        console.error("No response from server:", error.request);
      } else {
        // Other errors
        console.error("Axios Error:", error.message);
      }
    }
  };

  const sendCertificateToDB = async ({
    ipfsHash,
    ipfsUrl,
    fileHash,
    txHash,
  }) => {
    try {
      const payload = {
        certificateId: formData.certificateId,
        studentName: formData.studentName,
        course: formData.course,
        ipfsHash,
        txHash,
        ipfsUrl,
        fileHash,
      };

      const response = await axios.post(
        "http://localhost:3000/server/api/save",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Certificate saved successfully:", response.data);
    } catch (error) {
      if (error.response) {
        console.error("Server Error:");
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      } else if (error.request) {
        console.error("No response from server:", error.request);
      } else {
        console.error("Error:", error.message);
      }

      throw error;
    }
  };

  const [qr, setQr] = useState("");

  const fetchQR = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/server/api/qr/${formData.certificateId}`);
      console.log(res.data['qrImage']);
      //const imageUrl = URL.createObjectURL(res.data['qrImage']);
      setQr(res.data['qrImage']);
    } catch (error) {
      console.error("Error fetching QR:", error);
    }
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qr;
    link.download = `${formData.certificateId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2200));
    const { ipfsHash, ipfsUrl, fileHash } = await uploadCertificate();
    if (!ipfsHash && !ipfsUrl) {
      console.log("Unable to save file to ipfs");
      return;
    }
    const { txHash } = await sendCertificateDataToBlockChain(ipfsHash);
    if (!ipfsHash && !ipfsUrl && !txHash) {
      console.log("Unable to save file to ipfs");
      return;
    }
    await sendCertificateToDB({ ipfsHash, ipfsUrl, fileHash, txHash });
    await fetchQR();
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const isFormValid =
    formData.certificateId &&
    formData.studentName &&
    formData.course &&
    selectedFile;

  return (
    <div
      className="h-screen w-screen bg-[#080810] text-white overflow-hidden flex flex-col"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {/* Ambient FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-96 h-96 rounded-full bg-cyan-500/6 blur-[100px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/6 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-3 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
            <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.7)]" />
            <span className="w-2 h-2 rounded-full bg-slate-700" />
          </div>
          <span className="text-[10px] text-slate-600 tracking-widest uppercase">
            admin.panel · v2.4.1
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-[10px] text-emerald-400 tracking-widest">
            CHAIN CONNECTED
          </span>
        </div>
      </div>

      {/* 2-col body */}
      <div className="relative z-10 flex flex-1 min-h-0">
        {/* LEFT */}
        <div className="w-[40%] flex flex-col justify-center px-10 py-6 border-r border-white/[0.04]">
          <p className="text-[10px] text-slate-600 tracking-[0.3em] uppercase mb-3">
            Blockchain Certificate System
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight mb-4">
            Certificate
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
              Registry
            </span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            Immutable certificate issuance secured on-chain. Fill in the student
            details and attach the certificate — the blockchain does the rest.
          </p>

          <div className="space-y-2 mb-6">
            {[
              { icon: "🔒", label: "Tamper-proof on-chain hash" },
              { icon: "⚡", label: "Instant verification globally" },
              { icon: "📄", label: "PDF anchored to transaction" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02]"
              >
                <span>{item.icon}</span>
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
            <p className="text-[10px] text-slate-600 tracking-widest uppercase mb-3">
              Network Status
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Network", val: "Polygon" },
                { label: "Gas", val: "~0.001 MATIC" },
                { label: "Block", val: "#58,241,990" },
                { label: "Latency", val: "12ms" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] text-slate-600 mb-0.5">{s.label}</p>
                  <p className="text-xs text-slate-300 font-semibold">
                    {s.val}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex items-center justify-center px-10 py-6">
          {qr ? (
            <div className="relative mt-6 border-t border-white/[0.05] pt-6 flex justify-center">
              <div className="relative">
                <img
                  src={qr}
                  alt="Certificate QR"
                  className="w-40 h-40 object-contain border border-white/[0.07] rounded-xl p-2 bg-white/[0.02]"
                />

                <button
                  onClick={downloadQR}
                  className="absolute -bottom-7 -right-7 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] px-3 py-1.5 rounded-lg hover:bg-cyan-500/30 transition-all"
                >
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full relative rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
              <div className="p-7 space-y-4">
                <p className="text-[10px] text-slate-600 tracking-[0.25em] uppercase">
                  Issue New Certificate
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 tracking-widest uppercase">
                    Certificate ID
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 text-xs">
                      #
                    </span>
                    <input
                      type="text"
                      name="certificateId"
                      value={formData.certificateId}
                      onChange={handleInputChange}
                      placeholder="CERT-2024-XXXXX"
                      className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl pl-7 pr-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all duration-200 tracking-wider"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 tracking-widest uppercase">
                    Student Name
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    placeholder="Full legal name"
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 tracking-widest uppercase">
                    Course / Event
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    placeholder="e.g. National Robotics Championship 2024"
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 tracking-widest uppercase">
                    Certificate PDF
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        if (selectedFile && fileUrl) {
                          setViewingFile(true);
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-300 flex-shrink-0
                      ${
                        selectedFile
                          ? "bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
                          : "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                      }`}
                    >
                      {selectedFile ? <>View File</> : <>Select File</>}
                    </button>

                    {selectedFile ? (
                      <span className="text-xs text-slate-400 truncate">
                        {selectedFile.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-700 italic">
                        No file selected
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/[0.05] pt-1" />

                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || submitting || submitted}
                  className={`w-full py-3.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase transition-all duration-300
                  ${
                    submitted
                      ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                      : isFormValid && !submitting
                        ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border border-cyan-500/40 text-white hover:from-cyan-500/25 hover:to-violet-500/25 hover:border-cyan-400/60"
                        : "bg-white/[0.02] border border-white/[0.05] text-slate-700 cursor-not-allowed"
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2.5">
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Writing to blockchain...
                    </span>
                  ) : submitted ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Certificate Issued Successfully
                    </span>
                  ) : (
                    "Issue Certificate on Chain"
                  )}
                </button>

                <p className="text-center text-[10px] text-slate-400">
                  Hash recorded immutably · No modifications post-submission
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PDF Modal */}
      {viewingFile && fileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          onClick={() => setViewingFile(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-lg" />
          <div
            className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl overflow-hidden"
            style={{ height: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="text-xs text-slate-300 truncate max-w-xs">
                {selectedFile?.name}
              </span>
              <button
                onClick={() => setViewingFile(false)}
                className="text-xs text-slate-500 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5"
              >
                Close
              </button>
            </div>
            <iframe
              src={fileUrl}
              className="w-full"
              style={{ height: "calc(100% - 49px)", border: "none" }}
              title="Certificate Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithModal;

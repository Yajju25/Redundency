import React, { useState } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [clearedMsg, setClearedMsg] = useState(false);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
    setResult(null);
    setError(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files || files.length < 2) {
      setError("Please select at least 2 files to compare.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("documents", files[i]);
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Could not connect to server. Is the Flask backend running?");
    }

    setLoading(false);
  };

  const handleClear = async () => {
    await fetch("http://127.0.0.1:5000/api/clear", { method: "POST" });
    setClearedMsg(true);
    setResult(null);
    setTimeout(() => setClearedMsg(false), 3000);
  };

  return (
    <div className="container">
      <h1>📄 Document Redundancy Detector</h1>
      <p className="subtitle">
        Upload multiple documents to detect duplicate or similar content using AI-based text analysis.
      </p>

      {clearedMsg && <div className="alert success">✅ Upload folder cleared.</div>}
      {error && <div className="alert">{error}</div>}

      <form onSubmit={handleUpload}>
        <div className="upload-box">
          <p><strong>Select 2 or more files</strong></p>
          <p style={{ fontSize: "13px", color: "#888" }}>Supported: PDF, DOCX, PPTX, TXT</p>
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.txt"
            onChange={handleFileChange}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "🔍 Check for Redundancy"}
        </button>
      </form>

      <button className="secondary-btn" onClick={handleClear}>
        🗑️ Clear Uploaded Files
      </button>

      {result && (
        <>
          {result.skipped && result.skipped.length > 0 && (
            <div className="alert">
              ⚠️ Skipped (no readable text): {result.skipped.join(", ")}
            </div>
          )}

          {result.report.length > 0 ? (
            <>
              <p className="subtitle" style={{ marginTop: "20px" }}>
                Compared {result.total} documents — found {result.report.length} matching pair(s):
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Document A</th>
                    <th>Document B</th>
                    <th>Similarity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.report.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.doc_a}</td>
                      <td>{row.doc_b}</td>
                      <td>{row.similarity}%</td>
                      <td className={row.status === "Exact/Near Duplicate" ? "status-dup" : "status-sim"}>
                        {row.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="subtitle" style={{ marginTop: "20px" }}>
              ✅ No redundant documents found — all files are sufficiently unique.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default App;
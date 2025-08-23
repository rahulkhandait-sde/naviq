import React, { useState } from "react";
import { Client, Storage, ID, Permission, Role } from "appwrite";

const FileUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1") // Your API Endpoint
    .setProject("689b5787003b4e752196"); // Your project ID

  const storage = new Storage(client);

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    try {
      setUploading(true);

      const result = await storage.createFile(
        "68a2407a000973202004", // ✅ Your bucket ID
        ID.unique(),           // Generate unique file ID
        file,                  // File from input
        [
          Permission.read(Role.any()),     // Anyone can read/download
          Permission.update(Role.users()), // Only logged-in users can update
          Permission.delete(Role.users()), // Only logged-in users can delete
        ]
      );

      setUploadedFile(result);
      console.log("Upload success:", result);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  // Generate preview/download URL
  const getFilePreviewUrl = (bucketId, fileId) => {
    return `${client.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${client.config.project}`;
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "10px" }}>
      <h2>Upload File to Appwrite</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        id="uploader"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          marginLeft: "10px",
          padding: "8px 16px",
          backgroundColor: uploading ? "#ccc" : "#4caf50",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: uploading ? "not-allowed" : "pointer",
        }}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {uploadedFile && (
        <div style={{ marginTop: "15px" }}>
          <p><strong>File uploaded successfully!</strong></p>
          <p>File ID: {uploadedFile.$id}</p>

          {/* ✅ Download/Preview link */}
          <a
            href={getFilePreviewUrl("68a2407a000973202004", uploadedFile.$id)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#007bff" }}
          >
            View / Download File
          </a>
        </div>
      )}
    </div>
  );
};

export default FileUploader;

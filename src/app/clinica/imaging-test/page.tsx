"use client";

import { useState } from "react";

export default function ImagingTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleUpload() {
    if (!file) {
      alert("Seleziona un file");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("animalId", "6fc6c1fb-ff03-45e4-ae8a-e787b2b1f5a5");
      formData.append("modality", "RX");
      formData.append("bodyPart", "torace");
      formData.append("description", "prova imaging");
      formData.append("visibility", "owner");
      formData.append("eventDate", new Date().toISOString());

      const res = await fetch("/api/clinic/imaging/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Test Upload Imaging</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br />
      <br />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Caricamento..." : "Carica file"}
      </button>

      <pre style={{ marginTop: 20 }}>
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  );
}
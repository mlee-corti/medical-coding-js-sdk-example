import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:3000/api';

function App() {
  const [interactionId, setInteractionId] = useState(null);
  const [recordingId, setRecordingId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [document, setDocument] = useState(null);
  const [codes, setCodes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [expandedCodes, setExpandedCodes] = useState(new Set());

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError('Failed to fetch templates: ' + err.message);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setError(null);
    }
  };

  const handleUploadRecording = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create interaction
      const interactionRes = await fetch(`${API_BASE_URL}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const interactionData = await interactionRes.json();
      setInteractionId(interactionData.interactionId);

      // Step 2: Upload recording
      const formData = new FormData();
      formData.append('audio', audioFile);

      const recordingRes = await fetch(
        `${API_BASE_URL}/interactions/${interactionData.interactionId}/recording`,
        {
          method: 'POST',
          body: formData
        }
      );
      const recordingData = await recordingRes.json();
      setRecordingId(recordingData.recordingId);

      setStep(2);
      setError(null);
    } catch (err) {
      setError('Failed to upload recording: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/interactions/${interactionId}/documents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordingId,
            primaryLanguage: 'en',
            templateKey: selectedTemplate,
            outputLanguage: 'en'
          })
        }
      );

      const documentData = await response.json();
      setDocument(documentData);
      setStep(3);
      setError(null);
    } catch (err) {
      setError('Failed to generate document: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictCodes = async () => {
    if (!document || !document.id) {
      setError('Document must be generated first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tools/coding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          maxCandidates: 5
        })
      });

      const codesData = await response.json();
      setCodes(codesData);
      setStep(4);
      setError(null);
    } catch (err) {
      setError('Failed to predict codes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInteractionId(null);
    setRecordingId(null);
    setSelectedTemplate('');
    setAudioFile(null);
    setDocument(null);
    setCodes(null);
    setError(null);
    setStep(1);
    setExpandedCodes(new Set());
  };

  const toggleCodeExpansion = (codeId) => {
    setExpandedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(codeId)) {
        newSet.delete(codeId);
      } else {
        newSet.add(codeId);
      }
      return newSet;
    });
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Medical Coding Assistant</h1>
        <p>Upload recordings, generate documents, and predict medical codes</p>
      </header>

      <div className="container">
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Step 1: Upload Recording */}
        <div className={`card ${step >= 1 ? 'active' : ''}`}>
          <div className="card-header">
            <h2>
              <span className="step-number">1</span>
              Upload Recording
            </h2>
            {step > 1 && <span className="badge">✓ Complete</span>}
          </div>
          <div className="card-body">
            <div className="file-input-wrapper">
              <input
                type="file"
                id="audio-file"
                accept="audio/*"
                onChange={handleFileSelect}
                disabled={step > 1}
              />
              <label htmlFor="audio-file" className={step > 1 ? 'disabled' : ''}>
                {audioFile ? audioFile.name : 'Choose audio file...'}
              </label>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleUploadRecording}
              disabled={!audioFile || loading || step > 1}
            >
              {loading && step === 1 ? 'Uploading...' : 'Upload Recording'}
            </button>
            {interactionId && (
              <p className="info-text">Interaction ID: {interactionId}</p>
            )}
            {recordingId && (
              <p className="info-text">Recording ID: {recordingId}</p>
            )}
          </div>
        </div>

        {/* Step 2: Choose Template */}
        <div className={`card ${step >= 2 ? 'active' : ''}`}>
          <div className="card-header">
            <h2>
              <span className="step-number">2</span>
              Choose Template
            </h2>
            {step > 2 && <span className="badge">✓ Complete</span>}
          </div>
          <div className="card-body">
            <select
              className="select-input"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={step < 2 || step > 2}
            >
              <option value="">Select a template...</option>
              {templates.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name || template.key}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 3: Generate Document */}
        <div className={`card ${step >= 2 ? 'active' : ''}`}>
          <div className="card-header">
            <h2>
              <span className="step-number">3</span>
              Generate Document
            </h2>
            {step > 3 && <span className="badge">✓ Complete</span>}
          </div>
          <div className="card-body">
            <button
              className="btn btn-primary"
              onClick={handleGenerateDocument}
              disabled={!selectedTemplate || loading || step < 2 || step > 3}
            >
              {loading && step === 2 ? 'Generating...' : 'Generate Document'}
            </button>
            {document && (
              <div className="result-box">
                <h3>Generated Document</h3>
                <p><strong>Document ID:</strong> {document.id}</p>
                <p><strong>Template:</strong> {document.name} ({document.templateRef})</p>
                <p><strong>Created:</strong> {new Date(document.createdAt).toLocaleString()}</p>
                
                {document.sections && document.sections.length > 0 && (
                  <div className="document-sections">
                    {document.sections.map((section, idx) => (
                      <div key={idx} className="document-section">
                        <h4>{section.name}</h4>
                        <div className="section-content">
                          {section.text ? (
                            <p>{section.text}</p>
                          ) : (
                            <p className="empty-section">No content</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Predict Codes */}
        <div className={`card ${step >= 3 ? 'active' : ''}`}>
          <div className="card-header">
            <h2>
              <span className="step-number">4</span>
              Predict Medical Codes
            </h2>
            {step > 4 && <span className="badge">✓ Complete</span>}
          </div>
          <div className="card-body">
            <button
              className="btn btn-primary"
              onClick={handlePredictCodes}
              disabled={!document || loading || step < 3}
            >
              {loading && step === 3 ? 'Predicting...' : 'Predict Codes'}
            </button>
            {codes && (
              <div className="result-box">
                <h3>Predicted Medical Codes</h3>
                
                {/* Highest Confidence Codes */}
                {codes.codes && codes.codes.length > 0 && (
                  <div className="codes-section">
                    <h4 className="codes-section-title">Highest Confidence Codes</h4>
                    <div className="codes-list">
                      {codes.codes.map((code, idx) => {
                        const codeId = `top-${idx}`;
                        const isExpanded = expandedCodes.has(codeId);
                        
                        return (
                          <div key={idx} className="code-item-wrapper">
                            <div 
                              className="code-item highlighted clickable"
                              onClick={() => toggleCodeExpansion(codeId)}
                            >
                              <span className="code-system">{code.system.toUpperCase()}</span>
                              <div className="code-details">
                                <span className="code-value">{code.code}</span>
                                <span className="code-description">{code.display}</span>
                              </div>
                              <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                            </div>
                            {isExpanded && code.evidences && code.evidences.length > 0 && (
                              <div className="evidence-section">
                                <h5>Evidence ({code.evidences.length})</h5>
                                {code.evidences.map((evidence, eIdx) => (
                                  <div key={eIdx} className="evidence-item">
                                    {evidence.text && <p className="evidence-text">{evidence.text}</p>}
                                    {evidence.source && (
                                      <span className="evidence-source">Source: {evidence.source}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Candidates */}
                {codes.candidates && codes.candidates.length > 0 && (
                  <div className="codes-section">
                    <h4 className="codes-section-title">All Candidates ({codes.candidates.length})</h4>
                    
                    {/* Group by system */}
                    {['icd10cm', 'icd10pcs', 'cpt'].map((system) => {
                      const systemCodes = codes.candidates.filter(c => c.system === system);
                      if (systemCodes.length === 0) return null;
                      
                      return (
                        <div key={system} className="code-group">
                          <h5 className="system-header">{system.toUpperCase()} ({systemCodes.length})</h5>
                          <div className="codes-list">
                            {systemCodes.map((code, idx) => {
                              const codeId = `${system}-${idx}`;
                              const isExpanded = expandedCodes.has(codeId);
                              
                              return (
                                <div key={idx} className="code-item-wrapper">
                                  <div 
                                    className="code-item clickable"
                                    onClick={() => toggleCodeExpansion(codeId)}
                                  >
                                    <div className="code-details">
                                      <span className="code-value">{code.code}</span>
                                      <span className="code-description">{code.display}</span>
                                    </div>
                                    <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                                  </div>
                                  {isExpanded && code.evidences && code.evidences.length > 0 && (
                                    <div className="evidence-section">
                                      <h5>Evidence ({code.evidences.length})</h5>
                                      {code.evidences.map((evidence, eIdx) => (
                                        <div key={eIdx} className="evidence-item">
                                          {evidence.text && <p className="evidence-text">{evidence.text}</p>}
                                          {evidence.source && (
                                            <span className="evidence-source">Source: {evidence.source}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Usage Info */}
                {codes.usageInfo && (
                  <p className="usage-info">
                    Credits consumed: {codes.usageInfo.creditsConsumed.toFixed(5)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {step > 1 && (
          <button className="btn btn-secondary reset-btn" onClick={handleReset}>
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
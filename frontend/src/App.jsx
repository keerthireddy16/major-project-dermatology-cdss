import React, { useState, useEffect, useRef } from 'react';
import './index.css';

const API_BASE = '/api';

// Helper to format softmax outputs accurately without implying clinical Bayesian certainty
const formatScoreLabel = (score) => {
  if (score === undefined || score === null) return '--';
  const val = Number(score);
  if (val >= 99.95) return '>99.9%';
  if (val <= 0.05 && val > 0) return '<0.1%';
  return `${val.toFixed(1)}%`;
};

export default function App() {
  // Navigation & Multi-step workflow state: 'home' | 'intake' | 'assessment' | 'explanation' | 'research'
  const [page, setPage] = useState('home');
  const [previousPage, setPreviousPage] = useState('home');

  // Backend & Benchmark state
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline'
  const [benchmarks, setBenchmarks] = useState([]);
  const [showSampleChooser, setShowSampleChooser] = useState(false);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState(null);

  // Intake & analysis state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Authoritative evaluation metrics state
  const [evalData, setEvalData] = useState(null);
  const [evalTab, setEvalTab] = useState('reproduced'); // 'reproduced' | 'presentation'

  const fileInputRef = useRef(null);

  // Initial load
  useEffect(() => {
    checkHealth();
    fetchBenchmarks();
    fetchEvaluationMetrics();
  }, []);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setBackendStatus(res.ok ? 'online' : 'offline');
    } catch {
      setBackendStatus('offline');
    }
  };

  const fetchBenchmarks = async () => {
    try {
      const res = await fetch(`${API_BASE}/benchmarks`);
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data);
      }
    } catch (err) {
      console.warn('Could not fetch benchmarks:', err);
    }
  };

  const fetchEvaluationMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/evaluation-metrics`);
      if (res.ok) {
        const data = await res.json();
        setEvalData(data);
      }
    } catch (err) {
      console.warn('Could not fetch evaluation metrics:', err);
    }
  };

  // Support hash navigation e.g. #home, #intake, #research, #assessment, #explanation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['home', 'intake', 'research'].includes(hash)) {
        setPage(hash);
      } else if (hash === 'assessment' && result) {
        setPage('assessment');
      } else if (hash === 'explanation' && result) {
        setPage('explanation');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [result]);

  const navigateTo = (targetPage) => {
    setPreviousPage(page);
    setPage(targetPage);
    window.location.hash = targetPage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartOver = () => {
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setSelectedBenchmarkId(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowSampleChooser(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    navigateTo('home');
  };

  const handleNewAssessment = () => {
    setResult(null);
    setError(null);
    setSelectedFile(null);
    setSelectedBenchmarkId(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setShowSampleChooser(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    navigateTo('intake');
  };

  // Drag and drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file) return;

    // Immediately discard any previous prediction or error to prevent stale results
    setResult(null);
    setError(null);
    setSelectedBenchmarkId(null);

    // Format check
    const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const name = file.name || '';
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      setError(`Unsupported file format ("${ext || 'unknown'}"). Please upload a dermoscopic image in JPEG, PNG, or WEBP format.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Size check
    if (file.size > 10 * 1024 * 1024) {
      setError(`Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB maximum limit.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSelectSample = (sampleId) => {
    setResult(null);
    setError(null);
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedBenchmarkId(sampleId);
    setShowSampleChooser(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !selectedBenchmarkId) {
      setError('Please select or upload a lesion image before proceeding.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let res;
      if (selectedBenchmarkId) {
        res = await fetch(`${API_BASE}/predict-benchmark/${selectedBenchmarkId}`, {
          method: 'POST',
        });
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await fetch(`${API_BASE}/predict`, {
          method: 'POST',
          body: formData,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail?.message || data.detail || 'Lesion analysis failed.';
        setError(msg);
        setResult(null);
      } else {
        setResult(data);
        navigateTo('assessment');
      }
    } catch (err) {
      setError(`Backend Service Unavailable: Could not communicate with the neural analysis engine. (${err.message})`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    window.print();
  };

  // Derive current authoritative evaluation data
  const currentMetrics = result?.evaluation_context || evalData;
  const isReproduced = evalTab === 'reproduced';
  const activeRun = isReproduced
    ? currentMetrics?.reproduced_baseline
    : currentMetrics?.presentation_review;
  const cm = activeRun?.confusion_matrix || (isReproduced ? currentMetrics?.reproduced_confusion_matrix : currentMetrics?.presentation_confusion_matrix);

  return (
    <div className="app-shell">
      {/* Top Editorial Navigation */}
      <header className="top-nav">
        <div className="nav-inner">
          <button id="btn-brand-home" type="button" className="brand-button" onClick={() => navigateTo('home')}>
            <span className="brand-name">DermAI</span>
            <span className="brand-tag">Research System</span>
          </button>

          <nav className="nav-links">
            <button
              id="nav-overview"
              type="button"
              className={`nav-link-btn ${page === 'home' ? 'active' : ''}`}
              onClick={() => navigateTo('home')}
            >
              Overview
            </button>
            <button
              id="nav-new-assessment"
              type="button"
              className={`nav-link-btn ${page === 'intake' || page === 'assessment' || page === 'explanation' ? 'active' : ''}`}
              onClick={handleNewAssessment}
            >
              New Assessment
            </button>
            <button
              id="nav-research"
              type="button"
              className={`nav-link-btn ${page === 'research' ? 'active' : ''}`}
              onClick={() => navigateTo('research')}
            >
              Research & Metrics
            </button>
          </nav>
        </div>
      </header>

      {/* Workflow Progress Bar (Visible during multi-step assessment flow) */}
      {(page === 'intake' || page === 'assessment' || page === 'explanation') && (
        <div className="workflow-progress-wrapper no-print">
          <div className="workflow-progress-inner">
            <div className="progress-steps">
              <div className={`progress-step-item ${page === 'intake' ? 'active' : 'completed'}`}>
                <span className="step-num-circle">1</span>
                <span>Image Intake</span>
              </div>
              <div className="step-divider"></div>
              <div className={`progress-step-item ${page === 'assessment' ? 'active' : page === 'explanation' ? 'completed' : ''}`}>
                <span className="step-num-circle">2</span>
                <span>Model Assessment</span>
              </div>
              <div className="step-divider"></div>
              <div className={`progress-step-item ${page === 'explanation' ? 'active' : ''}`}>
                <span className="step-num-circle">3</span>
                <span>Explainable AI (Grad-CAM)</span>
              </div>
            </div>

            <button type="button" className="step-action-startover" onClick={handleStartOver}>
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {/* ===================================================================
            PRINT-ONLY FORMAL RESEARCH SUMMARY REPORT
            =================================================================== */}
        {result && (
          <div className="print-only print-header">
            <h1>DermAI Clinical Decision Support System</h1>
            <p style={{ fontSize: '10pt', color: '#536B5E', margin: '3px 0 8px' }}>
              Preliminary Dermatological Lesion Assessment Report • Research Prototype
            </p>
            <div className="print-meta-grid">
              <div><strong>Evaluation ID:</strong> <code>CDSS-{result.filename}</code></div>
              <div><strong>Report Timestamp:</strong> {result.timestamp ? new Date(result.timestamp).toLocaleString() : new Date().toLocaleString()}</div>
              <div><strong>Input Resolution:</strong> {result.validation?.width} × {result.validation?.height} px ({result.validation?.image_format})</div>
              <div><strong>Quality Screen:</strong> Laplacian Variance {result.quality_screen?.sharpness_score?.toFixed(2)} ({result.quality_screen?.quality_status})</div>
              <div><strong>Model Output Score:</strong> {result.prediction?.predicted_class} ({result.prediction?.predicted_class === 'Malignant' ? formatScoreLabel(result.prediction?.malignant_score) : formatScoreLabel(result.prediction?.benign_score)}, uncalibrated softmax)</div>
              <div><strong>Authoritative Test Benchmark:</strong> Acc {result.evaluation_context?.accuracy ?? 88.38}% | Sensitivity {result.evaluation_context?.malignant_recall ?? 71.46}% (N=2,314 test set)</div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PAGE 1: HOME
            =================================================================== */}
        {page === 'home' && (
          <section className="home-view" aria-label="Overview">
            <div className="home-hero-card">
              <div className="home-eyebrow">Clinical Decision Support Prototype</div>
              <h1 className="home-headline">
                Preliminary skin lesion screening with explainable deep learning.
              </h1>
              <p className="home-description">
                DermAI assists clinical researchers and students in evaluating dermoscopic images. 
                Using a lightweight EfficientNet-B0 backbone paired with Grad-CAM visual feature attribution, 
                the system analyzes lesion patterns while maintaining clear clinical boundaries.
              </p>

              <div className="home-cta-group">
                <button
                  id="btn-start-assessment"
                  type="button"
                  className="btn-primary"
                  onClick={() => navigateTo('intake')}
                >
                  Start assessment →
                </button>
                <button
                  id="btn-view-research-home"
                  type="button"
                  className="btn-ghost"
                  onClick={() => navigateTo('research')}
                >
                  View research methodology & test metrics →
                </button>
              </div>

              <div className="disclaimer-card" role="note">
                <strong>Essential Research Notice:</strong> DermAI is an experimental academic prototype developed for 
                decision-support research. It is not a licensed diagnostic device and cannot substitute for clinical examination 
                or histopathological biopsy. A benign output score never rules out malignancy.
              </div>
            </div>

            <div className="home-features-grid">
              <div className="feature-pill-card">
                <div className="feature-pill-title">Standardized Intake</div>
                <div className="feature-pill-desc">
                  Strict format, dimension, and Laplacian variance screening to ensure valid dermoscopic inputs.
                </div>
              </div>
              <div className="feature-pill-card">
                <div className="feature-pill-title">Neural Pattern Recognition</div>
                <div className="feature-pill-desc">
                  EfficientNet-B0 trained on confirmed HAM10000 lesions with group-stratified splitting.
                </div>
              </div>
              <div className="feature-pill-card">
                <div className="feature-pill-title">Visual Attribution</div>
                <div className="feature-pill-desc">
                  Grad-CAM heatmaps highlight receptive field activations without fabricating medical diagnostic claims.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            PAGE 2: IMAGE INTAKE
            =================================================================== */}
        {page === 'intake' && (
          <section className="intake-view" aria-label="Image Intake">
            <div className="page-header">
              <div className="page-category-tag">Step 1 • Lesion Intake</div>
              <h2 className="page-title">Submit Dermoscopic Image</h2>
              <p className="page-lead">
                Upload a standardized dermoscopic photograph of a pigmented skin lesion to initiate neural analysis.
              </p>
            </div>

            <div className="content-card">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelected(e.target.files[0]);
                  }
                }}
              />

              {/* Upload Drag & Drop Zone */}
              <div
                className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className="dropzone-icon" aria-hidden="true">📁</div>
                <div className="dropzone-text">
                  {selectedFile ? 'Replace selected file' : 'Drag lesion photograph here, or browse files'}
                </div>
                <div className="dropzone-subtext">
                  Supports JPEG, PNG, and WEBP • Maximum file size 10 MB
                </div>
              </div>

              {/* File Selected Indicator */}
              {selectedFile && (
                <div className="selected-file-preview">
                  <div>
                    <div className="file-info-name">{selectedFile.name}</div>
                    <div className="file-info-meta">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Ready for neural analysis
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Benchmark Sample Selected Indicator */}
              {selectedBenchmarkId && !selectedFile && (
                <div className="selected-file-preview">
                  <div>
                    <div className="file-info-name">Verified Benchmark: {selectedBenchmarkId}</div>
                    <div className="file-info-meta">
                      Reference lesion sample from HAM10000 independent test set
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBenchmarkId(null);
                    }}
                  >
                    Clear sample
                  </button>
                </div>
              )}

              {/* Validation Error Banner */}
              {error && (
                <div className="error-notice" role="alert">
                  <strong>Intake Notice:</strong> {error}
                </div>
              )}

              {/* Image Quality Checklist */}
              <div className="quality-checklist-card">
                <div className="quality-checklist-title">Image Quality Checklist</div>
                <ul className="quality-checklist-list">
                  <li>Standard dermoscopic magnification (macro dermatoscope attachment).</li>
                  <li>Lesion centered within the frame with minimal hair or glare obstruction.</li>
                  <li>Resolution of at least 100 × 100 pixels (system resizes to 224 × 224).</li>
                </ul>
              </div>

              {/* Optional Sample Image Toggle */}
              <div className="sample-toggle-area">
                <span style={{ fontSize: '0.86rem', color: '#536B5E' }}>
                  Do not have a dermoscopic photograph?
                </span>
                <button
                  id="btn-sample-toggle"
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '0.84rem', padding: '0.45rem 0.9rem' }}
                  onClick={() => setShowSampleChooser(!showSampleChooser)}
                >
                  {showSampleChooser ? 'Close sample chooser' : 'Try a verified sample image'}
                </button>
              </div>

              {/* Sample Chooser Panel */}
              {showSampleChooser && (
                <div className="sample-drawer">
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#283C32', marginBottom: '0.4rem' }}>
                    Select a Verified Benchmark Lesion:
                  </div>
                  <div className="sample-grid">
                    {benchmarks.map((sample) => (
                      <div
                        key={sample.id}
                        id={`sample-${sample.id.replace('.jpg', '')}`}
                        className={`sample-item-card ${selectedBenchmarkId === sample.id ? 'selected' : ''}`}
                        onClick={() => handleSelectSample(sample.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="sample-item-name">{sample.name}</div>
                        <div className="sample-item-desc">{sample.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Row */}
              <div className="button-row">
                <button
                  id="btn-analyze-lesion"
                  type="button"
                  className="btn-primary"
                  disabled={loading || (!selectedFile && !selectedBenchmarkId)}
                  onClick={handleAnalyze}
                >
                  {loading ? 'Analyzing image...' : 'Analyze lesion →'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigateTo('home')}
                >
                  ← Back to overview
                </button>
              </div>
            </div>

            {loading && (
              <div className="loading-box">
                <div className="loading-spinner-sage"></div>
                <div style={{ fontWeight: 600, color: '#283C32', marginBottom: '0.25rem' }}>
                  Processing neural inference...
                </div>
                <div style={{ fontSize: '0.84rem', color: '#536B5E' }}>
                  Applying validation checks, Laplacian sharpness screening, and Grad-CAM feature attribution.
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================================================================
            PAGE 3: ASSESSMENT
            =================================================================== */}
        {page === 'assessment' && result && (
          <section className="assessment-view" aria-label="Model Assessment">
            <div className="page-header">
              <div className="page-category-tag">Step 2 • Preliminary Assessment</div>
              <h2 className="page-title">Automated Lesion Assessment</h2>
              <p className="page-lead">
                Preliminary pattern analysis generated by the EfficientNet-B0 neural model.
              </p>
            </div>

            <div className="assessment-layout">
              {/* Left Column: Submitted Image Preview & Geometry */}
              <div className="lesion-preview-card">
                <div className="card-title" style={{ fontSize: '1.05rem', marginBottom: '0.6rem' }}>Submitted Lesion</div>
                <div className="lesion-img-wrapper">
                  <img
                    src={result.preview_image || previewUrl}
                    alt="Submitted dermoscopic lesion"
                  />
                </div>

                <table className="lesion-meta-table">
                  <tbody>
                    <tr>
                      <td>Identifier</td>
                      <td><code>{result.filename}</code></td>
                    </tr>
                    <tr>
                      <td>Dimensions</td>
                      <td>{result.validation?.width} × {result.validation?.height} px</td>
                    </tr>
                    <tr>
                      <td>Format</td>
                      <td>{result.validation?.image_format}</td>
                    </tr>
                    <tr>
                      <td>Detail Score</td>
                      <td>Laplacian {result.quality_screen?.sharpness_score?.toFixed(1)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Column: Model Output & Responsible Framing */}
              <div className="assessment-details-pane">
                {/* Finding Banner */}
                <div className={`finding-banner ${result.prediction?.is_concerning ? 'concerning' : 'benign'}`}>
                  <div className="finding-status-label">
                    {result.prediction?.is_concerning ? 'Concerning Observation' : 'Benign Observation'}
                  </div>
                  <div className="finding-heading">
                    {result.prediction?.is_concerning
                      ? 'Concerning Dermoscopic Features'
                      : 'Predominantly Benign Patterns'}
                  </div>
                  <p className="finding-plain-text">
                    {result.prediction?.is_concerning
                      ? `Model features exhibit high pattern similarity to malignant lesions in the reference dataset (Malignant Output Score: ${formatScoreLabel(result.prediction?.malignant_score)}, uncalibrated softmax).`
                      : `Model features exhibit predominant similarity to benign lesions in the reference dataset (Benign Output Score: ${formatScoreLabel(result.prediction?.benign_score)}, uncalibrated softmax).`}
                  </p>
                </div>

                {/* Vital Limitation Precaution */}
                <div className="vital-limitation-box">
                  <strong>Vital Clinical Precaution:</strong> A benign model score does NOT rule out skin malignancy or 
                  early-stage melanoma. In independent test evaluation, 123 of 431 malignant lesions (28.5%) scored as benign 
                  under standard thresholds. Any lesion that changes, bleeds, or presents atypical borders must be examined in person.
                </div>

                {/* Responsible Next-Step Guidance */}
                <div className="guidance-box">
                  <div className="guidance-title">Responsible Next Steps</div>
                  <p className="guidance-text">
                    {result.clinical_guidance}
                  </p>
                </div>

                {/* Action Controls */}
                <div className="button-row">
                  <button
                    id="btn-view-explanation"
                    type="button"
                    className="btn-primary"
                    onClick={() => navigateTo('explanation')}
                  >
                    View explanation (Grad-CAM) →
                  </button>
                  <button
                    id="btn-export-report-assessment"
                    type="button"
                    className="btn-secondary"
                    onClick={handleExportReport}
                  >
                    Export research report
                  </button>
                  <button
                    id="btn-new-assessment"
                    type="button"
                    className="btn-secondary"
                    onClick={handleNewAssessment}
                  >
                    Evaluate another image
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            PAGE 4: EXPLANATION (Grad-CAM)
            =================================================================== */}
        {page === 'explanation' && result && (
          <section className="explanation-view" aria-label="Visual Explanation">
            <div className="page-header">
              <div className="page-category-tag">Step 3 • Feature Attribution</div>
              <h2 className="page-title">Explainable AI (Grad-CAM)</h2>
              <p className="page-lead">
                Spatial feature attribution heatmaps visualizing receptive fields that influenced the model's output score.
              </p>
            </div>

            {/* 3-Panel Visual Comparison Grid */}
            {result.explainable_ai && result.explainable_ai.overlay_image && (
              <div className="explanation-trio-grid">
                <div className="trio-card">
                  <div className="trio-title">1. Original Lesion</div>
                  <div className="trio-img-frame">
                    <img src={result.explainable_ai.input_image} alt="Original normalized input" />
                  </div>
                  <div className="trio-caption">224 × 224 normalized dermoscopy</div>
                </div>

                <div className="trio-card">
                  <div className="trio-title">2. Activation Heatmap</div>
                  <div className="trio-img-frame">
                    <img src={result.explainable_ai.heatmap_image} alt="Grad-CAM activation heatmap" />
                  </div>
                  <div className="trio-caption">Last convolutional layer gradients</div>
                </div>

                <div className="trio-card">
                  <div className="trio-title">3. Superimposed Overlay</div>
                  <div className="trio-img-frame">
                    <img src={result.explainable_ai.overlay_image} alt="Superimposed heatmap on lesion" />
                  </div>
                  <div className="trio-caption">Receptive field anatomical correlation</div>
                </div>
              </div>
            )}

            {/* Scientific Explanation Note */}
            <div className="explanation-guidance-card">
              <strong>Understanding this visualization:</strong> Grad-CAM highlights image regions where the neural 
              gradients of the predicted class score were highest. Warm yellow and red hues indicate pixels that contributed 
              most strongly to the mathematical score. This visualization reflects statistical feature attribution, not 
              biological or pathological diagnosis.
            </div>

            {/* Collapsible Technical Details */}
            <details className="technical-collapsible">
              <summary>Detailed Model Scores & Technical Parameters</summary>
              <div className="technical-collapsible-content">
                <p style={{ marginBottom: '0.4rem' }}>
                  <strong>Neural Backbone:</strong> EfficientNet-B0 (last conv feature map: 7 × 7 × 1280)
                </p>
                <p style={{ marginBottom: '0.4rem' }}>
                  <strong>Model Output Scores:</strong> Benign: {formatScoreLabel(result.prediction?.benign_score)} • Malignant: {formatScoreLabel(result.prediction?.malignant_score)} (uncalibrated softmax)
                </p>
                <p style={{ marginBottom: '0.4rem' }}>
                  <strong>Classification Threshold:</strong> Standard argmax (threshold 0.50)
                </p>
                <p>
                  <strong>Note on Uncalibrated Probabilities:</strong> Model scores are softmax outputs from cross-entropy loss, 
                  not calibrated clinical Bayesian disease likelihoods.
                </p>
              </div>
            </details>

            {/* Actions Row */}
            <div className="button-row">
              <button
                id="btn-back-to-assessment"
                type="button"
                className="btn-secondary"
                onClick={() => navigateTo('assessment')}
              >
                ← Back to assessment
              </button>
              <button
                id="btn-view-research-explanation"
                type="button"
                className="btn-primary"
                onClick={() => navigateTo('research')}
              >
                View research details & metrics →
              </button>
              <button
                id="btn-export-report-explanation"
                type="button"
                className="btn-secondary"
                onClick={handleExportReport}
              >
                Export research report
              </button>
            </div>
          </section>
        )}

        {/* ===================================================================
            PAGE 5: RESEARCH & EVALUATION DETAILS
            =================================================================== */}
        {page === 'research' && (
          <section className="research-view" aria-label="Research & Metrics">
            <div className="page-header">
              <div className="page-category-tag">Scientific Documentation</div>
              <h2 className="page-title">Research Methodology & Test Metrics</h2>
              <p className="page-lead">
                Documented dataset composition, neural training configuration, and authoritative independent evaluation metrics.
              </p>
            </div>

            {/* Section 1: Architecture & Dataset */}
            <div className="content-card">
              <div className="card-title">1. Neural Architecture & Dataset Stratification</div>
              <p className="card-subtitle">
                Trained on confirmed dermoscopic skin lesions from the benchmark HAM10000 collection.
              </p>

              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: '#536B5E', lineHeight: 1.65 }}>
                <li><strong>Network Backbone:</strong> Pretrained EfficientNet-B0 fine-tuned with modified classification head (1,280 → 2).</li>
                <li><strong>Class Mapping:</strong> Class 0 = Benign (nv, bkl, df, vasc), Class 1 = Malignant (mel, bcc, akiec).</li>
                <li><strong>Lesion-Aware Splitting:</strong> StratifiedGroupKFold (5 splits, random_state=42) grouped by patient <code>lesion_id</code> to prevent data leakage.</li>
                <li><strong>Dataset Distribution:</strong> Training split: 6,943 images • Validation split: 2,314 images • Held-out Test split: 2,314 images.</li>
                <li><strong>Loss Function:</strong> Class-weighted Cross-Entropy Loss to counter diagnostic class imbalance.</li>
              </ul>
            </div>

            {/* Section 2: Authoritative Independent Test Metrics */}
            <div className="content-card">
              <div className="card-title">2. Authoritative Independent Test Evaluation (2,314 Images)</div>
              <p className="card-subtitle">
                Performance evaluated on the held-out test split (1,883 Benign, 431 Malignant).
              </p>

              {/* Operating Run Selector Toggle */}
              <div className="eval-tabs-group">
                <button
                  id="tab-eval-reproduced"
                  type="button"
                  className={`eval-tab-btn ${isReproduced ? 'active' : ''}`}
                  onClick={() => setEvalTab('reproduced')}
                >
                  Authoritative Reproducible Baseline (0.50 Argmax)
                </button>
                <button
                  id="tab-eval-presentation"
                  type="button"
                  className={`eval-tab-btn ${!isReproduced ? 'active' : ''}`}
                  onClick={() => setEvalTab('presentation')}
                >
                  Project Review Run (~0.31 Sensitivity-Weighted)
                </button>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#536B5E', marginBottom: '0.5rem' }}>
                <strong>Decision Rule:</strong> {activeRun?.threshold_type || (isReproduced ? 'Standard argmax (P >= 0.50)' : 'Sensitivity-weighted (~0.31)')}
              </div>

              {/* Confusion Matrix Table */}
              <table className="cm-data-table">
                <thead>
                  <tr>
                    <th>Actual \ Predicted</th>
                    <th>Predicted Benign (0)</th>
                    <th>Predicted Malignant (1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>True Benign (1,883)</strong></td>
                    <td className="cm-cell-highlight">{cm?.tn?.toLocaleString() ?? (isReproduced ? '1,737' : '1,635')} (TN)</td>
                    <td>{cm?.fp?.toLocaleString() ?? (isReproduced ? '146' : '248')} (FP)</td>
                  </tr>
                  <tr>
                    <td><strong>True Malignant (431)</strong></td>
                    <td className="cm-cell-fn">{cm?.fn?.toLocaleString() ?? (isReproduced ? '123' : '65')} (FN)</td>
                    <td className="cm-cell-highlight">{cm?.tp?.toLocaleString() ?? (isReproduced ? '308' : '366')} (TP)</td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Metrics List */}
              <ul className="metrics-summary-list">
                <li>
                  <span>Overall Accuracy</span>
                  <strong>{activeRun?.accuracy ?? (isReproduced ? 88.38 : 86.47)}%</strong>
                </li>
                <li>
                  <span>Malignant Sensitivity (Recall)</span>
                  <strong>{activeRun?.malignant_recall ?? (isReproduced ? 71.46 : 84.92)}%</strong>
                </li>
                <li>
                  <span>Malignant Precision</span>
                  <strong>{activeRun?.malignant_precision ?? (isReproduced ? 67.84 : 59.61)}%</strong>
                </li>
                <li>
                  <span>Malignant F1-Score</span>
                  <strong>{activeRun?.malignant_f1 ?? (isReproduced ? 69.60 : 70.05)}%</strong>
                </li>
                <li>
                  <span>Benign Specificity</span>
                  <strong>{activeRun?.benign_specificity ?? (isReproduced ? 92.25 : 86.83)}%</strong>
                </li>
                <li>
                  <span>False Negative Count</span>
                  <strong style={{ color: '#A34848' }}>{activeRun?.false_negative_count ?? (isReproduced ? 123 : 65)} cases</strong>
                </li>
              </ul>

              {/* Discrepancy Audit Resolution Banner */}
              <div className="audit-resolution-banner">
                <strong>Discrepancy Audit Resolution:</strong> Both reported metric records evaluate the identical 
                2,314 test images in <code>test.csv</code> against <code>best_model.pth</code> with class 0=Benign and 1=Malignant. 
                The numerical difference stems solely from the classification operating threshold: standard argmax (0.50) yields 
                88.38% Accuracy and 71.46% Recall (123 false negatives), whereas the sensitivity-weighted operating point (~0.31) from 
                the project review presentation yields 86.47% Accuracy and 84.92% Recall (65 false negatives) by accepting more false alarms (248 vs 146).
              </div>
            </div>

            {/* Section 3: Scientific Limitations & Scope */}
            <div className="content-card">
              <div className="card-title">3. Scientific Scope & Verified Clinical Boundaries</div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: '#536B5E', lineHeight: 1.65 }}>
                <li><strong>Normal Healthy Skin Limitation:</strong> The neural model was trained strictly on verified dermoscopic lesions. It is unvalidated on healthy skin, which causes forced artificial predictions.</li>
                <li><strong>Imaging Standard:</strong> Calibrated exclusively for dermoscopic magnification; consumer smartphone photos are not calibrated.</li>
                <li><strong>Diagnostic Scope:</strong> Decision-support research prototype only; not an approved clinical medical device.</li>
              </ul>
            </div>

            {/* Actions Row */}
            <div className="button-row">
              <button
                type="button"
                className="btn-primary"
                onClick={handleNewAssessment}
              >
                Start new assessment →
              </button>
              {result && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigateTo('assessment')}
                >
                  ← Back to current assessment
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigateTo('home')}
              >
                ← Back to overview
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Compact Subtle Footer */}
      <footer className="app-footer">
        <p>DermAI · Intelligent Skin Lesion Analysis</p>
      </footer>
    </div>
  );
}

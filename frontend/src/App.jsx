import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import {
  CLINICAL_TRANSLATIONS,
  playVoiceSpeech,
  pauseVoiceSpeech,
  resumeVoiceSpeech,
  stopVoiceSpeech,
  isLanguageVoiceSupported,
  getAvailableVoices,
} from './clinicalTranslations';
import prototypeSamples from './prototypeSamples.json';

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

  // Multilingual & Voice output state (Listen, Pause, Stop)
  const [selectedLang, setSelectedLang] = useState('en');
  const [translateWholePage, setTranslateWholePage] = useState(false);
  const [playbackState, setPlaybackState] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [availableVoices, setAvailableVoices] = useState([]);

  // Authoritative evaluation metrics state
  const [evalData, setEvalData] = useState(null);
  const [evalTab, setEvalTab] = useState('reproduced'); // 'reproduced' | 'presentation'

  const fileInputRef = useRef(null);

  // Initial load & voice availability detection
  useEffect(() => {
    checkHealth();
    fetchBenchmarks();
    fetchEvaluationMetrics();

    const updateVoices = () => {
      setAvailableVoices(getAvailableVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      stopVoiceSpeech();
    };
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
    handleStopSpeech();
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
    handleStopSpeech();
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

  const handleStopSpeech = () => {
    stopVoiceSpeech();
    setPlaybackState('idle');
  };

  const handleStartSpeech = (text, useEnglishFallback = false, fallbackCaseKey = 'caseA') => {
    stopVoiceSpeech();
    const started = playVoiceSpeech(
      text,
      useEnglishFallback ? 'en' : selectedLang,
      () => setPlaybackState('playing'),
      () => setPlaybackState('idle'),
      () => setPlaybackState('idle'),
      useEnglishFallback,
      fallbackCaseKey
    );
    if (started) {
      setPlaybackState('playing');
    }
  };

  const handlePauseSpeech = () => {
    pauseVoiceSpeech();
    setPlaybackState('paused');
  };

  const handleResumeSpeech = () => {
    resumeVoiceSpeech();
    setPlaybackState('playing');
  };

  const handleSelectLanguage = (langKey) => {
    handleStopSpeech();
    setSelectedLang(langKey);
  };

  const handleLaunchPrototype = (sampleKey = 'benign') => {
    handleStopSpeech();
    const mockData = prototypeSamples[sampleKey] || prototypeSamples.benign;
    setResult(mockData);
    setError(null);
    setSelectedFile(null);
    setSelectedBenchmarkId(mockData.filename);
    setPreviewUrl(mockData.preview_image);
    navigateTo('assessment');
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
    setSelectedBenchmarkId(sampleId);
    setPreviewUrl(`/samples/${sampleId}`);
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
            <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem', paddingLeft: '0.75rem', borderLeft: '1px solid #E2E8F0', fontSize: '0.78rem', color: '#64748B' }}>
              <span>⚙️ Language: <strong style={{ color: '#0F766E' }}>{translateWholePage ? 'Entire Webpage' : 'Content Only'}</strong></span>
            </div>
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

              {/* Prototype Preview Mode Direct Access */}
              <div className="prototype-cta-banner">
                <div className="prototype-cta-text">
                  <strong>✨ Experience Prototype Preview Mode:</strong> Explore the new multilingual result card with voice audio output, Grad-CAM visualization, and ABCDE clinical guidance.
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="prototype-cta-btn"
                    onClick={() => handleLaunchPrototype('benign')}
                  >
                    Benign Demo (94.2%)
                  </button>
                  <button
                    type="button"
                    className="prototype-cta-btn"
                    style={{ backgroundColor: '#B91C1C' }}
                    onClick={() => handleLaunchPrototype('malignant')}
                  >
                    Malignant Demo (87.3%)
                  </button>
                </div>
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

              {/* File or Benchmark Selected Preview */}
              {(selectedFile || selectedBenchmarkId) && (
                <div className="selected-file-preview" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem' }}>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Selected lesion preview"
                      style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="file-info-name" style={{ fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedFile ? selectedFile.name : `Verified Benchmark: ${selectedBenchmarkId}`}
                    </div>
                    <div className="file-info-meta" style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB • Ready for automated neural inference`
                        : 'Independent HAM10000 test set lesion reference'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setSelectedBenchmarkId(null);
                      setPreviewUrl(null);
                    }}
                  >
                    Remove
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
                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#283C32', marginBottom: '0.5rem' }}>
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
                        style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
                      >
                        <img
                          src={`/samples/${sample.id}`}
                          alt={sample.name}
                          style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E2E8F0', flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div className="sample-item-name">{sample.name}</div>
                          <div className="sample-item-desc">{sample.description}</div>
                        </div>
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
              <div className="loading-box" style={{ marginTop: '1.25rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div className="loading-spinner-sage" style={{ marginBottom: '0.75rem' }}></div>
                <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  Processing Neural Pipeline...
                </div>
                <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: '1rem' }}>
                  Automated clinical pre-screening, Laplacian sharpness analysis, and Grad-CAM spatial activation mapping.
                </div>
                
                {/* Visual Multi-Stage Progress Flow */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.5rem', textAlign: 'left' }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#EFF6FF', borderRadius: '6px', fontSize: '0.78rem', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                    <strong>1. Intake Check</strong><br/>Format & resolution
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#F0FDF4', borderRadius: '6px', fontSize: '0.78rem', color: '#166534', border: '1px solid #BBF7D0' }}>
                    <strong>2. Quality Scan</strong><br/>Laplacian sharpness
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#FAF5FF', borderRadius: '6px', fontSize: '0.78rem', color: '#6B21A8', border: '1px solid #E9D5FF' }}>
                    <strong>3. EfficientNet-B0</strong><br/>Binary pattern analysis
                  </div>
                  <div style={{ padding: '0.5rem 0.75rem', background: '#FFFBEB', borderRadius: '6px', fontSize: '0.78rem', color: '#92400E', border: '1px solid #FDE68A' }}>
                    <strong>4. Grad-CAM XAI</strong><br/>Gradient heatmap overlay
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================================================================
            PAGE 3 & 4: MODERN RESULT CARD & CLINICAL ASSESSMENT
            =================================================================== */}
        {(page === 'assessment' || page === 'explanation') && result && (() => {
          const content_t = CLINICAL_TRANSLATIONS[selectedLang] || CLINICAL_TRANSLATIONS.en;
          const ui_t = translateWholePage ? content_t : CLINICAL_TRANSLATIONS.en;
          
          let explanationCase = 'caseA';
          if (!result.success || result.validation?.valid === false || result.is_unclear) {
            explanationCase = 'caseC';
          } else if (result.prediction?.predicted_class === 'Malignant' || result.prediction?.is_concerning) {
            explanationCase = 'caseB';
          } else {
            explanationCase = 'caseA';
          }
          const simpleExplanationText = content_t[explanationCase];
          const isBenign = result.prediction?.predicted_class === 'Benign';
          const displayedScore = isBenign
            ? formatScoreLabel(result.prediction?.benign_score)
            : formatScoreLabel(result.prediction?.malignant_score);

          const bannerImgSrc = result.preview_image || previewUrl || (result.explainable_ai?.input_image);
          const gradcamOverlaySrc = result.explainable_ai?.overlay_image || bannerImgSrc;
          const originalInputSrc = result.explainable_ai?.input_image || bannerImgSrc;

          return (
            <section className="assessment-view" aria-label="Model Assessment">
              <div className="page-header no-print">
                <div className="page-category-tag">Step 2 • Clinical Decision Support Result</div>
                <h2 className="page-title">Preliminary Skin Lesion Assessment</h2>
                <p className="page-lead">
                  Modern AI analysis card with Grad-CAM feature attribution, multilingual voice output, and patient-first clinical guidance.
                </p>
              </div>

              {/* Responsive Two-Column Layout */}
              <div className="assessment-two-col-grid">
                {/* =========================================================
                    LEFT COLUMN: Specimen, Image Details & Prominent Grad-CAM
                    ========================================================= */}
                <div className="assessment-left-col">
                  {/* Primary Lesion Preview Card */}
                  <div className="assessment-card assessment-image-card">
                    <div className="card-section-header">
                      <h3 className="assessment-card-title">Submitted Lesion Specimen</h3>
                      <div className="specimen-id-badge">{result.filename || 'Dermoscopic Specimen'}</div>
                    </div>

                    <div className="prototype-banner-frame">
                      <img
                        src={bannerImgSrc}
                        alt="Submitted lesion preview"
                        className="prototype-banner-img"
                      />
                      <div className="prototype-source-tag">
                        {result.source_label || result.filename || 'Dermoscopic Specimen'}
                      </div>
                    </div>

                    <p className="image-caption-subtle">
                      Magnified dermoscopic visualization captured for automated lesion pattern screening.
                    </p>
                  </div>

                  {/* Image Details & Quality Screening Card */}
                  <div className="assessment-card assessment-quality-card">
                    <div className="card-section-header">
                      <h3 className="assessment-card-title">Image Details & Quality Screening</h3>
                      <span className="quality-pill-pass">
                        {result.quality_screen?.is_sharp !== false ? '✓ Passed Quality Check' : '⚠️ Quality Warning'}
                      </span>
                    </div>

                    <div className="assessment-meta-grid">
                      <div className="meta-item">
                        <div className="meta-field-label">File Identifier</div>
                        <div className="meta-field-value"><code>{result.filename || 'image.jpg'}</code></div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-field-label">Dimensions & Format</div>
                        <div className="meta-field-value">
                          {result.validation?.width || 600} × {result.validation?.height || 450} px ({result.validation?.image_format || 'JPEG'})
                        </div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-field-label">Quality Screening</div>
                        <div className="meta-field-value">
                          Laplacian Variance <strong>{result.quality_screen?.sharpness_score?.toFixed(1) || '93.7'}</strong>
                        </div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-field-label">Model Architecture</div>
                        <div className="meta-field-value">EfficientNet-B0 (HAM10000)</div>
                      </div>
                    </div>

                    <div className="quality-rule-note">
                      <strong>Focus Screening:</strong> Images exceeding Laplacian variance 15.0 exhibit acceptable focus and edge contrast for reliable feature extraction.
                    </div>
                  </div>
                </div>

                {/* =========================================================
                    RIGHT COLUMN: Model Prediction, Language Selection & Voice
                    ========================================================= */}
                <div className="assessment-right-col">
                  {/* Decision & Multilingual Audio Card */}
                  <article className="assessment-card assessment-decision-card" aria-label="Assessment Decision Card">
                    {/* Header */}
                    <header className="prototype-header">
                      <div>
                        <h3 className="prototype-title">{ui_t.appTitle}</h3>
                        <p className="prototype-subtitle">{ui_t.appSubtitle}</p>
                      </div>
                    </header>

                    {/* Model Prediction */}
                    <div className="prototype-prediction-block">
                      <div className="prediction-label-caps">{ui_t.modelPredictionLabel}</div>
                      <div className={`prediction-value-text ${isBenign ? 'benign' : 'malignant'}`}>
                        {result.prediction?.predicted_class || 'Benign'}
                      </div>
                      <div className="prediction-score-line">
                        {ui_t.modelScoreLabel} <strong>{displayedScore}</strong>
                      </div>

                      {/* Softmax Distribution Chips */}
                      <div className="softmax-distribution-bar">
                        <div className="softmax-chip benign">
                          Benign Softmax: <strong>{formatScoreLabel(result.prediction?.benign_score)}</strong>
                        </div>
                        <div className="softmax-chip malignant">
                          Malignant Softmax: <strong>{formatScoreLabel(result.prediction?.malignant_score)}</strong>
                        </div>
                      </div>

                      <p className="prediction-illustrative-text">{ui_t.illustrativeNotice}</p>
                    </div>

                    {/* Choose Your Language Selector & Dedicated Scope Setting */}
                    <div className="prototype-language-block">
                      <div className="prototype-section-heading">{ui_t.chooseLanguageTitle}</div>

                      <div className="lang-pills-row" role="tablist">
                        {Object.keys(CLINICAL_TRANSLATIONS).map((langKey) => {
                          const langObj = CLINICAL_TRANSLATIONS[langKey];
                          const isActive = selectedLang === langKey;
                          return (
                            <button
                              key={langKey}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              className={`lang-pill ${isActive ? 'active' : ''}`}
                              onClick={() => handleSelectLanguage(langKey)}
                            >
                              {langObj.langName}
                            </button>
                          );
                        })}
                      </div>

                      {/* Compact Single-Line Language Setting */}
                      <div className="compact-lang-setting-line">
                        <span className="compact-lang-label">Language:</span>
                        <div className="compact-lang-options">
                          <label className="compact-radio-option">
                            <input
                              type="radio"
                              name="pageTranslateMode"
                              checked={!translateWholePage}
                              onChange={() => setTranslateWholePage(false)}
                              style={{ cursor: 'pointer', accentColor: '#16A34A' }}
                            />
                            <span>Result only</span>
                          </label>
                          <label className="compact-radio-option">
                            <input
                              type="radio"
                              name="pageTranslateMode"
                              checked={translateWholePage}
                              onChange={() => setTranslateWholePage(true)}
                              style={{ cursor: 'pointer', accentColor: '#16A34A' }}
                            />
                            <span>Entire page</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Your result, explained simply (Dynamic Localized Content) */}
                    <div className="prototype-explanation-box">
                      <div className="explanation-box-title">{content_t.resultExplainedSimplyTitle}</div>
                      <p className="explanation-box-text">{simpleExplanationText}</p>

                      {/* Audio Controls: Listen, Pause, Stop */}
                      <div className="voice-controls-row" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
                        {playbackState === 'idle' && (
                          <button
                            type="button"
                            className="btn-voice-listen"
                            onClick={() => handleStartSpeech(simpleExplanationText, false, explanationCase)}
                            aria-label="Listen to result read aloud"
                          >
                            <span aria-hidden="true">▶️</span>
                            <span>{content_t.listenToResult}</span>
                          </button>
                        )}

                        {playbackState === 'playing' && (
                          <>
                            <button
                              type="button"
                              className="btn-voice-listen speaking"
                              onClick={handlePauseSpeech}
                              aria-label="Pause voice reading"
                            >
                              <span aria-hidden="true">⏸️</span>
                              <span>Pause</span>
                            </button>
                            <button
                              type="button"
                              className="btn-voice-listen"
                              onClick={handleStopSpeech}
                              aria-label="Stop voice reading"
                            >
                              <span aria-hidden="true">⏹️</span>
                              <span>{content_t.stopListening}</span>
                            </button>
                          </>
                        )}

                        {playbackState === 'paused' && (
                          <>
                            <button
                              type="button"
                              className="btn-voice-listen"
                              onClick={handleResumeSpeech}
                              aria-label="Resume voice reading"
                            >
                              <span aria-hidden="true">▶️</span>
                              <span>Resume</span>
                            </button>
                            <button
                              type="button"
                              className="btn-voice-listen"
                              onClick={handleStopSpeech}
                              aria-label="Stop voice reading"
                            >
                              <span aria-hidden="true">⏹️</span>
                              <span>{content_t.stopListening}</span>
                            </button>
                          </>
                        )}

                        {/* Optional English voice playback when viewing regional translation */}
                        {selectedLang !== 'en' && (
                          <button
                            type="button"
                            className="btn-voice-fallback"
                            onClick={() => handleStartSpeech(CLINICAL_TRANSLATIONS.en[explanationCase], true, explanationCase)}
                            title="Click to hear the English audio explanation while reading the translation above"
                          >
                            <span>🔊 Listen in English Voice</span>
                          </button>
                        )}
                      </div>

                      <div className="explanation-footer-note">{content_t.exampleScreenDisclaimer}</div>
                    </div>
                  </article>
                </div>
              </div>

              {/* =========================================================
                  FULL-WIDTH SECTION 1: Visual Explanation – Grad-CAM
                  Spans the complete available content container
                  ========================================================= */}
              <section className="assessment-card assessment-fullwidth-gradcam" aria-label="Visual Explanation Grad-CAM">
                <div className="card-section-header gradcam-prominent-header">
                  <div>
                    <h3 className="assessment-card-title gradcam-main-heading">{ui_t.visualExplanationTitle}</h3>
                    <p className="gradcam-subheading">Gradient-weighted Class Activation Mapping (Grad-CAM) Visual Evidence</p>
                  </div>
                  <span className="xai-pill-tag">Explainable AI (XAI)</span>
                </div>

                {/* Side-by-side equal-width, aspect-ratio-preserving panels */}
                <div className="gradcam-fullwidth-grid">
                  <div className="gradcam-fullwidth-item">
                    <div className="gradcam-panel-header">
                      <span className="gradcam-panel-number">1</span>
                      <span className="gradcam-panel-title">{ui_t.originalImageLabel}</span>
                    </div>
                    <div className="gradcam-fullwidth-frame">
                      <img src={originalInputSrc} alt="Original dermoscopic lesion" className="gradcam-fullwidth-img" />
                    </div>
                  </div>

                  <div className="gradcam-fullwidth-item">
                    <div className="gradcam-panel-header">
                      <span className="gradcam-panel-number">2</span>
                      <span className="gradcam-panel-title">{ui_t.gradCamOverlayLabel}</span>
                    </div>
                    <div className="gradcam-fullwidth-frame overlay-frame">
                      <img src={gradcamOverlaySrc} alt="Grad-CAM activation overlay" className="gradcam-fullwidth-img" />
                    </div>
                  </div>
                </div>

                {/* Explanatory text strictly below both images */}
                <div className="gradcam-caption-box">
                  <p className="gradcam-disclaimer-caption">{ui_t.gradCamCaption}</p>
                </div>

                {/* Expandable Technical Decomposition Accordion below the two images */}
                <div className="deep-dive-section" style={{ marginTop: '1.25rem', borderTop: '1px solid #E5E7EB', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="deep-dive-toggle-btn no-print"
                    onClick={() => setShowDeepDive(!showDeepDive)}
                    style={{ width: '100%', fontSize: '0.84rem', padding: '0.5rem 0.75rem' }}
                  >
                    <span>🔬 {showDeepDive ? 'Hide' : 'View'} Full 3-Stage Feature Decomposition</span>
                    <span>{showDeepDive ? '▲' : '▼'}</span>
                  </button>

                  {showDeepDive && (
                    <div style={{ marginTop: '0.85rem' }}>
                      {result.explainable_ai && result.explainable_ai.overlay_image && (
                        <div className="explanation-trio-grid" style={{ marginBottom: '0.85rem' }}>
                          <div className="trio-card">
                            <div className="trio-title">1. Normalized Input</div>
                            <div className="trio-img-frame">
                              <img src={originalInputSrc} alt="Normalized input" />
                            </div>
                            <div className="trio-caption">224 × 224 pixels</div>
                          </div>

                          <div className="trio-card">
                            <div className="trio-title">2. Activation Heatmap</div>
                            <div className="trio-img-frame">
                              <img src={result.explainable_ai.heatmap_image || gradcamOverlaySrc} alt="Grad-CAM activation heatmap" />
                            </div>
                            <div className="trio-caption">Last convolutional gradients</div>
                          </div>

                          <div className="trio-card">
                            <div className="trio-title">3. Superimposed Overlay</div>
                            <div className="trio-img-frame">
                              <img src={gradcamOverlaySrc} alt="Superimposed heatmap" />
                            </div>
                            <div className="trio-caption">Feature attribution overlay</div>
                          </div>
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: '#536B5E', lineHeight: 1.5 }}>
                        <strong>Classification Rule:</strong> Evaluated with standard argmax decision rule (threshold 0.50).
                        Grad-CAM gradients computed at the final convolutional stage of EfficientNet-B0.
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* =========================================================
                  FULL-WIDTH SECTION 2: Friendly Next Steps & Medical Guidance
                  ========================================================= */}
              <div className="assessment-card assessment-fullwidth-guidance">
                <div className="guidance-fullwidth-header">
                  <div>
                    <h3 className="friendly-guidance-title">{ui_t.guidanceHeading}</h3>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 600, color: '#374151', marginTop: '0.25rem' }}>
                      {ui_t.whenToSeekTitle}
                    </h4>
                  </div>
                </div>
                <p className="friendly-guidance-sub">{ui_t.whenToSeekDesc}</p>

                {/* ABCDE Warning Signs Grid (5 columns on desktop) */}
                <div className="abcde-grid fullwidth-abcde">
                  {ui_t.abcde.map((item) => (
                    <div key={item.letter} className="abcde-item-card">
                      <span className="abcde-badge">{item.letter}</span>
                      <strong className="abcde-item-title">{item.title}</strong>
                      <span className="abcde-item-desc">{item.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Two-Column Clinical Caution Grid: Uncertainty & Red Flags */}
                <div className="clinical-caution-grid">
                  {/* Why Predictions May Be Uncertain */}
                  <div className="uncertainty-box">
                    <div className="uncertainty-title">⚠️ {ui_t.whyUncertainTitle}</div>
                    <ul className="uncertainty-list">
                      {ui_t.uncertaintyPoints.map((pt, idx) => (
                        <li key={idx} style={{ marginBottom: '0.35rem' }}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Warning Signs Never to Ignore */}
                  {ui_t.redFlags && (
                    <div className="red-flags-box">
                      <div className="red-flags-title">🚩 {ui_t.redFlagsTitle}</div>
                      <ul className="red-flags-list">
                        {ui_t.redFlags.map((flag, idx) => (
                          <li key={idx} style={{ marginBottom: '0.35rem' }}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Strict Clinical & Ethical Boundaries */}
                <div className="ethical-safeguards-box" style={{ marginTop: '1.25rem' }}>
                  <div className="ethical-safeguards-title">🛡️ {ui_t.ethicalBoundariesTitle}</div>
                  <p className="ethical-safeguards-text">{ui_t.ethicalBoundariesText}</p>
                </div>
              </div>

              {/* Action Controls Neatly Placed BELOW the Full-Width Section */}
              <div className="assessment-actions-row fullwidth-actions no-print">
                <button
                  id="btn-new-assessment"
                  type="button"
                  className="btn-primary"
                  onClick={handleNewAssessment}
                >
                  Evaluate another image →
                </button>
                <button
                  id="btn-export-report-assessment"
                  type="button"
                  className="btn-secondary"
                  onClick={handleExportReport}
                >
                  📄 Export assessment report
                </button>
              </div>
            </section>
          );
        })()}

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
        <p>DermAI · Intelligent Skin Lesion Analysis - 2026</p>
      </footer>
    </div>
  );
}

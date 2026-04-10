let uploadedFile = null;
let currentResult = null;

// ======================
// HANDLE FILE
// ======================
function handleFile(event) {
    const file = event.target.files[0];
    
    if (!file) {
        resetFileInput();
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, etc.)');
        resetFileInput();
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        resetFileInput();
        return;
    }

    uploadedFile = file;
    
    // Update UI
    document.getElementById('fileLabel').textContent = file.name;
    document.getElementById('analyzeBtn').disabled = false;
    
    // Show preview
    showImagePreview(file);
    
    console.log(' File selected:', file.name);
}

function resetFileInput() {
    uploadedFile = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('fileLabel').textContent = 'Choose Image';
    document.getElementById('analyzeBtn').disabled = true;
    hideImagePreview();
}

function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        
        img.src = e.target.result;
        preview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function hideImagePreview() {
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('previewImg').src = '';
}

function removeImage() {
    resetFileInput();
}

// ======================
// START ANALYSIS
// ======================
async function startAnalysis() {
    if (!uploadedFile) {
        showNotification('Please upload an image first!', 'warning');
        return;
    }

    console.log(' Starting analysis...');
    console.log('File details:', uploadedFile.name, uploadedFile.type, uploadedFile.size);
    
    // Show loading state
    showLoading();
    
    const formData = new FormData();
    formData.append('image', uploadedFile);
    
    console.log('FormData created, sending request...');
    
    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok) {
            currentResult = result;
            showResults(result);
            showNotification('Analysis completed successfully!', 'success');
        } else {
            throw new Error(result.error || `Server returned ${response.status}`);
        }
    } catch (error) {
        console.error('Analysis error:', error);
        showNotification(`Analysis failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// ======================
// CALL BACKEND API
// ======================
async function runAIAnalysis() {

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        console.log(' Response received:', result);
        currentResult = result;
        
        // Hide loading and show results
        hideLoading();
        showResults(result);

    } catch (error) {
        console.error(' Error:', error);
        hideLoading();
        showNotification(`Analysis failed: ${error.message}`, 'error');
    }
}

// ======================
// SHOW RESULT
// ======================
function showResults(result) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const timestamp = document.getElementById('resultTimestamp');

    // Set timestamp
    const now = new Date();
    timestamp.textContent = `Analyzed on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;

    // Generate result HTML
    const resultHTML = generateResultHTML(result);
    resultContent.innerHTML = resultHTML;

    // Show result section with animation
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Animate confidence bar
    setTimeout(() => {
        const confidenceFill = document.querySelector('.confidence-fill');
        if (confidenceFill) {
            confidenceFill.style.width = `${result.confidence}%`;
        }
    }, 100);
}

function generateResultHTML(result) {
    const classification = result.classification.toLowerCase();
    
    return `
        <div class="prediction-badge ${classification}">
            <i class="fas fa-${getPredictionIcon(classification)}"></i>
            Prediction: ${result.classification}
        </div>

        <div class="confidence-meter">
            <div class="confidence-label">
                <span>Confidence Level</span>
                <span>${result.confidence.toFixed(1)}%</span>
            </div>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: 0%"></div>
            </div>
        </div>

        <div class="probabilities">
            <div class="prob-item">
                <div class="prob-label">Non-Cancer</div>
                <div class="prob-value">${result.non_cancer_prob.toFixed(1)}%</div>
            </div>
            <div class="prob-item">
                <div class="prob-label">Cancer</div>
                <div class="prob-value">${result.cancer_prob.toFixed(1)}%</div>
            </div>
        </div>

        <div class="next-steps">
            <h4><i class="fas fa-info-circle"></i> Recommended Next Steps</h4>
            <ul>
                ${result.next_steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
        </div>

        <div class="explanation">
            <p><strong>Analysis Details:</strong> ${result.explanation}</p>
        </div>
    `;
}

function getPredictionIcon(classification) {
    switch(classification) {
        case 'non cancer': return 'check-circle';
        case 'cancer': return 'times-circle';
        default: return 'question-circle';
    }
}

// ======================
// UTILITY FUNCTIONS
// ======================
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

function resetAnalysis() {
    // Reset file input
    resetFileInput();
    
    // Hide results
    document.getElementById('resultSection').classList.add('hidden');
    
    // Clear current result
    currentResult = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showNotification('Ready for new analysis', 'info');
}

function downloadReport() {
    if (!currentResult) {
        showNotification('No results to download', 'warning');
        return;
    }

    // Create report content
    const report = generateReport(currentResult);
    
    // Create download link
    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oral-cancer-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Report downloaded successfully', 'success');
}

function generateReport(result) {
    const date = new Date().toLocaleString();
    
    return `
ORAL CANCER DETECTION ANALYSIS REPORT
=====================================

Analysis Date: ${date}

PREDICTION RESULTS
------------------
Classification: ${result.classification}
Confidence: ${result.confidence.toFixed(2)}%

PROBABILITY BREAKDOWN
--------------------
Non-Cancer: ${result.non_cancer_prob.toFixed(2)}%
Cancer: ${result.cancer_prob.toFixed(2)}%

ANALYSIS DETAILS
----------------
${result.explanation}

RECOMMENDED NEXT STEPS
----------------------
${result.next_steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

IMPORTANT NOTES
--------------
- This analysis is for screening purposes only
- Always consult with qualified healthcare professionals
- This tool should not replace professional medical diagnosis
- Results should be discussed with your doctor or dentist

Generated by OralScan AI - Advanced Oral Cancer Detection System
    `.trim();
}

// ======================
// INITIALIZATION
// ======================
document.addEventListener('DOMContentLoaded', function() {
    console.log(' OralScan AI initialized');
    
    // Add notification styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            z-index: 2000;
            transform: translateX(120%);
            transition: transform 0.3s ease;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            border-left: 4px solid #10b981;
        }
        
        .notification-error {
            border-left: 4px solid #ef4444;
        }
        
        .notification-warning {
            border-left: 4px solid #f59e0b;
        }
        
        .notification-info {
            border-left: 4px solid #3b82f6;
        }
        
        .notification button {
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            padding: 5px;
            margin-left: auto;
        }
        
        .notification button:hover {
            color: #374151;
        }
    `;
    document.head.appendChild(style);
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('userDropdown');
        const userMenu = document.querySelector('.user-menu');
        
        if (dropdown && userMenu && !userMenu.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
});

// ======================
// KEYBOARD SHORTCUTS
// ======================
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + O to open file dialog
    if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
        event.preventDefault();
        document.getElementById('fileInput').click();
    }
    
    // Enter to start analysis when file is selected
    if (event.key === 'Enter' && uploadedFile && !document.getElementById('loadingOverlay').classList.contains('hidden') === false) {
        event.preventDefault();
        startAnalysis();
    }
    
    // Escape to reset
    if (event.key === 'Escape') {
        resetAnalysis();
    }
});
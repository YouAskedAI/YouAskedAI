// Subject card selection
document.querySelectorAll('.subject-card').forEach(card => {
    card.addEventListener('click', function() {
        const subject = this.getAttribute('data-subject');
        document.getElementById('problemType').value = subject;
        
        // Update active state
        document.querySelectorAll('.subject-card').forEach(c => {
            c.classList.remove('border-primary');
        });
        this.classList.add('border-primary');
    });
});

// Camera handling
let stream = null;
const cameraModal = new bootstrap.Modal(document.getElementById('cameraModal'));
const cameraPreview = document.getElementById('cameraPreview');
const photoCanvas = document.getElementById('photoCanvas');
const capturedImage = document.getElementById('capturedImage');
const captureButton = document.getElementById('captureButton');
const retakeButton = document.getElementById('retakeButton');
const usePhotoButton = document.getElementById('usePhotoButton');
const cameraButton = document.getElementById('cameraButton');

// Handle camera button click
cameraButton.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        });
        
        cameraPreview.srcObject = stream;
        cameraPreview.play();
        cameraModal.show();
        
        cameraPreview.style.display = 'block';
        capturedImage.style.display = 'none';
        captureButton.style.display = 'block';
        retakeButton.style.display = 'none';
        usePhotoButton.style.display = 'none';
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Error accessing camera. Please make sure you have granted camera permissions.');
    }
});

// Handle capture button click
captureButton.addEventListener('click', () => {
    const context = photoCanvas.getContext('2d');
    photoCanvas.width = cameraPreview.videoWidth;
    photoCanvas.height = cameraPreview.videoHeight;
    context.drawImage(cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);
    
    capturedImage.src = photoCanvas.toDataURL('image/jpeg', 0.8);
    
    cameraPreview.style.display = 'none';
    capturedImage.style.display = 'block';
    captureButton.style.display = 'none';
    retakeButton.style.display = 'block';
    usePhotoButton.style.display = 'block';
});

// Handle retake button click
retakeButton.addEventListener('click', () => {
    cameraPreview.style.display = 'block';
    capturedImage.style.display = 'none';
    captureButton.style.display = 'block';
    retakeButton.style.display = 'none';
    usePhotoButton.style.display = 'none';
});

// Handle use photo button click
usePhotoButton.addEventListener('click', () => {
    fetch(capturedImage.src)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            document.getElementById('homeworkFile').files = dataTransfer.files;
            
            cameraModal.hide();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
        })
        .catch(err => {
            console.error('Error using photo:', err);
            alert('Error using photo. Please try again.');
        });
});

// Clean up when modal is closed
document.getElementById('cameraModal').addEventListener('hidden.bs.modal', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
});

// Homework form submission
document.getElementById('homeworkForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const problemType = document.getElementById('problemType').value;
    const problemInput = document.getElementById('problemInput').value;
    const homeworkFile = document.getElementById('homeworkFile');
    const extractText = document.getElementById('extractText').checked;
    const solutionSection = document.getElementById('solutionSection');
    const solutionText = document.getElementById('solutionText');
    
    if (!problemType) {
        alert('Please select a problem type');
        return;
    }
    
    if (!problemInput.trim() && !homeworkFile.files[0]) {
        alert('Please provide either a problem description or upload a file');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('type', problemType);
        
        if (homeworkFile.files[0]) {
            formData.append('file', homeworkFile.files[0]);
            formData.append('file_type', homeworkFile.files[0].type);
            formData.append('extract_text', extractText);
        } else {
            formData.append('problem', problemInput);
        }
        
        // Show loading state
        solutionText.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>Processing your homework problem...</div>
            </div>
        `;
        solutionSection.style.display = 'block';
        
        const response = await fetch('/api/solve', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'An error occurred while processing your request');
        }
        
        if (data.error) {
            solutionText.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        } else {
            // Format the solution text
            const solution = data.solution;
            let formattedSolution = '';
            
            const sections = solution.split('\n\n');
            sections.forEach(section => {
                const trimmedSection = section.trim();
                if (!trimmedSection) return;
                
                if (trimmedSection.startsWith('Problem Statement:')) {
                    formattedSolution += `
                        <div class="solution-section">
                            <h5>Problem Statement</h5>
                            <p>${trimmedSection.replace('Problem Statement:', '').trim()}</p>
                        </div>
                    `;
                } else if (trimmedSection.startsWith('Solution Steps:')) {
                    const steps = trimmedSection.replace('Solution Steps:', '').trim().split('\n');
                    formattedSolution += `
                        <div class="solution-section">
                            <h5>Solution Steps</h5>
                            <ol class="solution-steps">
                                ${steps.map(step => `<li>${step.trim()}</li>`).join('')}
                            </ol>
                        </div>
                    `;
                } else if (trimmedSection.startsWith('Final Answer:')) {
                    formattedSolution += `
                        <div class="solution-section">
                            <h5>Final Answer</h5>
                            <p class="final-answer">${trimmedSection.replace('Final Answer:', '').trim()}</p>
                        </div>
                    `;
                } else if (trimmedSection.startsWith('Verification:')) {
                    formattedSolution += `
                        <div class="solution-section">
                            <h5>Verification</h5>
                            <div class="verification">
                                <p>${trimmedSection.replace('Verification:', '').trim()}</p>
                            </div>
                        </div>
                    `;
                } else {
                    formattedSolution += `
                        <div class="solution-section">
                            <p>${trimmedSection}</p>
                        </div>
                    `;
                }
            });
            
            solutionText.innerHTML = formattedSolution;
        }
    } catch (error) {
        console.error('Error:', error);
        solutionText.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}); 
// Subject selection
let currentSubject = null;
document.querySelectorAll('.topic-card').forEach(card => {
    card.addEventListener('click', function() {
        const subject = this.getAttribute('data-subject');
        currentSubject = subject;
        
        // Update active state
        document.querySelectorAll('.topic-card').forEach(c => {
            c.classList.remove('active');
        });
        this.classList.add('active');
        
        // Load resources and practice problems for the selected subject
        loadResources(subject);
        loadPracticeProblems(subject);
    });
});

// Chat functionality
const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'tutor-message'}`;
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, true);
    userInput.value = '';
    
    try {
        const response = await fetch('/api/tutor/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                subject: currentSubject
            })
        });
        
        const data = await response.json();
        if (data.error) {
            addMessage('Sorry, I encountered an error. Please try again.');
        } else {
            addMessage(data.response);
        }
    } catch (error) {
        console.error('Error:', error);
        addMessage('Sorry, I encountered an error. Please try again.');
    }
});

// Load learning resources
async function loadResources(subject) {
    const resourcesContainer = document.getElementById('resourcesContainer');
    resourcesContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch(`/api/tutor/resources?subject=${subject}`);
        const data = await response.json();
        
        if (data.error) {
            resourcesContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">${data.error}</div></div>`;
            return;
        }
        
        resourcesContainer.innerHTML = data.resources.map(resource => `
            <div class="col-md-4 mb-3">
                <div class="card resource-card">
                    <div class="card-body">
                        <h5 class="card-title">${resource.title}</h5>
                        <p class="card-text">${resource.description}</p>
                        <a href="${resource.url}" target="_blank" class="btn btn-outline-primary">Learn More</a>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading resources:', error);
        resourcesContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger">Failed to load resources</div></div>';
    }
}

// Load practice problems
async function loadPracticeProblems(subject) {
    const practiceProblems = document.getElementById('practiceProblems');
    practiceProblems.innerHTML = '<div class="col-12 text-center"><div class="spinner-border" role="status"></div></div>';
    
    try {
        const response = await fetch(`/api/tutor/practice?subject=${subject}`);
        const data = await response.json();
        
        if (data.error) {
            practiceProblems.innerHTML = `<div class="col-12"><div class="alert alert-danger">${data.error}</div></div>`;
            return;
        }
        
        practiceProblems.innerHTML = data.problems.map(problem => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Problem ${problem.id}</h5>
                        <p class="card-text">${problem.question}</p>
                        <button class="btn btn-primary" onclick="showSolution(${problem.id})">
                            Show Solution
                        </button>
                        <div id="solution-${problem.id}" style="display: none;" class="mt-3">
                            <h6>Solution:</h6>
                            <p>${problem.solution}</p>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading practice problems:', error);
        practiceProblems.innerHTML = '<div class="col-12"><div class="alert alert-danger">Failed to load practice problems</div></div>';
    }
}

// Show solution for practice problems
function showSolution(problemId) {
    const solutionDiv = document.getElementById(`solution-${problemId}`);
    const button = solutionDiv.previousElementSibling;
    
    if (solutionDiv.style.display === 'none') {
        solutionDiv.style.display = 'block';
        button.textContent = 'Hide Solution';
    } else {
        solutionDiv.style.display = 'none';
        button.textContent = 'Show Solution';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Problem solver form handling
    const problemForm = document.getElementById('problemForm');
    const solutionText = document.getElementById('solutionText');
    const solutionAlert = solutionText.parentElement;

    // Keyboard toggle buttons
    const mathKeyboardBtn = document.getElementById('mathKeyboardBtn');
    const chemKeyboardBtn = document.getElementById('chemKeyboardBtn');
    const physicsKeyboardBtn = document.getElementById('physicsKeyboardBtn');
    const mathKeyboard = document.getElementById('mathKeyboard');
    const chemKeyboard = document.getElementById('chemKeyboard');
    const physicsKeyboard = document.getElementById('physicsKeyboard');

    // Camera functionality
    const cameraButton = document.getElementById('cameraButton');
    const cameraModal = new bootstrap.Modal(document.getElementById('cameraModal'));
    const cameraPreview = document.getElementById('cameraPreview');
    const photoCanvas = document.getElementById('photoCanvas');
    const capturedImage = document.getElementById('capturedImage');
    const captureButton = document.getElementById('captureButton');
    const retakeButton = document.getElementById('retakeButton');
    const usePhotoButton = document.getElementById('usePhotoButton');
    const imagePreview = document.getElementById('imagePreview');
    const preview = document.getElementById('preview');
    const problemImage = document.getElementById('problemImage');

    // Keyboard toggle functionality
    mathKeyboardBtn.addEventListener('click', () => toggleKeyboard(mathKeyboard));
    chemKeyboardBtn.addEventListener('click', () => toggleKeyboard(chemKeyboard));
    physicsKeyboardBtn.addEventListener('click', () => toggleKeyboard(physicsKeyboard));

    function toggleKeyboard(keyboard) {
        [mathKeyboard, chemKeyboard, physicsKeyboard].forEach(k => {
            if (k === keyboard) {
                k.style.display = k.style.display === 'none' ? 'block' : 'none';
            } else {
                k.style.display = 'none';
            }
        });
    }

    // Add keyboard button click handlers
    document.querySelectorAll('.keyboard-btn').forEach(button => {
        button.addEventListener('click', () => {
            const problemInput = document.getElementById('problemInput');
            const cursorPos = problemInput.selectionStart;
            const text = problemInput.value;
            problemInput.value = text.substring(0, cursorPos) + button.textContent + text.substring(cursorPos);
            problemInput.focus();
            problemInput.setSelectionRange(cursorPos + button.textContent.length, cursorPos + button.textContent.length);
        });
    });

    // Camera functionality
    let stream = null;

    cameraButton.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraPreview.srcObject = stream;
            cameraModal.show();
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please make sure you have granted camera permissions.');
        }
    });

    captureButton.addEventListener('click', () => {
        const context = photoCanvas.getContext('2d');
        photoCanvas.width = cameraPreview.videoWidth;
        photoCanvas.height = cameraPreview.videoHeight;
        context.drawImage(cameraPreview, 0, 0);
        capturedImage.src = photoCanvas.toDataURL('image/png');
        capturedImage.style.display = 'block';
        cameraPreview.style.display = 'none';
        captureButton.style.display = 'none';
        retakeButton.style.display = 'block';
        usePhotoButton.style.display = 'block';
    });

    retakeButton.addEventListener('click', () => {
        capturedImage.style.display = 'none';
        cameraPreview.style.display = 'block';
        captureButton.style.display = 'block';
        retakeButton.style.display = 'none';
        usePhotoButton.style.display = 'none';
    });

    usePhotoButton.addEventListener('click', () => {
        const blob = dataURLtoBlob(capturedImage.src);
        const file = new File([blob], 'captured-image.png', { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        problemImage.files = dataTransfer.files;
        preview.src = capturedImage.src;
        imagePreview.style.display = 'block';
        cameraModal.hide();
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });

    function dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // Handle file upload preview
    problemImage.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Form submission
    problemForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('type', document.getElementById('problemType').value);
        formData.append('problem', document.getElementById('problemInput').value);
        
        if (problemImage.files[0]) {
            formData.append('file', problemImage.files[0]);
        }

        try {
            const response = await fetch('/api/solve', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (response.ok) {
                solutionText.innerHTML = formatSolution(result.solution);
                solutionAlert.style.display = 'block';
                solutionAlert.className = 'alert alert-success mt-3';
            } else {
                solutionText.textContent = result.error || 'An error occurred while solving the problem.';
                solutionAlert.style.display = 'block';
                solutionAlert.className = 'alert alert-danger mt-3';
            }
        } catch (error) {
            console.error('Error:', error);
            solutionText.textContent = 'An error occurred while solving the problem.';
            solutionAlert.style.display = 'block';
            solutionAlert.className = 'alert alert-danger mt-3';
        }
    });

    // Format solution text
    function formatSolution(solution) {
        const sections = solution.split('\n\n');
        let formattedHTML = '';
        
        sections.forEach(section => {
            if (section.startsWith('Problem Statement:')) {
                formattedHTML += `<div class="solution-section">
                    <h5>Problem Statement</h5>
                    <p>${section.replace('Problem Statement:', '').trim()}</p>
                </div>`;
            } else if (section.startsWith('Solution Steps:')) {
                formattedHTML += `<div class="solution-section">
                    <h5>Solution Steps</h5>
                    <ol class="solution-steps">`;
                const steps = section.replace('Solution Steps:', '').trim().split('\n');
                steps.forEach(step => {
                    if (step.trim()) {
                        formattedHTML += `<li>${step.trim()}</li>`;
                    }
                });
                formattedHTML += `</ol></div>`;
            } else if (section.startsWith('Final Answer:')) {
                formattedHTML += `<div class="solution-section">
                    <h5>Final Answer</h5>
                    <p class="final-answer">${section.replace('Final Answer:', '').trim()}</p>
                </div>`;
            } else if (section.startsWith('Verification:')) {
                formattedHTML += `<div class="solution-section">
                    <h5>Verification</h5>
                    <div class="verification">
                        <p>${section.replace('Verification:', '').trim()}</p>
                    </div>
                </div>`;
            }
        });
        
        return formattedHTML;
    }
}); 
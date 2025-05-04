// Image capture and preview functionality
const problemImage = document.getElementById('problemImage');
const captureBtn = document.getElementById('captureBtn');
const imagePreview = document.getElementById('imagePreview');
const preview = document.getElementById('preview');
const removeImage = document.getElementById('removeImage');
const problemInput = document.getElementById('problemInput');

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

// Handle file selection
problemImage.addEventListener('change', function(e) {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        const fileType = file.type;
        
        if (fileType.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        } else if (fileType === 'application/pdf') {
            // For PDFs, show a preview with file information
            const reader = new FileReader();
            reader.onload = function(e) {
                // Create a PDF preview element
                const pdfPreview = document.createElement('div');
                pdfPreview.className = 'pdf-preview';
                pdfPreview.innerHTML = `
                    <div class="pdf-info">
                        <i class="bi bi-file-pdf-fill text-danger"></i>
                        <div class="pdf-details">
                            <h6>${file.name}</h6>
                            <small>${(file.size / 1024).toFixed(2)} KB</small>
                        </div>
                    </div>
                    <embed src="${e.target.result}" type="application/pdf" width="100%" height="200px">
                `;
                
                // Clear previous preview
                imagePreview.innerHTML = '';
                imagePreview.appendChild(pdfPreview);
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    }
});

// Handle camera capture
captureBtn.addEventListener('click', function() {
    problemImage.click();
});

// Handle file removal
removeImage.addEventListener('click', function() {
    problemImage.value = '';
    preview.src = '';
    imagePreview.style.display = 'none';
});

// Problem Solver Form Handler
document.getElementById('problemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const problemType = document.getElementById('problemType').value;
    const problemInput = document.getElementById('problemInput').value;
    const problemImage = document.getElementById('problemImage');
    const resultDiv = document.querySelector('.alert');
    const solutionText = document.getElementById('solutionText');
    
    try {
        const formData = new FormData();
        formData.append('type', problemType);
        
        // If there's a file (image or PDF), send it
        if (problemImage.files[0]) {
            const file = problemImage.files[0];
            formData.append('file', file);
            formData.append('file_type', file.type);
        } else if (problemInput.trim()) {
            formData.append('problem', problemInput);
        } else {
            solutionText.innerHTML = '<div class="alert alert-danger">Please provide either a problem statement or upload a file.</div>';
            resultDiv.classList.remove('alert-info');
            resultDiv.classList.add('alert-danger');
            resultDiv.style.display = 'block';
            return;
        }
        
        // Show loading state
        solutionText.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>Processing your request...</div>
            </div>
        `;
        resultDiv.classList.remove('alert-danger');
        resultDiv.classList.add('alert-info');
        resultDiv.style.display = 'block';
        
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
            resultDiv.classList.remove('alert-info');
            resultDiv.classList.add('alert-danger');
        } else {
            // Format the solution text
            const solution = data.solution;
            console.log("Received solution:", solution); // Debug log
            
            // Split the solution into sections
            const sections = solution.split('\n\n');
            let formattedSolution = '';
            
            sections.forEach(section => {
                const trimmedSection = section.trim();
                if (!trimmedSection) return; // Skip empty sections
                
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
                    // If the section doesn't match any known format, display it as is
                    formattedSolution += `
                        <div class="solution-section">
                            <p>${trimmedSection}</p>
                        </div>
                    `;
                }
            });
            
            solutionText.innerHTML = formattedSolution;
            resultDiv.classList.remove('alert-danger');
            resultDiv.classList.add('alert-info');
        }
        
        resultDiv.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        solutionText.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        resultDiv.classList.remove('alert-info');
        resultDiv.classList.add('alert-danger');
        resultDiv.style.display = 'block';
    }
});

// File Upload Form Handler
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const uploadResult = document.getElementById('uploadResult');
    const uploadMessage = document.getElementById('uploadMessage');
    const alertDiv = uploadResult.querySelector('.alert');
    
    if (fileInput.files.length === 0) {
        uploadMessage.textContent = 'Please select a file to upload.';
        alertDiv.classList.remove('alert-success');
        alertDiv.classList.add('alert-danger');
        alertDiv.style.display = 'block';
        return;
    }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            uploadMessage.textContent = data.message;
            alertDiv.classList.remove('alert-danger');
            alertDiv.classList.add('alert-success');
            fileInput.value = ''; // Clear the file input
            loadFiles(); // Refresh the file list
        } else {
            uploadMessage.textContent = data.error;
            alertDiv.classList.remove('alert-success');
            alertDiv.classList.add('alert-danger');
        }
        
        alertDiv.style.display = 'block';
    } catch (error) {
        uploadMessage.textContent = 'An error occurred while uploading the file.';
        alertDiv.classList.remove('alert-success');
        alertDiv.classList.add('alert-danger');
        alertDiv.style.display = 'block';
    }
});

// Function to load and display uploaded files
async function loadFiles() {
    const fileList = document.getElementById('fileList');
    const fileSelect = document.getElementById('fileSelect');
    
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        if (response.ok) {
            // Update file list display
            fileList.innerHTML = '';
            data.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'list-group-item';
                fileItem.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-1">${file.filename}</h6>
                            <small class="text-muted">
                                Uploaded: ${new Date(file.upload_date).toLocaleString()}
                            </small>
                        </div>
                        <div>
                            <small class="text-muted">
                                ${(file.file_size / 1024).toFixed(2)} KB
                            </small>
                        </div>
                    </div>
                `;
                fileList.appendChild(fileItem);
            });
            
            // Update file select dropdown
            fileSelect.innerHTML = '<option value="">No file selected</option>';
            data.files.forEach(file => {
                const option = document.createElement('option');
                option.value = file._id;
                option.textContent = file.filename;
                fileSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Load files when the page loads
document.addEventListener('DOMContentLoaded', loadFiles); 

// Handle camera button click
cameraButton.addEventListener('click', async () => {
    try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }, 
            audio: false 
        });
        
        // Set up camera preview
        cameraPreview.srcObject = stream;
        cameraPreview.play();
        
        // Show the modal
        cameraModal.show();
        
        // Reset UI state
        cameraPreview.style.display = 'block';
        capturedImage.style.display = 'none';
        captureButton.style.display = 'block';
        retakeButton.style.display = 'none';
        usePhotoButton.style.display = 'none';
        
        console.log('Camera initialized successfully');
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Error accessing camera. Please make sure you have granted camera permissions.');
    }
});

// Handle capture button click
captureButton.addEventListener('click', () => {
    try {
        const context = photoCanvas.getContext('2d');
        
        // Set canvas size to match video dimensions
        photoCanvas.width = cameraPreview.videoWidth;
        photoCanvas.height = cameraPreview.videoHeight;
        
        // Draw the video frame to the canvas
        context.drawImage(cameraPreview, 0, 0, photoCanvas.width, photoCanvas.height);
        
        // Convert the canvas to an image
        capturedImage.src = photoCanvas.toDataURL('image/jpeg', 0.8);
        
        // Update UI
        cameraPreview.style.display = 'none';
        capturedImage.style.display = 'block';
        captureButton.style.display = 'none';
        retakeButton.style.display = 'block';
        usePhotoButton.style.display = 'block';
        
        console.log('Photo captured successfully');
    } catch (err) {
        console.error('Error capturing photo:', err);
        alert('Error capturing photo. Please try again.');
    }
});

// Handle retake button click
retakeButton.addEventListener('click', () => {
    try {
        // Reset UI
        cameraPreview.style.display = 'block';
        capturedImage.style.display = 'none';
        captureButton.style.display = 'block';
        retakeButton.style.display = 'none';
        usePhotoButton.style.display = 'none';
        
        console.log('Camera reset for retake');
    } catch (err) {
        console.error('Error resetting camera:', err);
        alert('Error resetting camera. Please try again.');
    }
});

// Handle use photo button click
usePhotoButton.addEventListener('click', () => {
    try {
        // Convert the captured image to a file
        fetch(capturedImage.src)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "captured_image.jpg", { type: "image/jpeg" });
                
                // Create a new FileList containing the file
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                
                // Set the file input's files
                const fileInput = document.getElementById('problemImage');
                fileInput.files = dataTransfer.files;
                
                // Trigger the change event
                const event = new Event('change');
                fileInput.dispatchEvent(event);
                
                // Close the modal and stop the camera
                cameraModal.hide();
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    stream = null;
                }
                
                console.log('Photo used successfully');
            })
            .catch(err => {
                console.error('Error using photo:', err);
                alert('Error using photo. Please try again.');
            });
    } catch (err) {
        console.error('Error in use photo handler:', err);
        alert('Error processing photo. Please try again.');
    }
});

// Clean up when modal is closed
document.getElementById('cameraModal').addEventListener('hidden.bs.modal', () => {
    try {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        console.log('Camera stream stopped');
    } catch (err) {
        console.error('Error stopping camera stream:', err);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Problem solver form handling
    const problemForm = document.getElementById('problemForm');
    const solutionDiv = document.getElementById('solution');
    const problemInput = document.getElementById('problemInput');
    
    // Keyboard toggle buttons
    const mathKeyboardBtn = document.getElementById('mathKeyboardBtn');
    const chemKeyboardBtn = document.getElementById('chemKeyboardBtn');
    const physicsKeyboardBtn = document.getElementById('physicsKeyboardBtn');
    
    // Keyboard sections
    const mathKeyboard = document.getElementById('mathKeyboard');
    const chemKeyboard = document.getElementById('chemKeyboard');
    const physicsKeyboard = document.getElementById('physicsKeyboard');
    
    // Hide all keyboards initially
    mathKeyboard.style.display = 'none';
    chemKeyboard.style.display = 'none';
    physicsKeyboard.style.display = 'none';
    
    // Toggle keyboard visibility
    function toggleKeyboard(keyboard, button) {
        console.log('Toggling keyboard:', keyboard.id);
        const isVisible = keyboard.style.display === 'block';
        keyboard.style.display = isVisible ? 'none' : 'block';
        
        // Update button appearance
        button.classList.toggle('active', !isVisible);
        
        // Hide other keyboards
        if (!isVisible) {
            if (keyboard !== mathKeyboard) mathKeyboard.style.display = 'none';
            if (keyboard !== chemKeyboard) chemKeyboard.style.display = 'none';
            if (keyboard !== physicsKeyboard) physicsKeyboard.style.display = 'none';
            
            // Remove active class from other buttons
            if (button !== mathKeyboardBtn) mathKeyboardBtn.classList.remove('active');
            if (button !== chemKeyboardBtn) chemKeyboardBtn.classList.remove('active');
            if (button !== physicsKeyboardBtn) physicsKeyboardBtn.classList.remove('active');
        }
    }
    
    // Add click event listeners to keyboard buttons
    mathKeyboardBtn.addEventListener('click', function() {
        console.log('Math keyboard button clicked');
        toggleKeyboard(mathKeyboard, mathKeyboardBtn);
    });
    
    chemKeyboardBtn.addEventListener('click', function() {
        console.log('Chemistry keyboard button clicked');
        toggleKeyboard(chemKeyboard, chemKeyboardBtn);
    });
    
    physicsKeyboardBtn.addEventListener('click', function() {
        console.log('Physics keyboard button clicked');
        toggleKeyboard(physicsKeyboard, physicsKeyboardBtn);
    });
    
    // Handle keyboard button clicks
    function handleKeyboardButtonClick(event) {
        if (event.target.classList.contains('keyboard-btn')) {
            const symbol = event.target.textContent;
            const cursorPos = problemInput.selectionStart;
            const textBefore = problemInput.value.substring(0, cursorPos);
            const textAfter = problemInput.value.substring(cursorPos);
            
            // Insert the symbol at cursor position
            problemInput.value = textBefore + symbol + textAfter;
            
            // Set cursor position after the inserted symbol
            const newCursorPos = cursorPos + symbol.length;
            problemInput.focus();
            problemInput.setSelectionRange(newCursorPos, newCursorPos);
            
            // Add visual feedback
            event.target.classList.add('clicked');
            setTimeout(() => event.target.classList.remove('clicked'), 200);
        }
    }
    
    // Add click event listeners to all keyboard sections
    mathKeyboard.addEventListener('click', handleKeyboardButtonClick);
    chemKeyboard.addEventListener('click', handleKeyboardButtonClick);
    physicsKeyboard.addEventListener('click', handleKeyboardButtonClick);
});

// File Upload and Folder Management
const folderNameInput = document.getElementById('folderName');
const createFolderBtn = document.getElementById('createFolderBtn');
const folderList = document.getElementById('folderList');
const currentFolderSelect = document.getElementById('currentFolder');
const uploadForm = document.getElementById('uploadForm');
const fileList = document.getElementById('fileList');
const selectedFilesSelect = document.getElementById('selectedFiles');
const solveFromFilesBtn = document.getElementById('solveFromFilesBtn');
const fileSolution = document.getElementById('fileSolution');
const fileSolutionContent = document.getElementById('fileSolutionContent');

// Load folders and files
function loadFolders() {
    fetch('/api/folders')
        .then(response => response.json())
        .then(folders => {
            // Update folder list
            folderList.innerHTML = folders.map(folder => `
                <a href="#" class="list-group-item list-group-item-action folder-item" data-folder-id="${folder._id}">
                    <i class="bi bi-folder"></i> ${folder.name}
                </a>
            `).join('');

            // Update folder select options
            currentFolderSelect.innerHTML = `
                <option value="root">Root</option>
                ${folders.map(folder => `
                    <option value="${folder._id}">${folder.name}</option>
                `).join('')}
            `;

            // Add click event listeners to folder items
            document.querySelectorAll('.folder-item').forEach(item => {
                item.addEventListener('click', function() {
                    const folderId = this.getAttribute('data-folder-id');
                    loadFiles(folderId);
                    // Update current folder selection
                    currentFolderSelect.value = folderId;
                });
            });
        })
        .catch(error => console.error('Error loading folders:', error));
}

// Create new folder
createFolderBtn.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent form submission
    const folderName = folderNameInput.value.trim();
    console.log('Attempting to create folder:', folderName); // Debug log
    
    if (folderName) {
        fetch('/api/folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: folderName })
        })
        .then(response => {
            console.log('Response status:', response.status); // Debug log
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Failed to create folder');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Folder created successfully:', data); // Debug log
            folderNameInput.value = '';
            loadFolders();
        })
        .catch(error => {
            console.error('Error creating folder:', error);
            alert(error.message || 'Error creating folder. Please try again.');
        });
    } else {
        alert('Please enter a folder name');
    }
});

// Handle file upload
uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData();
    const files = document.getElementById('fileInput').files;
    const folderId = currentFolderSelect.value;

    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
    formData.append('folderId', folderId);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(() => {
        loadFiles(folderId);
        document.getElementById('fileInput').value = '';
    })
    .catch(error => console.error('Error uploading files:', error));
});

// Load files in current folder
function loadFiles(folderId) {
    fetch(`/api/files?folderId=${folderId}`)
        .then(response => response.json())
        .then(files => {
            fileList.innerHTML = files.map(file => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi ${getFileIcon(file.type)}"></i>
                            ${file.filename}
                        </div>
                        <div>
                            <small class="text-muted">${formatDate(file.uploadDate)}</small>
                            <button class="btn btn-sm btn-danger ms-2" onclick="deleteFile('${file._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Update selected files for problem solving
            selectedFilesSelect.innerHTML = files
                .filter(file => file.type === 'application/pdf' || file.type.startsWith('image/'))
                .map(file => `
                    <option value="${file._id}">${file.filename}</option>
                `).join('');
        })
        .catch(error => console.error('Error loading files:', error));
}

// Solve problem from selected files
solveFromFilesBtn.addEventListener('click', function() {
    const selectedFileIds = Array.from(selectedFilesSelect.selectedOptions).map(option => option.value);
    const problemType = document.getElementById('problemType').value;

    if (selectedFileIds.length === 0) {
        alert('Please select at least one file');
        return;
    }

    fetch('/api/solve-from-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileIds: selectedFileIds,
            problemType: problemType
        })
    })
    .then(response => response.json())
    .then(data => {
        fileSolution.style.display = 'block';
        fileSolutionContent.innerHTML = formatSolution(data.solution);
    })
    .catch(error => console.error('Error solving problem:', error));
});

// Helper functions
function getFileIcon(fileType) {
    if (fileType === 'application/pdf') return 'bi-file-pdf';
    if (fileType.startsWith('image/')) return 'bi-file-image';
    return 'bi-file';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

function formatSolution(solution) {
    return `
        <div class="solution-section">
            <h5>Problem Statement</h5>
            <p>${solution.problem}</p>
        </div>
        <div class="solution-section">
            <h5>Solution Steps</h5>
            <ol class="solution-steps">
                ${solution.steps.map(step => `<li>${step}</li>`).join('')}
            </ol>
        </div>
        <div class="solution-section">
            <h5>Final Answer</h5>
            <p class="final-answer">${solution.answer}</p>
        </div>
        <div class="solution-section">
            <h5>Verification</h5>
            <p>${solution.verification}</p>
        </div>
    `;
}

// Initial load
document.addEventListener('DOMContentLoaded', function() {
    loadFolders();
    loadFiles('root');
}); 
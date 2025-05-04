document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    loadFiles();
});

// Load available courses
async function loadCourses() {
    try {
        const response = await fetch('/api/course-folders');
        const courses = await response.json();
        
        const courseSelect = document.getElementById('courseSelect');
        courseSelect.innerHTML = '<option value="">Select a course</option>';
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course._id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading courses:', error);
        alert('An error occurred while loading courses');
    }
}

// Load files
async function loadFiles() {
    try {
        const response = await fetch('/api/course-files');
        const files = await response.json();
        
        const filesList = document.getElementById('filesList');
        filesList.innerHTML = '';
        
        if (files.length === 0) {
            filesList.innerHTML = '<p class="text-center text-muted">No files uploaded yet</p>';
            return;
        }

        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item d-flex align-items-center';
            fileItem.innerHTML = `
                <div class="file-icon">
                    <i class="bi bi-file-earmark-${getFileIcon(file.file_type)}"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.filename}</div>
                    <div class="file-meta">
                        ${formatFileSize(file.file_size)} • 
                        ${new Date(file.upload_date).toLocaleString()}
                    </div>
                </div>
                <button class="btn btn-danger ms-auto" onclick="deleteFile('${file._id}')">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            filesList.appendChild(fileItem);
        });
    } catch (error) {
        console.error('Error loading files:', error);
        alert('An error occurred while loading files');
    }
}

// Handle file upload
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const courseId = document.getElementById('courseSelect').value;
    const files = document.getElementById('fileUpload').files;
    
    if (!courseId) {
        alert('Please select a course');
        return;
    }
    
    if (files.length === 0) {
        alert('Please select at least one file');
        return;
    }

    const formData = new FormData();
    formData.append('course_id', courseId);
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    try {
        const response = await fetch('/api/course-upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('Files uploaded successfully');
            document.getElementById('fileUpload').value = '';
            loadFiles();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to upload files');
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        alert('An error occurred while uploading files');
    }
});

// Delete file
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    try {
        const response = await fetch(`/api/course-files/${fileId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('File deleted successfully');
            loadFiles();
        } else {
            const error = await response.json();
            alert(error.error || 'Failed to delete file');
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        alert('An error occurred while deleting the file');
    }
}

// Get appropriate file icon based on file type
function getFileIcon(fileType) {
    switch (fileType.toLowerCase()) {
        case 'pdf':
            return 'pdf';
        case 'jpg':
        case 'jpeg':
        case 'png':
            return 'image';
        default:
            return 'text';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
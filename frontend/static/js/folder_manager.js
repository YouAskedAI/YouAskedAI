document.addEventListener('DOMContentLoaded', function() {
    const folderManagerForm = document.getElementById('folderManagerForm');
    const fileUploadForm = document.getElementById('fileUploadForm');
    const folderList = document.getElementById('folderList');
    const selectedFolder = document.getElementById('selectedFolder');
    const filesList = document.getElementById('filesList');

    let currentFolderId = null;

    // Handle folder creation
    folderManagerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const folderName = document.getElementById('folderName').value;

        if (!folderName) {
            alert('Please enter a folder name');
            return;
        }

        try {
            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: folderName
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Folder created successfully!');
                folderManagerForm.reset();
                loadFolders();
            } else {
                alert(data.error || 'Failed to create folder');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the folder');
        }
    });

    // Handle file upload
    fileUploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const folderId = selectedFolder.value;
        const fileInput = document.getElementById('fileInput');
        const files = fileInput.files;

        if (!folderId) {
            alert('Please select a folder');
            return;
        }

        if (files.length === 0) {
            alert('Please select at least one file');
            return;
        }

        const formData = new FormData();
        formData.append('folder_id', folderId);
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                alert('Files uploaded successfully!');
                fileUploadForm.reset();
                loadFiles(folderId);
            } else {
                alert(data.error || 'Failed to upload files');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while uploading files');
        }
    });

    // Load folders
    async function loadFolders() {
        try {
            const response = await fetch('/api/folders');
            if (response.ok) {
                const folders = await response.json();
                displayFolders(folders);
                updateFolderSelect(folders);
            }
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    }

    // Display folders in the list
    function displayFolders(folders) {
        folderList.innerHTML = '';
        folders.forEach(folder => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = `list-group-item list-group-item-action ${folder._id === currentFolderId ? 'active' : ''}`;
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-folder"></i>
                        ${folder.name}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger" onclick="deleteFolder('${folder._id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            item.addEventListener('click', () => {
                currentFolderId = folder._id;
                loadFiles(folder._id);
                document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            });
            folderList.appendChild(item);
        });
    }

    // Update folder select dropdown
    function updateFolderSelect(folders) {
        selectedFolder.innerHTML = '<option value="">Choose a folder...</option>';
        folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder._id;
            option.textContent = folder.name;
            selectedFolder.appendChild(option);
        });
    }

    // Load files in selected folder
    async function loadFiles(folderId) {
        try {
            const response = await fetch(`/api/folders/${folderId}/files`);
            if (response.ok) {
                const files = await response.json();
                displayFiles(files);
            }
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    // Display files in the table
    function displayFiles(files) {
        filesList.innerHTML = '';
        files.forEach(file => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${file.filename}</td>
                <td>${file.file_type}</td>
                <td>${formatFileSize(file.file_size)}</td>
                <td>${new Date(file.upload_date).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewFile('${file._id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFile('${file._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            filesList.appendChild(row);
        });
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Load folders when the page loads
    loadFolders();
}); 
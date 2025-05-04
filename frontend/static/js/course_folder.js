document.addEventListener('DOMContentLoaded', function() {
    const courseFolderForm = document.getElementById('courseFolderForm');
    const courseFoldersList = document.getElementById('courseFoldersList');

    // Handle form submission
    courseFolderForm.addEventListener('submit', async function(e) {
        e.preventDefault(); // Prevent form from submitting normally
        
        const courseName = document.getElementById('courseName').value;

        if (!courseName) {
            alert('Please enter a course name');
            return;
        }

        try {
            console.log('Sending course folder creation request...');
            const response = await fetch('/api/course-folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course_name: courseName
                })
            });

            const data = await response.json();
            console.log('Response received:', data);

            if (response.ok) {
                alert('Course folder created successfully!');
                courseFolderForm.reset();
                loadCourseFolders(); // Refresh the list
            } else {
                alert(data.error || 'Failed to create course folder');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while creating the course folder');
        }
    });

    // Load course folders
    async function loadCourseFolders() {
        try {
            console.log('Loading course folders...');
            const response = await fetch('/api/course-folders');
            if (response.ok) {
                const folders = await response.json();
                console.log('Loaded folders:', folders);
                displayCourseFolders(folders);
            } else {
                console.error('Failed to load course folders');
            }
        } catch (error) {
            console.error('Error loading course folders:', error);
        }
    }

    // Display course folders in the table
    function displayCourseFolders(folders) {
        courseFoldersList.innerHTML = '';
        folders.forEach(folder => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${folder.course_name}</td>
                <td>${new Date(folder.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewFolder('${folder._id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteFolder('${folder._id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            courseFoldersList.appendChild(row);
        });
    }

    // Load folders when the page loads
    loadCourseFolders();
}); 
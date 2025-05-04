import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Form, Table, Alert } from 'react-bootstrap';
import { FaUpload, FaTrash, FaFolderPlus } from 'react-icons/fa';

interface CourseFile {
    filename: string;
    content_type: string;
    size: number;
    text_content?: string;
    created_at: string;
    updated_at: string;
}

interface Course {
    name: string;
    created_at: string;
    updated_at: string;
    files: CourseFile[];
}

const CourseManager: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [files, setFiles] = useState<CourseFile[]>([]);
    const [newCourseName, setNewCourseName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    const loadCourses = async () => {
        try {
            const response = await fetch('/api/courses', {
                headers: {
                    'Authorization': `Bearer ${await currentUser?.getIdToken()}`
                }
            });
            if (!response.ok) throw new Error('Failed to load courses');
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            setError('Failed to load courses');
        }
    };

    const loadFiles = async (courseName: string) => {
        try {
            const response = await fetch(`/api/courses/${courseName}/files`, {
                headers: {
                    'Authorization': `Bearer ${await currentUser?.getIdToken()}`
                }
            });
            if (!response.ok) throw new Error('Failed to load files');
            const data = await response.json();
            setFiles(data);
        } catch (err) {
            setError('Failed to load files');
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/courses/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await currentUser?.getIdToken()}`
                },
                body: JSON.stringify({ name: newCourseName })
            });
            if (!response.ok) throw new Error('Failed to create course');
            setSuccess('Course created successfully');
            setNewCourseName('');
            loadCourses();
        } catch (err) {
            setError('Failed to create course');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedCourse || !e.target.files?.length) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`/api/courses/${selectedCourse}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${await currentUser?.getIdToken()}`
                },
                body: formData
            });
            if (!response.ok) throw new Error('Failed to upload file');
            setSuccess('File uploaded successfully');
            loadFiles(selectedCourse);
        } catch (err) {
            setError('Failed to upload file');
        }
    };

    const handleDeleteFile = async (filename: string) => {
        try {
            const response = await fetch(`/api/courses/${selectedCourse}/files/${filename}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${await currentUser?.getIdToken()}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete file');
            setSuccess('File deleted successfully');
            loadFiles(selectedCourse);
        } catch (err) {
            setError('Failed to delete file');
        }
    };

    return (
        <div className="container mt-4">
            <h2>Course Manager</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Card className="mb-4">
                <Card.Body>
                    <Form onSubmit={handleCreateCourse}>
                        <Form.Group>
                            <Form.Label>Create New Course</Form.Label>
                            <div className="d-flex">
                                <Form.Control
                                    type="text"
                                    value={newCourseName}
                                    onChange={(e) => setNewCourseName(e.target.value)}
                                    placeholder="Enter course name"
                                    required
                                />
                                <Button type="submit" variant="primary" className="ms-2">
                                    <FaFolderPlus /> Create
                                </Button>
                            </div>
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Card>

            <Card className="mb-4">
                <Card.Body>
                    <Form.Group>
                        <Form.Label>Select Course</Form.Label>
                        <Form.Select
                            value={selectedCourse}
                            onChange={(e) => {
                                setSelectedCourse(e.target.value);
                                loadFiles(e.target.value);
                            }}
                        >
                            <option value="">Select a course</option>
                            {courses.map((course) => (
                                <option key={course.name} value={course.name}>
                                    {course.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Card.Body>
            </Card>

            {selectedCourse && (
                <Card>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4>Files in {selectedCourse}</h4>
                            <div>
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="primary"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <FaUpload /> Upload File
                                </Button>
                            </div>
                        </div>

                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Filename</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map((file) => (
                                    <tr key={file.filename}>
                                        <td>{file.filename}</td>
                                        <td>{file.content_type}</td>
                                        <td>{(file.size / 1024).toFixed(2)} KB</td>
                                        <td>{new Date(file.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDeleteFile(file.filename)}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default CourseManager; 
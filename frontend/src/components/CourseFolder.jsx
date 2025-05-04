import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import FileUploader from './FileUploader';

export default function CourseFolder({ courseId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMaterials();
  }, [courseId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const materialsRef = collection(db, 'course-materials');
      const q = query(materialsRef, where('courseId', '==', courseId));
      const querySnapshot = await getDocs(q);
      
      const materialsList = [];
      querySnapshot.forEach((doc) => {
        materialsList.push({ id: doc.id, ...doc.data() });
      });
      
      setMaterials(materialsList);
    } catch (error) {
      setError('Error loading materials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId) => {
    try {
      await deleteDoc(doc(db, 'course-materials', materialId));
      setMaterials(materials.filter(m => m.id !== materialId));
    } catch (error) {
      setError('Error deleting material: ' + error.message);
    }
  };

  const handleUploadComplete = (fileInfo) => {
    setMaterials([...materials, fileInfo]);
  };

  if (loading) {
    return <div className="text-center">Loading materials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Course Material</h3>
        <FileUploader onUploadComplete={handleUploadComplete} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {materials.map((material) => (
              <li key={material.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-500">{material.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useEffect, useState } from 'react';
import { getAllPrescriptions, Prescription as PrescriptionType } from '@/services/prescription';
import { deletePatient, updatePatient } from '@/services/patients';
import Link from 'next/link';

// Group prescriptions by patient name to create a patient list
interface Patient {
  id: string;
  name: string;
  phone_number: string;
  age: string;
  sex: string;
  latestVisit: string;
  totalVisits: number;
  prescriptions: PrescriptionType[];
}

const ViewPatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const patientsPerPage = 10;

  // Add new state for edit form
  const [editForm, setEditForm] = useState({
    name: '',
    phone_number: '',
    age: '',
    sex: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Filter patients when search term changes
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone_number.includes(searchTerm) // Also search by phone number
      );
      setFilteredPatients(filtered);
    }
    setCurrentPage(1); // Reset to first page on new search
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const prescriptions = await getAllPrescriptions();
      const patientMap = new Map<string, Patient>();
      
      // Group prescriptions by phone_number, falling back to name if phone is not available
      prescriptions.forEach(prescription => {
        // Use phone_number as key, or fall back to name if phone is not available
        const key = prescription.phone_number || `name:${prescription.patient_name}`;
        
        if (!patientMap.has(key)) {
          patientMap.set(key, {
            id: Math.random().toString(36).substring(2, 9), // Simple unique ID for patient 
            name: prescription.patient_name,
            phone_number: prescription.phone_number || 'Unknown', // Handle missing phone numbers
            age: prescription.age,
            sex: prescription.sex,
            latestVisit: prescription.prescription_date,
            totalVisits: 1,
            prescriptions: [prescription]
          });
        } else {
          const patient = patientMap.get(key)!;
          patient.totalVisits += 1;
          patient.prescriptions.push(prescription);
          
          // Update latest visit date if this prescription is newer
          if (new Date(prescription.prescription_date) > new Date(patient.latestVisit)) {
            patient.latestVisit = prescription.prescription_date;
            patient.age = prescription.age; // Update age to latest record
            // Also ensure name is updated from the latest record
            patient.name = prescription.patient_name;
            
            // If we have a phone number in this prescription but not in the patient record, update it
            if (prescription.phone_number && patient.phone_number === 'Unknown') {
              patient.phone_number = prescription.phone_number;
            }
          }
          
          patientMap.set(key, patient);
        }
      });
      
      // Convert map to array and sort by latest visit date (newest first)
      const patientList = Array.from(patientMap.values()).sort((a, b) => 
        new Date(b.latestVisit).getTime() - new Date(a.latestVisit).getTime()
      );
      
      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (err) {
      console.error('Failed to fetch prescriptions:', err);
      setError('Failed to load patient data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openPatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Add new functions for edit and delete
  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setEditForm({
      name: patient.name,
      phone_number: patient.phone_number,
      age: patient.age,
      sex: patient.sex
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (patient: Patient) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(patient.id);
        // Refresh the patient list
        fetchPatients();
      } catch (err) {
        console.error('Failed to delete patient:', err);
        setError('Failed to delete patient. Please try again.');
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    try {
      await updatePatient(editingPatient.id, {
        ...editForm,
        age: parseInt(editForm.age, 10)
      });
      setIsEditModalOpen(false);
      // Refresh the patient list
      fetchPatients();
    } catch (err) {
      console.error('Failed to update patient:', err);
      setError('Failed to update patient. Please try again.');
    }
  };

  return (
    <div className="w-[80vw] mx-auto mt-8 p-4">
      <h2 className="text-3xl font-bold mb-8 text-center text-blue-700 border-b pb-4">Patient Records</h2>

      {/* Search and Actions Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/admin/prescription">
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition shadow-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Prescription
            </button>
          </Link>

          <button
            onClick={() => fetchPatients()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition shadow-sm flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
          <h4 className="text-lg font-semibold text-blue-800 mb-1">Total Patients</h4>
          <p className="text-3xl font-bold text-blue-700">{patients.length}</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 shadow-sm">
          <h4 className="text-lg font-semibold text-purple-800 mb-1">Total Consultations</h4>
          <p className="text-3xl font-bold text-purple-700">
            {patients.reduce((sum, patient) => sum + patient.totalVisits, 0)}
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm">
          <h4 className="text-lg font-semibold text-green-800 mb-1">Patients This Month</h4>
          <p className="text-3xl font-bold text-green-700">
            {patients.filter(patient => {
              const today = new Date();
              const visitDate = new Date(patient.latestVisit);
              return visitDate.getMonth() === today.getMonth() &&
                visitDate.getFullYear() === today.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Loading patient data...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={() => fetchPatients()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-10 text-center text-gray-600">
            <p>No patients found. {searchTerm ? "Try a different search term." : ""}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sex</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{patient.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.age}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.sex}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{formatDate(patient.latestVisit)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{patient.totalVisits}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPatientDetails(patient)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleEdit(patient)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(patient)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
                        >
                          Delete
                        </button>
                        <Link href={`/admin/prescription?patientName=${encodeURIComponent(patient.name)}&phone=${encodeURIComponent(patient.phone_number)}&age=${patient.age}&sex=${patient.sex}&medicalHistory=${encodeURIComponent(patient.prescriptions[0]?.medical_history || '')}&chiefComplaint=${encodeURIComponent(patient.prescriptions[0]?.chief_complaint || '')}&diagnosis=${encodeURIComponent(patient.prescriptions[0]?.diagnosis || '')}`}>
                          <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition">
                            New Prescription
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && filteredPatients.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstPatient + 1}</span> to{" "}
                <span className="font-medium">
                  {Math.min(indexOfLastPatient, filteredPatients.length)}
                </span>{" "}
                of <span className="font-medium">{filteredPatients.length}</span> patients
              </div>

              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  const pageNum = currentPage <= 3
                    ? idx + 1
                    : currentPage >= totalPages - 2
                      ? totalPages - 4 + idx
                      : currentPage - 2 + idx;

                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-600 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              {/* Modal Header */}
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white" id="modal-headline">
                  Patient Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-white hover:text-gray-300 focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">Patient Information</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedPatient.name}</p>
                        <p><span className="font-medium">Phone:</span> {selectedPatient.phone_number}</p>
                        <p><span className="font-medium">Age:</span> {selectedPatient.age}</p>
                        <p><span className="font-medium">Sex:</span> {selectedPatient.sex}</p>
                        <p><span className="font-medium">Latest Visit:</span> {formatDate(selectedPatient.latestVisit)}</p>
                        <p><span className="font-medium">Total Visits:</span> {selectedPatient.totalVisits}</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">Medical Summary</h4>
                      <div className="space-y-2">
                        <p><span className="font-medium">Last Diagnoses:</span> {selectedPatient.prescriptions[0].diagnosis || 'N/A'}</p>
                        <p><span className="font-medium">Medical History:</span> {selectedPatient.prescriptions[0].medical_history || 'N/A'}</p>
                        <p><span className="font-medium">Last Follow-up Date:</span> {selectedPatient.prescriptions[0].followup_date ? formatDate(selectedPatient.prescriptions[0].followup_date) : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prescription History */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Prescription History</h4>

                  <div className="space-y-4 mt-4">
                    {selectedPatient.prescriptions.sort((a, b) =>
                      new Date(b.prescription_date).getTime() - new Date(a.prescription_date).getTime()
                    ).map((prescription, index) => (
                      <div key={prescription.id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 flex justify-between items-center">
                          <h5 className="font-medium text-gray-800">Visit: {formatDate(prescription.prescription_date)}</h5>
                          <div className="text-sm text-gray-500">
                            {prescription.followup_date ? (
                              <span className="inline-flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Follow-up: {formatDate(prescription.followup_date)}
                              </span>
                            ) : 'No follow-up scheduled'}
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div>
                              <h6 className="text-sm font-semibold text-gray-600">Chief Complaint:</h6>
                              <p className="text-gray-800">{prescription.chief_complaint || 'None recorded'}</p>
                            </div>

                            <div>
                              <h6 className="text-sm font-semibold text-gray-600">Diagnosis:</h6>
                              <p className="text-gray-800">{prescription.diagnosis || 'None recorded'}</p>
                            </div>
                          </div>

                          {/* Oral Examination Details */}
                          {(prescription.oral_exam_notes || (prescription.selected_teeth && prescription.selected_teeth.length > 0)) && (
                            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                              <h6 className="text-sm font-semibold text-indigo-800">Oral Examination:</h6>

                              {prescription.selected_teeth && prescription.selected_teeth.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-indigo-700">Selected Teeth:</p>
                                  <p className="text-gray-700">
                                    {prescription.selected_teeth.map((tooth) => 
                                      `#${tooth.id} (${tooth.type})${tooth.disease ? ` - ${tooth.disease}` : ''}`
                                    ).join(', ')}
                                  </p>
                                </div>
                              )}

                              {prescription.oral_exam_notes && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-indigo-700">Notes:</p>
                                  <p className="text-gray-700">{prescription.oral_exam_notes}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Prescribed Medicines */}
                          <div className="mb-3">
                            <h6 className="text-sm font-semibold text-gray-600 mb-2">Prescribed Medicines:</h6>

                            {prescription.medicines && prescription.medicines.length > 0 ? (
                              <div className="border rounded-md overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {prescription.medicines.map((medicine, idx) => (
                                      <tr key={idx}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{medicine.name}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{medicine.dosage}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{medicine.duration}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No medicines prescribed</p>
                            )}
                          </div>

                          {/* Advice */}
                          {prescription.advice && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-600">Advice:</h6>
                              <p className="text-gray-800">{prescription.advice}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Link href={`/admin/prescription?patientName=${encodeURIComponent(selectedPatient.name)}&age=${selectedPatient.age}&sex=${selectedPatient.sex}&medicalHistory=${encodeURIComponent(selectedPatient.prescriptions[0].medical_history || '')}&chiefComplaint=${encodeURIComponent(selectedPatient.prescriptions[0].chief_complaint || '')}&diagnosis=${encodeURIComponent(selectedPatient.prescriptions[0].diagnosis || '')}`}>
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Create New Prescription
                  </button>
                </Link>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Edit Modal */}
      {isEditModalOpen && editingPatient && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsEditModalOpen(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditSubmit}>
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-white">
                    Edit Patient
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-white hover:text-gray-300 focus:outline-none"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        value={editForm.phone_number}
                        onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                      <input
                        type="text"
                        id="age"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex</label>
                      <select
                        id="sex"
                        value={editForm.sex}
                        onChange={(e) => setEditForm({ ...editForm, sex: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select sex</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewPatients;

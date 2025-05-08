'use client';

import React, { useEffect, useState } from 'react';
import { getAllMedicines } from '@/services/medicine';
import { Medicine } from '@/services/medicine';
import { addPrescription, Prescription } from '@/services/prescription';
import { getOrCreatePatient } from '@/services/patients';
import { Patient } from '@/types/patient';
import BillForm from '@/components/BillForm';
import { ToothData as TeethChartToothData } from '@/components/TeethChart';

interface MedicineEntry {
  name: string;
  dosage: string;
  duration: string;
}



// Define dental disease options
const DENTAL_DISEASES = [
  "Dental Caries",
  "Gingivitis",
  "Periodontitis",
  "Pulpitis",
  "Dental Abscess",
  "Tooth Fracture",
  "Root Canal Infection",
  "Enamel Erosion",
  "Dental Hypersensitivity",
  "Malocclusion",
  "Impacted Tooth",
  "Dental Fluorosis",
  "Bruxism (Teeth Grinding)",
  "Temporomandibular Joint Disorder (TMJ)",
  "Oral Candidiasis",
  "Dental Plaque",
  "Dental Calculus",
  "Tooth Discoloration"
];

// Define quadrants
const DENTAL_QUADRANTS = [
  { id: 1, name: "Upper Right Quadrant" },
  { id: 2, name: "Upper Left Quadrant" },
  { id: 3, name: "Lower Left Quadrant" },
  { id: 4, name: "Lower Right Quadrant" }
];

// Define tooth numbers by quadrant
const TEETH_BY_QUADRANT = {
  1: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, name: `Tooth ${i + 1}` })),
  2: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, name: `Tooth ${i + 1}` })),
  3: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, name: `Tooth ${i + 1}` })),
  4: Array.from({ length: 8 }, (_, i) => ({ number: i + 1, name: `Tooth ${i + 1}` }))
};

// Define ToothData interface to match existing functionality
interface ToothData {
  id: number;
  type: string;
  category: string;
  disease: string;
}

interface FormData {
  patientName: string;
  age: string;
  sex: string;
  phoneNumber: string;
  date: string;
  cc: string;
  mh: string;
  de: string;
  advice: string;
  followupDate: string;
}

const PrescriptionPage = () => {
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    age: '',
    sex: '',
    phoneNumber: '',
    date: new Date().toISOString().slice(0, 10),
    cc: '',
    mh: '',
    de: '',
    advice: '',
    followupDate: '',
  });

  const [medicines, setMedicines] = useState<MedicineEntry[]>([
    { name: '', dosage: '', duration: '' }
  ]);
  
  // New states for teeth selection
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null);
  const [selectedToothNumber, setSelectedToothNumber] = useState<number | null>(null);
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [selectedTeeth, setSelectedTeeth] = useState<ToothData[]>([]);
  
  // State for oral examination notes
  const [oralExamNotes, setOralExamNotes] = useState<string>('');
  
  const [medicineOptions, setMedicineOptions] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  // State for showing/hiding bill form
  const [showBillForm, setShowBillForm] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const data = await getAllMedicines();
        setMedicineOptions(data);
      } catch (err) {
        console.error('Failed to fetch medicines:', err);
      }
    };
    
    fetchMedicines();

    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    // Reset the success message after 3 seconds
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleMedicineChange = (index: number, field: keyof MedicineEntry, value: string) => {
    setMedicines(prevMedicines => {
      const updatedMedicines = [...prevMedicines];
      updatedMedicines[index] = {
        ...updatedMedicines[index],
        [field]: value
      };
      return updatedMedicines;
    });
  };

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      const updatedMedicines = [...medicines];
      updatedMedicines.splice(index, 1);
      setMedicines(updatedMedicines);
    }
  };

  // Handler for adding a tooth to the selected teeth list
  const handleAddTooth = () => {
    if (selectedQuadrant && selectedToothNumber && selectedDisease) {
      const toothId = parseInt(`${selectedQuadrant}${selectedToothNumber}`, 10);
      const quadrantName = DENTAL_QUADRANTS.find(q => q.id === selectedQuadrant)?.name || '';
      const toothType = `Tooth ${selectedToothNumber}`;
      
      // Check if this tooth is already in the list
      const existingToothIndex = selectedTeeth.findIndex(tooth => tooth.id === toothId);
      
      if (existingToothIndex >= 0) {
        // Update existing tooth with new disease
        const updatedTeeth = [...selectedTeeth];
        updatedTeeth[existingToothIndex].disease = selectedDisease;
        setSelectedTeeth(updatedTeeth);
      } else {
        // Add new tooth to the list
        const newTooth: ToothData = {
          id: toothId,
          type: toothType,
          category: quadrantName,
          disease: selectedDisease
        };
        
        setSelectedTeeth([...selectedTeeth, newTooth]);
      }
      
      // Reset the selection fields
      setSelectedDisease('');
    }
  };

  // Handler for removing a tooth from the selected list
  const handleRemoveTooth = (toothId: number) => {
    const updatedTeeth = selectedTeeth.filter(tooth => tooth.id !== toothId);
    setSelectedTeeth(updatedTeeth);
  };

  // Modified function to save prescription to the database
  const savePrescriptionToDatabase = async () => {
    try {
      setSaving(true);
      
      // Prepare patient data
      const patientData: Omit<Patient, 'id' | 'created_at'> = {
        name: formData.patientName,
        age: parseInt(formData.age, 10),
        sex: formData.sex,
        phone_number: formData.phoneNumber
      };
      
      // Use the new getOrCreatePatient function to either get an existing patient or create a new one
      await getOrCreatePatient(patientData);
      
      // Format the prescription data according to the Prescription interface
      const prescriptionData: Prescription = {
        patient_name: formData.patientName,
        phone_number: formData.phoneNumber,
        age: formData.age,
        sex: formData.sex,
        prescription_date: formData.date,
        chief_complaint: formData.cc,
        medical_history: formData.mh,
        diagnosis: formData.de,
        oral_exam_notes: oralExamNotes,
        selected_teeth: selectedTeeth,
        medicines: medicines,
        advice: formData.advice,
        followup_date: formData.followupDate || undefined,
      };
      
      // Save to database
      await addPrescription(prescriptionData);
      setSaveSuccess(true);
    } catch (err) {
      console.error('Failed to save prescription:', err);
      
      // Extract the error message properly
      let errorMessage = 'An unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
      alert('Failed to save prescription: ' + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Format teeth information for prescription in a more technical, concise way
      const teethInfo = selectedTeeth.length > 0 
        ? selectedTeeth.reduce((acc, tooth) => {
            return `${acc}${acc ? ', ' : ''}#${tooth.id} (${tooth.disease})`;
          }, '')
        : '';
      
      // Prepare data for API, considering the pre-existing template fields
      const prescriptionData = {
        ...formData,
        medicines,
        dentalNotation: teethInfo,
        clinicalNotes: oralExamNotes
          ? `${formData.de}${formData.de ? '; ' : ''}${oralExamNotes}`
          : formData.de
      };
      
      const res = await fetch('/api/generate-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionData),
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate prescription');
      }
      
      const blob = await res.blob();
      
      // Clean up old URL if it exists
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
      
      // Create new URL
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // After successfully generating PDF, also save to database
      await savePrescriptionToDatabase();
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate prescription PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl || !formData.patientName) return;
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `prescription-${formData.patientName}-${formData.date}.pdf`;
    a.click();
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    
    const printWindow = window.open(pdfUrl);
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };
  
  // Function to toggle bill form
  const toggleBillForm = () => {
    setShowBillForm(!showBillForm);
  };

  // Modified useEffect to include pdfUrl in dependencies
  useEffect(() => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `prescription-${formData.patientName}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    }
  }, [pdfUrl, formData.patientName]);

  // Only run this effect once on mount to prefill form data from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const newFormData: FormData = {
        patientName: params.get('patientName') || '',
        age: params.get('age') || '',
        sex: params.get('sex') || '',
        phoneNumber: params.get('phoneNumber') || '',
        date: formData.date, // keep current date
        cc: params.get('chiefComplaint') || '',
        mh: params.get('medicalHistory') || '',
        de: params.get('diagnosis') || '',
        advice: '',
        followupDate: '',
      };
      setFormData(prev => ({ ...prev, ...newFormData }));
    }
  }, []); // Only run once on mount

  return (
    <div className="w-[80vw] mx-auto mt-8 p-4">
      {/* Show Bill Form when toggled */}
      {showBillForm ? (
        <BillForm 
          patientData={{
            name: formData.patientName,
            age: formData.age, // Keep as string since BillForm expects string
            sex: formData.sex,
            date: formData.date,
          }}
          diagnosis={formData.de}
          medicines={medicines}
          selectedTeeth={selectedTeeth as TeethChartToothData[]}
          onBack={toggleBillForm}
        />
      ) : (
        <>
          <h2 className="text-3xl font-bold mb-8 text-center text-blue-700 border-b pb-4">Create Prescription</h2>
          
          {/* Success Message */}
          {saveSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <p className="font-medium">Prescription saved successfully to the database!</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Information Section */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-xl font-semibold mb-4 text-blue-800">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input 
                    type="text" 
                    name="patientName" 
                    value={formData.patientName} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required 
                    placeholder="Enter patient's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={formData.date} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input 
                    type="number" 
                    name="age" 
                    value={formData.age} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required 
                    placeholder="Years"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                {/* Added Phone Number Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="tel"
                    id="phone_number" 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Enter patient's phone number"
                  />
                </div>
              </div>
            </div>
            
            {/* Medical Information Section */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-100">
              <h3 className="text-xl font-semibold mb-4 text-green-800">Medical Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint (C/C)</label>
                  <textarea 
                    name="cc" 
                    value={formData.cc} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    rows={3}
                    placeholder="Patient's main complaint"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medical/Dental History (M/H)</label>
                  <textarea 
                    name="mh" 
                    value={formData.mh} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    rows={3}
                    placeholder="Relevant medical history"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis (D/E)</label>
                  <textarea 
                    name="de" 
                    value={formData.de} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    rows={3}
                    placeholder="Clinical diagnosis"
                  />
                </div>
              </div>
            </div>
            
            {/* Oral Examination Section with Dropdown Selection */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
              <h3 className="text-xl font-semibold mb-4 text-indigo-800">Oral Examination</h3>
              
              {/* Dropdown Selection for Teeth */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quadrant</label>
                  <select
                    value={selectedQuadrant || ''}
                    onChange={(e) => {
                      setSelectedQuadrant(e.target.value ? parseInt(e.target.value) : null);
                      setSelectedToothNumber(null); // Reset tooth number when quadrant changes
                    }}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Quadrant</option>
                    {DENTAL_QUADRANTS.map((quadrant) => (
                      <option key={quadrant.id} value={quadrant.id}>
                        {quadrant.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tooth Number</label>
                  <select
                    value={selectedToothNumber || ''}
                    onChange={(e) => setSelectedToothNumber(e.target.value ? parseInt(e.target.value) : null)}
                    disabled={!selectedQuadrant}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Tooth</option>
                    {selectedQuadrant && TEETH_BY_QUADRANT[selectedQuadrant as 1|2|3|4].map((tooth) => (
                      <option key={tooth.number} value={tooth.number}>
                        {tooth.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dental Disease</label>
                  <select
                    value={selectedDisease}
                    onChange={(e) => setSelectedDisease(e.target.value)}
                    disabled={!selectedToothNumber}
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  >
                    <option value="">Select Disease</option>
                    {DENTAL_DISEASES.map((disease) => (
                      <option key={disease} value={disease}>
                        {disease}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddTooth}
                    disabled={!selectedQuadrant || !selectedToothNumber || !selectedDisease}
                    className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Tooth
                  </button>
                </div>
              </div>
              
              {/* Oral Examination Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Examination Notes</label>
                <textarea 
                  value={oralExamNotes} 
                  onChange={(e) => setOralExamNotes(e.target.value)} 
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  rows={4}
                  placeholder="Additional notes about the oral examination..."
                />
              </div>
              
              {/* Selected Teeth Summary */}
              {selectedTeeth.length > 0 && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                  <h4 className="font-medium text-indigo-800 mb-2">Selected Teeth Summary:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tooth Number</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quadrant</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disease</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedTeeth.map((tooth) => (
                          <tr key={tooth.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{tooth.id}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{tooth.category}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{tooth.disease}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                              <button
                                type="button"
                                onClick={() => handleRemoveTooth(tooth.id)}
                                className="text-red-600 hover:text-red-800 transition"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Preview of dental notation that will appear on prescription */}
                  <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Dental Notation for Prescription:</span> {selectedTeeth.reduce((acc, tooth) => {
                        return `${acc}${acc ? ', ' : ''}#${tooth.id} (${tooth.disease})`;
                      }, '')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            
            {/* Medicines Section */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-purple-800">Prescribed Medicines</h3>
                <button 
                  type="button" 
                  onClick={addMedicine}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition shadow-sm"
                >
                  Add Medicine
                </button>
              </div>
              
              <div className="space-y-4">
                {medicines.map((medicine, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medicine</label>
                        <select
                          value={medicine.name}
                          onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                          className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          required
                        >
                          <option value="">Select Medicine</option>
                          {medicineOptions.map((med) => (
                            <option key={med.id} value={med.name}>{med.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                        <input
                          type="text"
                          value={medicine.dosage}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          placeholder="e.g., 1-0-1"
                          className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                        <input
                          type="text"
                          value={medicine.duration}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                          placeholder="e.g., 7 days"
                          className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          required
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => removeMedicine(index)}
                      className="mt-6 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={medicines.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Additional Information Section */}
            <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
              <h3 className="text-xl font-semibold mb-4 text-amber-800">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advice Given</label>
                  <textarea 
                    name="advice" 
                    value={formData.advice} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    rows={4}
                    placeholder="Special instructions or advice for the patient"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input 
                    type="date" 
                    name="followupDate" 
                    value={formData.followupDate} 
                    onChange={handleChange} 
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                  <p className="mt-2 text-sm text-gray-500">Leave empty if no follow-up is required</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
              <button 
                type="submit" 
                className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 transition shadow-md"
                disabled={loading || saving}
              >
                {loading ? 'Generating PDF...' : saving ? 'Saving Prescription...' : 'Generate & Save Prescription'}
              </button>
              
              <button
                type="button"
                onClick={handleDownload}
                disabled={!pdfUrl}
                className="px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 transition shadow-md flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Prescription
              </button>
              
              <button
                type="button"
                onClick={handlePrint}
                disabled={!pdfUrl}
                className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 transition shadow-md flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Prescription
              </button>
              
              {/* New Generate Bill Button */}
              <button
                type="button"
                onClick={toggleBillForm}
                className="px-8 py-3 bg-orange-600 text-white text-lg font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300 focus:ring-offset-2 transition shadow-md flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Generate Bill
              </button>
            </div>
          </form>
          
          {/* Hidden iframe for PDF preview/loading */}
          {pdfUrl && (
            <div className="hidden">
              <iframe 
                src={pdfUrl} 
                title="Prescription PDF"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrescriptionPage;
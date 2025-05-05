'use client';

import React, { useState, useEffect } from 'react';
import { ToothData } from '@/components/TeethChart';
import { supabase } from '@/lib/supabaseClient';
import { deductMedicineStock } from '@/services/medicine';


interface MedicineEntry {
  name: string;
  dosage: string;
  duration: string;
}

interface PatientData {
  name: string;
  age: string;
  sex: string;
  date: string;
}

interface BillItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  itemType: 'medicine' | 'procedure' | 'consultation' | 'other';
}

interface BillFormProps {
  patientData: PatientData;
  diagnosis: string;
  medicines: MedicineEntry[];
  selectedTeeth: ToothData[];
  onBack: () => void; // Function to go back to prescription form
}

// Default dental procedures with prices
const defaultDentalProcedures = [
  { id: 1, name: 'Dental Checkup', price: 500 },
  { id: 2, name: 'Teeth Cleaning', price: 1000 },
  { id: 3, name: 'Root Canal', price: 5000 },
  { id: 4, name: 'Tooth Extraction', price: 1500 },
  { id: 5, name: 'Dental Filling', price: 1200 },
  { id: 6, name: 'Dental Crown', price: 8000 },
  { id: 7, name: 'Dental Bridge', price: 15000 },
  { id: 8, name: 'Dental Implant', price: 25000 },
  { id: 9, name: 'Teeth Whitening', price: 4000 },
  { id: 10, name: 'Braces Consultation', price: 1000 },
];

// Function to generate a bill/invoice number
const generateBillNumber = () => {
  const prefix = 'DSC'; // Dantsri Dental Clinic
  const timestamp = new Date().getTime().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random number
  return `${prefix}-${timestamp}-${random}`;
};

interface StockUpdateResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  medicine?: {
    id: number;
    name: string;
    quantity: number;
  };
}

const BillForm: React.FC<BillFormProps> = ({ patientData, diagnosis, medicines, selectedTeeth, onBack }) => {
  // Basic bill information
  const [billData, setBillData] = useState({
    patientId: '',
    contactDetails: '',
    billNumber: generateBillNumber(),
    billDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Cash',
    discount: 0,
    consultationFee: 500, // Default consultation fee
    amountPaid: 0, // Add this line for amount paid
    paymentStatus: 'Full Payment', // Add this for payment status
  });

  // Bill items including procedures, medicines, etc.
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  
  // State for loading/generating PDF
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatedPdf, setGeneratedPdf] = useState(false);
  
  const [stockUpdateResults, setStockUpdateResults] = useState<StockUpdateResult[]>([]);

  // State for handling new procedure
  const [newProcedure, setNewProcedure] = useState({
    description: '',
    quantity: 1,
    unitPrice: 0,
  });

  // Calculate subtotal, discount, and total
  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0) + billData.consultationFee;
  const discountAmount = (subtotal * billData.discount) / 100;
  const totalAmount = subtotal - discountAmount;
  
  const fetchMedicineDetails = async (medicineName: string) => {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .ilike('name', `%${medicineName}%`)
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        return {
          found: true,
          price: data[0].rate,
          currentStock: data[0].quantity
        };
      }
      
      return { found: false, price: 100, currentStock: 0 }; // Default price if not found
    } catch (error) {
      console.error(`Error fetching medicine details for ${medicineName}:`, error);
      return { found: false, price: 100, currentStock: 0 }; // Default price on error
    }
  };
  // Initialize the bill with medicines from prescription
  useEffect(() => {
    const initializeBillItems = async () => {
      // Process medicines first
      const medicinePromises = medicines
        .filter(med => med.name) // Filter out empty medicine entries
        .map(async (med, idx) => {
          // Fetch medicine details from the database
          const details = await fetchMedicineDetails(med.name);
          
          return {
            id: idx + 1,
            description: med.name,
            quantity: 1, // Default quantity
            unitPrice: details.found ? details.price : 100, // Use fetched price or default
            total: details.found ? details.price : 100, // Default total
            itemType: 'medicine' as const,
            currentStock: details.currentStock // Store current stock for reference
          };
        });
      
      const medicineItems = await Promise.all(medicinePromises);
      
      // If teeth were selected, suggest corresponding procedures
      const suggestedProcedures: BillItem[] = [];
      
      if (selectedTeeth.length > 0) {
        // Map teeth to potential procedures
        // This is a simple example - in a real app you might have more complex mapping logic
        const teethTypes = new Set(selectedTeeth.map(tooth => tooth.type));
        
        if (diagnosis.toLowerCase().includes('extraction')) {
          suggestedProcedures.push({
            id: medicineItems.length + 1,
            description: 'Tooth Extraction',
            quantity: selectedTeeth.length,
            unitPrice: 1500,
            total: 1500 * selectedTeeth.length,
            itemType: 'procedure',
          });
        } else if (diagnosis.toLowerCase().includes('filling')) {
          suggestedProcedures.push({
            id: medicineItems.length + 1,
            description: 'Dental Filling',
            quantity: selectedTeeth.length,
            unitPrice: 1200,
            total: 1200 * selectedTeeth.length,
            itemType: 'procedure',
          });
        } else if (teethTypes.size > 0) {
          // Default to general dental work if specific diagnosis not matched
          suggestedProcedures.push({
            id: medicineItems.length + 1,
            description: 'Dental Procedure',
            quantity: selectedTeeth.length,
            unitPrice: 1000,
            total: 1000 * selectedTeeth.length,
            itemType: 'procedure',
          });
        }
      }
  
      // Combine medicines and suggested procedures
      setBillItems([...medicineItems, ...suggestedProcedures]);
    };
  
    initializeBillItems();
  }, [medicines, selectedTeeth, diagnosis]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'discount') {
      const discountValue = parseFloat(value) || 0;
      // Limit discount to 0-100%
      const clampedDiscount = Math.min(Math.max(discountValue, 0), 100);
      setBillData({
        ...billData,
        [name]: clampedDiscount,
      });
    } else if (name === 'consultationFee') {
      const feeValue = parseFloat(value) || 0;
      setBillData({
        ...billData,
        [name]: feeValue,
      });
    } else if (name === 'amountPaid') {
      // Handle amount paid - ensure it doesn't exceed total
      const amountValue = parseFloat(value) || 0;
      // Limit amount paid to total amount
      const clampedAmount = Math.min(Math.max(amountValue, 0), totalAmount);
      setBillData({
        ...billData,
        [name]: clampedAmount,
      });
    } else if (name === 'paymentStatus' && value !== 'Partial Payment') {
      // If changing from partial payment to full payment or pending
      if (value === 'Full Payment') {
        setBillData({
          ...billData,
          [name]: value,
          amountPaid: totalAmount, // Set to full amount if full payment
        });
      } else {
        setBillData({
          ...billData,
          [name]: value,
          amountPaid: 0, // Set to 0 if payment pending
        });
      }
    } else {
      setBillData({
        ...billData,
        [name]: value,
      });
    }
  };

  const handleNewProcedureChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'description') {
      // If selecting from dropdown, update price too
      const selectedProcedure = defaultDentalProcedures.find(proc => proc.name === value);
      if (selectedProcedure) {
        setNewProcedure({
          ...newProcedure,
          description: value,
          unitPrice: selectedProcedure.price,
        });
      } else {
        setNewProcedure({
          ...newProcedure,
          [name]: value,
        });
      }
    } else {
      const numValue = name === 'quantity' ? Math.max(1, parseInt(value) || 1) : parseFloat(value) || 0;
      setNewProcedure({
        ...newProcedure,
        [name]: numValue,
      });
    }
  };

  const addProcedure = () => {
    if (newProcedure.description && newProcedure.unitPrice > 0) {
      const newItem: BillItem = {
        id: billItems.length + 1,
        description: newProcedure.description,
        quantity: newProcedure.quantity,
        unitPrice: newProcedure.unitPrice,
        total: newProcedure.quantity * newProcedure.unitPrice,
        itemType: 'procedure',
      };
      
      setBillItems([...billItems, newItem]);
      
      // Reset the form
      setNewProcedure({
        description: '',
        quantity: 1,
        unitPrice: 0,
      });
    }
  };

  const removeBillItem = (id: number) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const updateBillItem = (id: number, field: string, value: number | string) => {
    const updatedItems = billItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate total if quantity or unitPrice changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setBillItems(updatedItems);
  };

  const handleGenerateBill = async () => {
    try {
      setLoading(true);
  
      // First, update medicine stock quantities
      const medicineItems = billItems
        .filter(item => item.itemType === 'medicine')
        .map(item => ({
          name: item.description,
          quantity: item.quantity
        }));
      
      if (medicineItems.length > 0) {
        try {
          const stockResults = await deductMedicineStock(medicineItems);
          // Type assertion to match the expected state type
          setStockUpdateResults(stockResults as StockUpdateResult[]);
          
          // Check if any errors occurred
          const hasErrors = stockResults.some(result => result.status === 'error');
          const hasWarnings = stockResults.some(result => result.status === 'warning');
          
          if (hasErrors || hasWarnings) {
            if (hasErrors) {
              throw new Error('Some medicines could not be found in inventory. Please check the medicines list.');
            }
            
            if (hasWarnings && !confirm('Some medicines have insufficient stock. Do you want to continue anyway?')) {
              setLoading(false);
              return;
            }
          }
        } catch (error: unknown) {
          console.error('Error updating medicine stock:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          alert(`Failed to update medicine stock: ${errorMessage}`);
          setLoading(false);
          return;
        }
      }
  
      // Calculate balance due
      const balanceDue = billData.paymentStatus === 'Full Payment' 
        ? 0 
        : totalAmount - billData.amountPaid;
  
      // Create a comprehensive bill data object
      const fullBillData = {
        clinic: {
          name: "Dantsri Dental Clinic",
          // Add other clinic details if needed
        },
        patient: {
          ...patientData,
          id: billData.patientId,
          contactDetails: billData.contactDetails,
        },
        invoice: {
          number: billData.billNumber,
          date: billData.billDate,
          paymentMethod: billData.paymentMethod,
          paymentStatus: billData.paymentStatus,
        },
        items: billItems,
        financials: {
          consultationFee: billData.consultationFee,
          subtotal,
          discountPercent: billData.discount,
          discountAmount,
          total: totalAmount,
          amountPaid: billData.paymentStatus === 'Full Payment' ? totalAmount : billData.amountPaid,
          balanceDue: balanceDue,
        },
        teeth: selectedTeeth.map(tooth => `#${tooth.id} (${tooth.type})`).join(', '),
        diagnosis,
      };
      
      // Call the API to generate the PDF
      const response = await fetch('/api/generate-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fullBillData),
      });
  
      if (!response.ok) {
        // Get the detailed error message from the server if available
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || errorData?.message || `Failed with status: ${response.status}`);
      }
  
      const blob = await response.blob();
      
      // Create URL for the blob
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setGeneratedPdf(true);
   
    } catch (error: unknown) {
      console.error('Error generating bill:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `bill-${patientData.name}-${billData.billDate}.pdf`;
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

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Generate Bill</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        >
          Back to Prescription
        </button>
      </div>

      {/* Success Message */}
      {generatedPdf && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <p className="font-medium">Bill generated successfully! You can now download or print it.</p>
        </div>
      )}

      {/* Stock Update Results */}
      {stockUpdateResults.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Medicine Stock Update Status:</h4>
          <div className="space-y-2">
            {stockUpdateResults.map((result, index) => (
              <div 
                key={index} 
                className={`p-2 rounded ${
                  result.status === 'success' ? 'bg-green-100 text-green-700' :
                  result.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                <p className="font-medium">{result.name}: {result.message}</p>
                {result.medicine && (
                  <p className="text-sm">Current stock: {result.medicine.quantity}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Clinic Information */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-blue-800">Dantsri Dental Clinic</h3>
              <p className="text-gray-600">Professional Dental Care Services</p>
            </div>
            <div className="text-right">
              <p><strong>Bill No:</strong> {billData.billNumber}</p>
              <p><strong>Date:</strong> {new Date(billData.billDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
          <h3 className="text-xl font-semibold mb-4 text-green-800">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p><strong>Name:</strong> {patientData.name}</p>
              <p><strong>Age/Sex:</strong> {patientData.age} / {patientData.sex}</p>
              <p><strong>Visit Date:</strong> {new Date(patientData.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID (Optional)</label>
              <input
                type="text"
                name="patientId"
                value={billData.patientId}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Enter Patient ID if available"
              />

              <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Contact Details</label>
              <input
                type="text"
                name="contactDetails"
                value={billData.contactDetails}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Phone Number or Email"
              />
            </div>
          </div>
        </div>

        {/* Medical Information (Brief) */}
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
          <h3 className="text-xl font-semibold mb-4 text-purple-800">Treatment Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p><strong>Diagnosis:</strong> {diagnosis || 'N/A'}</p>
              {selectedTeeth.length > 0 && (
                <p><strong>Teeth Treated:</strong> {selectedTeeth.map(tooth => `#${tooth.id}`).join(', ')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                name="consultationFee"
                value={billData.consultationFee}
                onChange={handleInputChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Bill Items Table */}
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
          <h3 className="text-xl font-semibold mb-4 text-amber-800">Bill Items</h3>
          
          {/* Add New Procedure Section */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-700 mb-3">Add Dental Procedure</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Procedure</label>
                <select
                  name="description"
                  value={newProcedure.description}
                  onChange={handleNewProcedureChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Procedure</option>
                  {defaultDentalProcedures.map(proc => (
                    <option key={proc.id} value={proc.name}>{proc.name}</option>
                  ))}
                  <option value="Custom">Custom Procedure</option>
                </select>
                
                {newProcedure.description === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom procedure name"
                    className="mt-2 block w-full p-3 border border-gray-300 rounded-lg"
                    onChange={(e) => setNewProcedure({...newProcedure, description: e.target.value})}
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={newProcedure.quantity}
                  onChange={handleNewProcedureChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  name="unitPrice"
                  value={newProcedure.unitPrice}
                  onChange={handleNewProcedureChange}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>
              <div className="md:col-span-4 flex justify-end">
                <button
                  type="button"
                  onClick={addProcedure}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  disabled={!newProcedure.description || newProcedure.unitPrice <= 0}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (₹)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (₹)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="text" 
                        value={item.description} 
                        onChange={(e) => updateBillItem(item.id, 'description', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateBillItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20 p-1 border border-gray-300 rounded"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={(e) => updateBillItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 p-1 border border-gray-300 rounded"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button 
                        onClick={() => removeBillItem(item.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                
                {/* Consultation Fee Row */}
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 whitespace-nowrap">{billItems.length + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">Consultation Fee</td>
                  <td className="px-4 py-3 whitespace-nowrap">1</td>
                  <td className="px-4 py-3 whitespace-nowrap">{billData.consultationFee.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{billData.consultationFee.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"></td>
                </tr>
              </tbody>
              
              {/* Footer with totals */}
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-medium">Subtotal:</td>
                  <td colSpan={2} className="px-4 py-3 font-medium">₹ {subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">Discount:</td>
                  <td className="px-4 py-3">
                    <input 
                      type="number" 
                      name="discount"
                      value={billData.discount} 
                      onChange={handleInputChange}
                      className="w-16 p-1 border border-gray-300 rounded text-right"
                      min="0"
                      max="100"
                    /> %
                  </td>
                  <td colSpan={2} className="px-4 py-3 font-medium">₹ {discountAmount.toFixed(2)}</td>
                </tr>
                <tr className="bg-amber-100">
                  <td colSpan={4} className="px-4 py-3 text-right font-bold">Total Amount Payable:</td>
                  <td colSpan={2} className="px-4 py-3 font-bold text-lg">₹ {totalAmount.toFixed(2)}</td>
                </tr>
                {/* Payment Status Rows - only show if not "Full Payment" */}
{billData.paymentStatus !== 'Full Payment' && (
  <>
    <tr>
      <td colSpan={4} className="px-4 py-3 text-right font-medium">Amount Paid:</td>
      <td colSpan={2} className="px-4 py-3 font-medium">₹ {billData.amountPaid.toFixed(2)}</td>
    </tr>
    <tr className="bg-red-50">
      <td colSpan={4} className="px-4 py-3 text-right font-bold">Balance Due:</td>
      <td colSpan={2} className="px-4 py-3 font-bold text-lg text-red-600">
        ₹ {(totalAmount - billData.amountPaid).toFixed(2)}
      </td>
    </tr>
  </>
)}
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Method */}
        {/* Payment Method */}
<div className="bg-teal-50 p-6 rounded-lg border border-teal-100">
  <h3 className="text-xl font-semibold mb-4 text-teal-800">Payment Details</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
      <select
        name="paymentMethod"
        value={billData.paymentMethod}
        onChange={handleInputChange}
        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
      >
        <option value="Cash">Cash</option>
        <option value="Card">Card</option>
        <option value="UPI">UPI</option>
        <option value="Other">Other</option>
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Bill Date</label>
      <input
        type="date"
        name="billDate"
        value={billData.billDate}
        onChange={handleInputChange}
        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
      />
    </div>
    
    {/* Payment Status Dropdown */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
      <select
        name="paymentStatus"
        value={billData.paymentStatus}
        onChange={handleInputChange}
        className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
      >
        <option value="Full Payment">Full Payment</option>
        <option value="Partial Payment">Partial Payment</option>
        <option value="Payment Pending">Payment Pending</option>
      </select>
    </div>
    
    {/* Amount Paid - only visible if Partial Payment is selected */}
    {billData.paymentStatus === 'Partial Payment' && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
        <input
          type="number"
          name="amountPaid"
          value={billData.amountPaid}
          onChange={handleInputChange}
          className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
          min="0"
          max={totalAmount}
        />
      </div>
    )}
  </div>
</div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-center gap-4 mt-6 mb-8">
          <button
            type="button"
            onClick={handleGenerateBill}
            disabled={loading || billItems.length === 0}
            className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition shadow-md"
          >
            {loading ? 'Generating...' : 'Generate Bill PDF'}
          </button>
          
          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfUrl}
            className="px-8 py-3 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 transition shadow-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Bill
          </button>
          
          <button
            type="button"
            onClick={handlePrint}
            disabled={!pdfUrl}
            className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 transition shadow-md flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Bill
          </button>
        </div>
      </div>
      
      {/* Hidden iframe for PDF preview/loading */}
      {pdfUrl && (
        <div className="hidden">
          <iframe 
            src={pdfUrl} 
            title="Bill PDF"
          />
        </div>
      )}
    </div>
  );
};

export default BillForm;
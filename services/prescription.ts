// services/prescription.ts
import { supabase } from '@/lib/supabaseClient';

// Types
export interface MedicineEntry {
  name: string;
  dosage: string;
  duration: string;
}

export interface ToothData {
  id: number;
  type: string;
  category: string;
  disease?: string;
}

export interface Prescription {
  id?: string;
  patient_name: string;
  phone_number: string; // Add this line
  age: string;
  sex: string;
  prescription_date: string;
  chief_complaint?: string;
  medical_history?: string;
  diagnosis?: string;
  oral_exam_notes?: string;
  selected_teeth?: ToothData[];
  medicines: MedicineEntry[];
  advice?: string;
  followup_date?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Add a new prescription to the database
 * @param prescription The prescription data to add
 * @returns The newly created prescription
 */
export const addPrescription = async (prescription: Prescription) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert([prescription])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get all prescriptions from the database
 * @param searchTerm Optional search term to filter prescriptions by patient name
 * @returns Array of prescriptions
 */
export const getAllPrescriptions = async (searchTerm?: string) => {
  let query = supabase
    .from('prescriptions')
    .select('*')
    .order('prescription_date', { ascending: false });
  
  // Apply search filter if provided
  if (searchTerm) {
    query = query.ilike('patient_name', `%${searchTerm}%`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

/**
 * Get a single prescription by ID
 * @param id The ID of the prescription to fetch
 * @returns The prescription
 */
export const getPrescriptionById = async (id: string) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

/**
 * Update a prescription
 * @param id The ID of the prescription to update
 * @param updates The updated fields
 * @returns The updated prescription
 */
export const updatePrescription = async (id: string, updates: Partial<Prescription>) => {
  const { data, error } = await supabase
    .from('prescriptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete a prescription
 * @param id The ID of the prescription to delete
 * @returns true if successful
 */

export const deletePrescription = async (id: string) => {
  const { error } = await supabase
    .from('prescriptions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

import { supabase } from "@/lib/supabaseClient";
import { Patient } from "@/types/patient";

// create a new patient 
export const createPatient = async (patient: Omit<Patient, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('patients').insert([patient]).select().single();
    if (error) throw error;
    return data;
}

// get patient by phone number
export const getPatientByPhoneNumber = async (phoneNumber: string): Promise<Patient | null> => {
    const { data, error } = await supabase.from("patients").select("*").eq("phone_number", phoneNumber).single();
    if (error) {
        // If no match found, error.code will be "PGRST116" (no rows returned)
        if (error.code === "PGRST116") return null;
        throw error;
    }
    return data;
}

// get or create patient based on phone number
export const getOrCreatePatient = async (patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> => {
    // First check if patient exists with the given phone number
    const existingPatient = await getPatientByPhoneNumber(patient.phone_number);
    
    // If patient exists, return it
    if (existingPatient) {
        return existingPatient;
    }
    
    // Otherwise create a new patient
    return await createPatient(patient);
}

export const getPatients = async (): Promise<Patient[]> => {
    const { data, error } = await supabase.from("patients").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
    const { data, error } = await supabase.from("patients").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
};

export const updatePatient = async (id: string, updates: Partial<Patient>) => {
    const { data, error } = await supabase.from("patients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
};

export const deletePatient = async (id: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) throw error;
    return true;
};
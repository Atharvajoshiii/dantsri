// services/medicine.ts
import { supabase } from '@/lib/supabaseClient';

export type Medicine = {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  company?: string;
  created_at?: string;
  updated_at?: string;
};

export const addMedicine = async (medicine: Medicine) => {
  const { data, error } = await supabase
    .from('medicines')
    .insert([medicine])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all medicines
export const getAllMedicines = async () => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Update a medicine
export const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
  const { data, error } = await supabase
    .from('medicines')
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

// Delete a medicine
export const deleteMedicine = async (id: string) => {
  const { error } = await supabase
    .from('medicines')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Get medicine by name
export const getMedicineByName = async (name: string) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();

  if (error) throw error;
  return data;
};

// New function to deduct medicine quantities from stock
export const deductMedicineStock = async (medicineItems: Array<{name: string, quantity: number}>) => {
  try {
    // Process each medicine sequentially
    const results = [];
    
    for (const item of medicineItems) {
      // Find the medicine in the database
      const { data: medicine, error: findError } = await supabase
        .from('medicines')
        .select('*')
        .ilike('name', `%${item.name}%`)
        .limit(1)
        .single();
      
      if (findError) {
        console.error(`Medicine not found: ${item.name}`, findError);
        results.push({ 
          name: item.name, 
          status: 'error', 
          message: 'Medicine not found in database'
        });
        continue;
      }
      
      // Check if we have enough stock
      if (medicine.quantity < item.quantity) {
        results.push({ 
          name: item.name, 
          status: 'warning', 
          message: `Insufficient stock (${medicine.quantity} available, ${item.quantity} needed)`
        });
        continue;
      }
      
      // Update the quantity
      const newQuantity = medicine.quantity - item.quantity;
      const { data: updatedMedicine, error: updateError } = await supabase
        .from('medicines')
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', medicine.id)
        .select()
        .single();
        
      if (updateError) {
        console.error(`Failed to update stock for: ${item.name}`, updateError);
        results.push({ 
          name: item.name, 
          status: 'error', 
          message: 'Failed to update stock'
        });
        continue;
      }
      
      results.push({ 
        name: item.name, 
        status: 'success', 
        message: `Stock updated. Remaining: ${newQuantity}`,
        medicine: updatedMedicine
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error in deductMedicineStock:', error);
    throw error;
  }
};
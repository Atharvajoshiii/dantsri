"use client";
import { useState, useEffect } from 'react';
import { addMedicine, getAllMedicines, deleteMedicine, Medicine } from '@/services/medicine';
import { PlusCircle, X, Trash2, Search, ArrowUp, ArrowDown, Package, Pill, RefreshCw } from 'lucide-react';

export default function AddMedicinePage() {
  const [formData, setFormData] = useState<Medicine>({
    name: '',
    description: '',
    quantity: 0,
    rate: 0,
    company: ''
  });

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof Medicine>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoadingMedicines, setIsLoadingMedicines] = useState<boolean>(true);

  useEffect(() => {
    fetchMedicines();
  }, [sortField, sortDirection]);

  const fetchMedicines = async () => {
    setIsLoadingMedicines(true);
    try {
      const data = await getAllMedicines();
      setMedicines(data);
    } catch (err) {
      console.error("Failed to fetch medicines:", err);
    } finally {
      setIsLoadingMedicines(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'quantity' || name === 'rate') {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await addMedicine(formData);
      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        quantity: 0,
        rate: 0,
        company: ''
      });

      fetchMedicines();

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to add medicine');
      } else {
        setError('Failed to add medicine');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      setIsDeleting(true);
      try {
        await deleteMedicine(id);
        setMedicines(medicines.filter(medicine => medicine.id !== id));
      } catch (err) {
        console.error("Failed to delete medicine:", err);
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      quantity: 0,
      rate: 0,
      company: ''
    });
    setError('');
  };

  const handleSort = (field: keyof Medicine) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (medicine.company && medicine.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedMedicines = [...filteredMedicines].sort((a: Medicine, b: Medicine) => {
    if (sortField === 'created_at') {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return sortDirection === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }

    if (sortField === 'name' || sortField === 'company') {
      const valueA = (a[sortField] || '').toLowerCase();
      const valueB = (b[sortField] || '').toLowerCase();
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    const numA = typeof a[sortField] === 'number' ? a[sortField] as number : 0;
    const numB = typeof b[sortField] === 'number' ? b[sortField] as number : 0;

    return sortDirection === 'asc'
      ? numA - numB
      : numB - numA;
  });

  const renderSortIcon = (field: keyof Medicine) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  return (
    <div className="min-h-screen bg-white w-[80vw] overflow-auto scrollbar-none">
      <div className="max-w-auto mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Medicine Management</h1>
          <p className="text-gray-600 mt-1">Add and manage medicines for your dental clinic</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Medicine Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Pill className="mr-2 text-blue-500" size={20} />
                  Add New Medicine
                </h2>
              </div>

              {error && (
                <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6 flex justify-between items-center">
                  <span>{error}</span>
                  <button onClick={() => setError('')}>
                    <X size={18} />
                  </button>
                </div>
              )}

              {success && (
                <div className="bg-green-100 text-green-800 px-4 py-3 rounded-md mb-6 flex items-center justify-between">
                  <span>Medicine added successfully!</span>
                  <button onClick={() => setSuccess(false)}>
                    <X size={18} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Medicine Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter medicine name"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity*
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter quantity"
                  />
                </div>

                <div>
                  <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Rate (Rs.)
                  </label>
                  <div className="relative">

                    <input
                      type="number"
                      id="rate"
                      name="rate"
                      value={formData.rate}
                      onChange={handleChange}
                      required
                      className="w-full pl-3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      placeholder="Enter rate"
                    />

                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter medicine description"
                  ></textarea>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                  >
                    <X size={16} className="mr-1" />
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle size={16} className="mr-2" />
                        <span>Add Medicine</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Stats Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Inventory Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">Total Medicines</p>
                  <p className="text-2xl font-bold text-blue-800">{medicines.length}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">Total Value</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${medicines.reduce((total, med) => total + (med.quantity * med.rate), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-700">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {medicines.filter(med => med.quantity < 10).length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-700">Companies</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {new Set(medicines.map(med => med.company).filter(Boolean)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Medicines List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Package className="mr-2 text-blue-500" size={20} />
                  Medicine Inventory
                </h2>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                </div>
              </div>

              {isLoadingMedicines ? (
                <div className="flex justify-center items-center h-64">
                  <RefreshCw size={32} className="animate-spin text-blue-500" />
                </div>
              ) : sortedMedicines.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Package size={48} className="mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No medicines found</h3>
                  <p className="text-gray-500">
                    {searchTerm ? "Try a different search term" : "Add your first medicine using the form"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                            <div className="flex items-center space-x-1">
                              <span>Name</span>
                              {renderSortIcon('name')}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('company')}>
                            <div className="flex items-center space-x-1">
                              <span>Company</span>
                              {renderSortIcon('company')}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('quantity')}>
                            <div className="flex items-center space-x-1">
                              <span>Quantity</span>
                              {renderSortIcon('quantity')}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('rate')}>
                            <div className="flex items-center space-x-1">
                              <span>Rate</span>
                              {renderSortIcon('rate')}
                            </div>
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sortedMedicines.map((medicine) => (
                          <tr key={medicine.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{medicine.name}</div>
                              {medicine.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs" title={medicine.description}>
                                  {medicine.description}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {medicine.company || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${medicine.quantity <= 5
                                  ? 'bg-red-100 text-red-800'
                                  : medicine.quantity <= 20
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                {medicine.quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${medicine.rate.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => medicine.id && handleDelete(medicine.id)}
                                disabled={isDeleting}
                                className="text-red-600 hover:text-red-900 ml-3"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 text-right text-sm text-gray-500">
                    Showing {sortedMedicines.length} of {medicines.length} medicines
                  </div>
                </>
              )}
            </div>

            {/* Tips and Help Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Tips</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-700 mb-2">Managing Inventory</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Items with less than 5 units are highlighted in red</li>
                    <li>• Click column headers to sort your inventory</li>
                    <li>• Use search to quickly find medicines</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-700 mb-2">Adding New Medicines</h4>
                  <ul className="text-sm text-purple-600 space-y-1">
                    <li>• Required fields are marked with *</li>
                    <li>• Include detailed descriptions for better organization</li>
                    <li>• Company names help track suppliers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
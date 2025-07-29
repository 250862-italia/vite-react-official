import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommissionPlansManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    directSale: 0,
    level1: 0,
    level2: 0,
    level3: 0,
    level4: 0,
    level5: 0,
    minPoints: 0,
    minTasks: 0,
    minSales: 0,
    cost: 0,
    description: '',
    isActive: true
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/admin/commission-plans', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setPlans(response.data.data || []);
    } catch (error) {
      console.error('Errore nel caricamento piani:', error);
      alert('Errore nel caricamento dei piani commissioni');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      directSale: 0,
      level1: 0,
      level2: 0,
      level3: 0,
      level4: 0,
      level5: 0,
      minPoints: 0,
      minTasks: 0,
      minSales: 0,
      cost: 0,
      description: '',
      isActive: true
    });
    setEditingPlan(null);
    setShowForm(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/admin/commission-plans', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Piano commissioni creato con successo!');
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Errore nella creazione:', error);
      alert('Errore nella creazione del piano commissioni');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/admin/commission-plans/${editingPlan.id}`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Piano commissioni aggiornato con successo!');
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      alert('Errore nell\'aggiornamento del piano commissioni');
    }
  };

  const handleDelete = async (planId) => {
    if (!confirm('Sei sicuro di voler eliminare questo piano commissioni?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/admin/commission-plans/${planId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Piano commissioni eliminato con successo!');
      loadPlans();
    } catch (error) {
      console.error('Errore nell\'eliminazione:', error);
      alert('Errore nell\'eliminazione del piano commissioni');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      directSale: plan.directSale,
      level1: plan.level1,
      level2: plan.level2,
      level3: plan.level3,
      level4: plan.level4,
      level5: plan.level5,
      minPoints: plan.minPoints,
      minTasks: plan.minTasks,
      minSales: plan.minSales,
      cost: plan.cost,
      description: plan.description,
      isActive: plan.isActive
    });
    setShowForm(true);
  };

  const handleNew = () => {
    resetForm();
    setShowForm(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">
            💰 Gestione Piani Commissioni
          </h2>
          <p className="text-neutral-600">
            Crea, modifica ed elimina i piani commissioni MLM
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadPlans}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            🔄 Ricarica
          </button>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            ➕ Nuovo Piano
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">
            {editingPlan ? '✏️ Modifica Piano' : '➕ Nuovo Piano'}
          </h3>
          
          <form onSubmit={editingPlan ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Piano *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendita Diretta (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="directSale"
                  value={formData.directSale * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, directSale: parseFloat(e.target.value) / 100 || 0 }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Livello 1 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="level1"
                  value={formData.level1 * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, level1: parseFloat(e.target.value) / 100 || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Livello 2 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="level2"
                  value={formData.level2 * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, level2: parseFloat(e.target.value) / 100 || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Livello 3 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="level3"
                  value={formData.level3 * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, level3: parseFloat(e.target.value) / 100 || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Livello 4 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="level4"
                  value={formData.level4 * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, level4: parseFloat(e.target.value) / 100 || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Livello 5 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="level5"
                  value={formData.level5 * 100}
                  onChange={(e) => setFormData(prev => ({ ...prev, level5: parseFloat(e.target.value) / 100 || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Punti Minimi
                </label>
                <input
                  type="number"
                  name="minPoints"
                  value={formData.minPoints}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Minimi
                </label>
                <input
                  type="number"
                  name="minTasks"
                  value={formData.minTasks}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendite Minime (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="minSales"
                  value={formData.minSales}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Piano Attivo
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPlan ? '💾 Salva Modifiche' : '➕ Crea Piano'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ❌ Annulla
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista Piani */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-neutral-600">Caricamento piani...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                Nessun piano commissioni
              </h3>
              <p className="text-neutral-600">
                Clicca su "Nuovo Piano" per creare il primo piano
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-neutral-800">
                      {plan.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      plan.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {plan.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <p><strong>Codice:</strong> {plan.code}</p>
                    <p><strong>Costo:</strong> €{plan.cost}</p>
                    <p><strong>Vendita Diretta:</strong> {(plan.directSale * 100).toFixed(1)}%</p>
                    <p><strong>Livello 1:</strong> {(plan.level1 * 100).toFixed(1)}%</p>
                    <p><strong>Livello 2:</strong> {(plan.level2 * 100).toFixed(1)}%</p>
                    <p><strong>Livello 3:</strong> {(plan.level3 * 100).toFixed(1)}%</p>
                    <p><strong>Livello 4:</strong> {(plan.level4 * 100).toFixed(1)}%</p>
                    <p><strong>Livello 5:</strong> {(plan.level5 * 100).toFixed(1)}%</p>
                    <p><strong>Punti Minimi:</strong> {plan.minPoints}</p>
                    <p><strong>Task Minimi:</strong> {plan.minTasks}</p>
                    <p><strong>Vendite Minime:</strong> €{plan.minSales}</p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-neutral-600 whitespace-pre-line">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      ✏️ Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommissionPlansManager; 
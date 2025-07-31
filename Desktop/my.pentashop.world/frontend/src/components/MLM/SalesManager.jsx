import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Users, 
  TrendingUp, 
  Calendar,
  Package,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const SalesManager = () => {
  const [salesData, setSalesData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [newSaleForm, setNewSaleForm] = useState({
    customerName: '',
    customerEmail: '',
    products: []
  });

  useEffect(() => {
    fetchSalesData();
    fetchProducts();
  }, []);

  const fetchSalesData = async () => {
    try {
      const response = await fetch('/api/mlm/sales');
      const data = await response.json();
      
      if (data.success) {
        setSalesData(data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento dati vendite:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/mlm/products');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Errore nel caricamento prodotti:', error);
    }
  };

  const handleNewSale = async () => {
    try {
      const response = await fetch('/api/mlm/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSaleForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowNewSaleModal(false);
        setNewSaleForm({ customerName: '', customerEmail: '', products: [] });
        fetchSalesData(); // Ricarica i dati
      }
    } catch (error) {
      console.error('Errore nella creazione vendita:', error);
    }
  };

  const addProductToSale = (product) => {
    const existingProduct = newSaleForm.products.find(p => p.id === product.id);
    
    if (existingProduct) {
      setNewSaleForm(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      }));
    } else {
      setNewSaleForm(prev => ({
        ...prev,
        products: [...prev.products, { ...product, quantity: 1 }]
      }));
    }
  };

  const removeProductFromSale = (productId) => {
    setNewSaleForm(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId)
    }));
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProductFromSale(productId);
      return;
    }
    
    setNewSaleForm(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, quantity } : p
      )
    }));
  };

  const getTotalAmount = () => {
    return newSaleForm.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500">Errore nel caricamento dei dati</p>
      </div>
    );
  }

  const { stats, sales } = salesData;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Vendite Totali</p>
              <p className="text-2xl font-bold text-blue-800">€{stats.totalSales}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Commissioni</p>
                              <p className="text-2xl font-bold text-green-800">€{Math.round(stats.totalCommissions)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Ordini</p>
              <p className="text-2xl font-bold text-purple-800">{stats.totalOrders}</p>
            </div>
            <Package className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Valore Medio</p>
              <p className="text-2xl font-bold text-orange-800">€{Math.round(stats.averageOrderValue)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Panoramica', icon: TrendingUp },
          { id: 'sales', label: 'Vendite', icon: ShoppingCart },
          { id: 'new-sale', label: 'Nuova Vendita', icon: Plus }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Panoramica Vendite
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Sales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Vendite Recenti</h4>
              <div className="space-y-3">
                {sales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {sale.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        €{sale.totalAmount} • {new Date(sale.date).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        +€{sale.commissionEarned}
                      </p>
                      <p className="text-xs text-gray-500">Commissione</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Stats */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Statistiche Performance</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">Vendite Totali</span>
                  <span className="font-semibold text-blue-900">€{stats.totalSales}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-green-700">Commissioni Totali</span>
                  <span className="font-semibold text-green-900">€{Math.round(stats.totalCommissions)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-700">Numero Ordini</span>
                  <span className="font-semibold text-purple-900">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-orange-700">Valore Medio Ordine</span>
                  <span className="font-semibold text-orange-900">€{Math.round(stats.averageOrderValue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🛒 Storico Vendite
            </h3>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Calendar className="h-4 w-4" />
              <span>Filtra per Data</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prodotti</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Totale</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Commissione</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(sale.date).toLocaleDateString('it-IT')}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{sale.customerName}</p>
                        <p className="text-xs text-gray-500">{sale.customerEmail}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        {sale.products.map((product, index) => (
                          <div key={index} className="text-xs">
                            {product.name} x{product.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      €{sale.totalAmount}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-green-600">
                      +€{sale.commissionEarned}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Sale Tab */}
      {activeTab === 'new-sale' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              ➕ Nuova Vendita
            </h3>
            <button
              onClick={() => setShowNewSaleModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuova Vendita</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Products List */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Prodotti Disponibili</h4>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{product.image}</div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.description}</p>
                        <p className="text-xs text-green-600">Commissione: €{product.commission}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">€{product.price}</p>
                      <button
                        onClick={() => addProductToSale(product)}
                        className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Aggiungi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Sale */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Vendita Corrente</h4>
              {newSaleForm.products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Nessun prodotto selezionato</p>
                  <p className="text-sm">Seleziona i prodotti dalla lista</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newSaleForm.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{product.image}</div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">€{product.price} x {product.quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{product.quantity}</span>
                        <button
                          onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeProductFromSale(product.id)}
                          className="ml-2 p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Totale:</span>
                      <span className="text-lg font-bold text-gray-900">€{getTotalAmount()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Sale Modal */}
      {showNewSaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🛒 Nuova Vendita
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Cliente
                </label>
                <input
                  type="text"
                  value={newSaleForm.customerName}
                  onChange={(e) => setNewSaleForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome e Cognome"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Cliente
                </label>
                <input
                  type="email"
                  value={newSaleForm.customerEmail}
                  onChange={(e) => setNewSaleForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Prodotti selezionati:</p>
                <div className="space-y-1">
                  {newSaleForm.products.map((product) => (
                    <div key={product.id} className="text-sm">
                      {product.name} x{product.quantity} - €{product.price * product.quantity}
                    </div>
                  ))}
                </div>
                <div className="border-t mt-2 pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Totale:</span>
                    <span className="font-bold">€{getTotalAmount()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleNewSale}
                disabled={!newSaleForm.customerName || !newSaleForm.customerEmail || newSaleForm.products.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Conferma Vendita
              </button>
              <button
                onClick={() => setShowNewSaleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesManager; 
import { useEffect, useState } from 'react';
import { Warehouse, TrendingDown, TrendingUp, Package, Search, History, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/format';
import type { Product, InventoryMovement } from '@/types/database';
import { customAlert, customConfirm } from '@/lib/dialogs';

export default function AdminInventory() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allMovements, setAllMovements] = useState<(InventoryMovement & { products: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'stock' | 'movements'>('stock');
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustMode, setAdjustMode] = useState<'add' | 'remove'>('add');

  // Pagination states
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Stats states
  const [stats, setStats] = useState({
    totalValue: 0,
    references: 0,
    lowStock: 0,
    outOfStock: 0
  });

  // Reset page when search or tab changes
  useEffect(() => { setPage(1); }, [search, tab]);

  const fetchStats = async () => {
    const { data } = await supabase.from('products').select('base_price, stock, min_stock');
    if (data) {
      const totalValue = data.reduce((s, p) => s + Number(p.base_price) * p.stock, 0);
      const lowStock = data.filter((p) => p.stock <= p.min_stock).length;
      const outOfStock = data.filter((p) => p.stock === 0).length;
      setStats({
        totalValue,
        references: data.length,
        lowStock,
        outOfStock
      });
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    const [productsRes, movementsRes] = await Promise.all([
      supabase.from('products').select('*').order('name').limit(5000),
      supabase.from('inventory_movements').select('*, products!inner(name)').order('created_at', { ascending: false }).limit(5000)
    ]);
    
    setAllProducts(productsRes.data || []);
    setAllMovements(movementsRes.data || []);
    setLoading(false);
  };

  const handleRestockAll = async () => {
    if (!(await customConfirm('Voulez-vous vraiment ajouter 10 unités à TOUS les produits ?'))) return;
    
    setLoading(true);
    try {
      const batchSize = 50;
      for (let i = 0; i < allProducts.length; i += batchSize) {
        const batch = allProducts.slice(i, i + batchSize);
        await Promise.all(
          batch.map(p => supabase.from('products').update({ stock: p.stock + 10 }).eq('id', p.id))
        );
      }
      
      const movementInserts = allProducts.map(p => ({
        product_id: p.id,
        type: 'in',
        quantity: 10,
        reason: 'Restock global +10'
      }));
      
      for (let i = 0; i < movementInserts.length; i += batchSize) {
        const batch = movementInserts.slice(i, i + batchSize);
        await supabase.from('inventory_movements').insert(batch);
      }

      customAlert('Restockage de +10 effectué pour tous les produits.');
      loadAllData();
      fetchStats();
    } catch (e) {
      console.error(e);
      customAlert('Erreur lors du restockage.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    loadAllData();
  }, []);

  // --- DERIVED STATE (Client-Side Filtering & Pagination) ---
  const s = search.toLowerCase().trim();
  
  const filteredProducts = allProducts.filter(p => 
    p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s)
  );
  
  const filteredMovements = allMovements.filter(m => 
    m.reason?.toLowerCase().includes(s) || m.products?.name?.toLowerCase().includes(s)
  );

  const activeData = tab === 'stock' ? filteredProducts : filteredMovements;
  const totalItems = activeData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  const safePage = Math.min(page, totalPages) || 1;
  const fromIndex = (safePage - 1) * itemsPerPage;
  const toIndex = fromIndex + itemsPerPage;

  const currentProducts = filteredProducts.slice(fromIndex, toIndex);
  const currentMovements = filteredMovements.slice(fromIndex, toIndex);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Références', value: stats.references, icon: Warehouse, color: 'from-accent-500 to-accent-400' },
          { label: 'Stock faible', value: stats.lowStock, icon: TrendingDown, color: 'from-amber-500 to-amber-400' },
          { label: 'Ruptures', value: stats.outOfStock, icon: TrendingUp, color: 'from-error-500 to-error-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="font-display font-extrabold text-xl text-slate-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('stock')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'stock' ? 'bg-brand-600 text-white' : 'glass'}`}>
            <Package className="w-4 h-4 inline mr-1.5" /> Stock
          </button>
          <button onClick={() => setTab('movements')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'movements' ? 'bg-brand-600 text-white' : 'glass'}`}>
            <History className="w-4 h-4 inline mr-1.5" /> Mouvements
          </button>
        </div>

        {/* Global Search & Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {tab === 'stock' && (
            <button 
              onClick={handleRestockAll}
              disabled={loading || allProducts.length === 0}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-brand-gradient text-white shadow-md shadow-brand-500/20 hover:opacity-90 transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Restock +10
            </button>
          )}
          <div className="relative w-full sm:max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder={tab === 'stock' ? "Rechercher un produit ou SKU..." : "Rechercher par produit ou raison..."} 
              className="input-field pl-10 w-full" 
            />
          </div>
        </div>
      </div>

      {tab === 'stock' ? (
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Min</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Ajuster</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">Chargement...</td></tr>
                ) : currentProducts.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">Aucun produit trouvé</td></tr>
                ) : currentProducts.map((p) => (
                  <tr key={p.id} className="border-t border-slate-50 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{p.stock}</td>
                    <td className="px-4 py-3 text-slate-500">{p.min_stock}</td>
                    <td className="px-4 py-3">
                      {p.stock === 0 ? <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-error-500/10 text-error-500">Rupture</span>
                        : p.stock <= p.min_stock ? <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600">Faible</span>
                        : <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-success-500/10 text-success-600">OK</span>}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1">
                      <button onClick={() => { setAdjustProduct(p); setAdjustMode('add'); }} className="p-2 rounded-lg glass hover:bg-brand-50 dark:hover:bg-white/10 transition-all text-brand-600 dark:text-brand-400">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setAdjustProduct(p); setAdjustMode('remove'); }} className="p-2 rounded-lg glass hover:bg-error-50 dark:hover:bg-white/10 transition-all text-error-600 dark:text-error-400">
                        <Minus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                    {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <span className="text-xs text-slate-500">
                Affichage {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalItems)} sur {totalItems}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-lg glass disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-lg glass disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Quantité</th>
                  <th className="px-4 py-3 font-semibold">Raison</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400">Chargement...</td></tr>
                ) : currentMovements.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-slate-400">Aucun mouvement trouvé</td></tr>
                ) : currentMovements.map((m) => (
                  <tr key={m.id} className="border-t border-slate-50 dark:border-white/5 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.products?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${m.quantity >= 0 ? 'text-success-600' : 'text-error-500'}`}>
                        {movementLabels[m.movement_type] || m.movement_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${m.quantity >= 0 ? 'text-success-600' : 'text-error-500'}`}>
                        {m.quantity >= 0 ? '+' : ''}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                    {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
              <span className="text-xs text-slate-500">
                Affichage {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, totalItems)} sur {totalItems}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-lg glass disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-lg glass disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}

        {adjustProduct && (
          <AdjustModal
            product={adjustProduct}
            initialMode={adjustMode}
            onClose={() => setAdjustProduct(null)}
            onSaved={() => { loadAllData(); fetchStats(); }}
          />
        )}
    </div>
  );
}

const movementLabels: Record<string, string> = {
  purchase: 'Achat', sale: 'Vente', quote: 'Devis', adjustment: 'Ajustement', return: 'Retour', transfer: 'Transfert',
};

function AdjustModal({ product, initialMode, onClose, onSaved }: { product: Product; initialMode: 'add' | 'remove'; onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState(initialMode === 'add' ? 'purchase' : 'sale');
  const [qty, setQty] = useState(initialMode === 'add' ? '1' : '-1');
  const [reason, setReason] = useState('');

  const save = async () => {
    const quantity = parseInt(qty) || 0;
    const newStock = Math.max(0, product.stock + quantity);
    await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
    await supabase.from('inventory_movements').insert({
      product_id: product.id,
      movement_type: type,
      quantity,
      reason: reason || 'Ajustement manuel',
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md p-6">
        <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">Ajuster le stock</h2>
        <p className="text-sm text-slate-500 mb-4">{product.name} (stock actuel: {product.stock})</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Type de mouvement</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input-field">
              <option value="adjustment">Ajustement</option>
              <option value="purchase">Achat / Réception</option>
              <option value="return">Retour</option>
              <option value="transfer">Transfert</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Quantité (+ ou -)</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="input-field" placeholder="ex: 10 ou -5" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Raison</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)} className="input-field" placeholder="Raison de l'ajustement" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={save} className="btn-primary flex-1">Valider</button>
          <button onClick={onClose} className="btn-ghost">Annuler</button>
        </div>
      </div>
    </div>
  );
}

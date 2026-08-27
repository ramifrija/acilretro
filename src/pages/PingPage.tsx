import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PingPage() {
  const [productName, setProductName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFirstProduct() {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .limit(1);
      
      if (!error && data && data.length > 0) {
        setProductName(data[0].name);
      } else {
        setProductName('Aucun produit trouvé');
      }
    }
    fetchFirstProduct();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'monospace', fontSize: '1.2rem', gap: '1rem' }}>
      {productName !== null ? (
        <>
          <div style={{ color: 'green', fontWeight: 'bold' }}>
            ping avec succès à la base de données
          </div>
          <div>
            Date et heure : {new Date().toLocaleString('fr-FR')}
          </div>
          <div>
            1er catalogue : {productName}
          </div>
        </>
      ) : (
        'Loading...'
      )}
    </div>
  );
}

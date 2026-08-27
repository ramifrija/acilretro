import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PingPage() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUsersCount() {
      const { count: usersCount, error } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (!error && usersCount !== null) {
        setCount(usersCount);
      } else {
        setCount(0);
      }
    }
    fetchUsersCount();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'monospace', fontSize: '1.2rem', gap: '1rem' }}>
      {count !== null ? (
        <>
          <div style={{ color: 'green', fontWeight: 'bold' }}>
            ping avec succès à la base de données
          </div>
          <div>
            Date et heure : {new Date().toLocaleString('fr-FR')}
          </div>
          <div>
            Nombre d'utilisateurs : {count}
          </div>
        </>
      ) : (
        'Loading...'
      )}
    </div>
  );
}

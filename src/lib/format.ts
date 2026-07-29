export const formatPrice = (n: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND', minimumFractionDigits: 2 }).format(n);

export const formatDate = (s: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(s));

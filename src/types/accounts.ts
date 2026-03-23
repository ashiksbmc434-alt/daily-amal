export interface AccountCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
  isBuiltIn?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  note: string;
  date: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  createdAt: any; // Firestore Timestamp
}

export const BUILT_IN_CATEGORIES: AccountCategory[] = [
  { id: 'food', name: 'খাবার', type: 'expense', icon: '🍔', color: '#FF6B6B', isBuiltIn: true },
  { id: 'transport', name: 'যাতায়াত', type: 'expense', icon: '🚌', color: '#4D96FF', isBuiltIn: true },
  { id: 'shopping', name: 'শপিং', type: 'expense', icon: '🛍️', color: '#9B72AA', isBuiltIn: true },
  { id: 'academic', name: 'একাডেমিক খরচ', type: 'expense', icon: '📚', color: '#FFB319', isBuiltIn: true },
  { id: 'cosmetics', name: 'কসমেটিক্স', type: 'expense', icon: '💄', color: '#FF74B1', isBuiltIn: true },
  { id: 'medicine', name: 'ঔষধ', type: 'expense', icon: '💊', color: '#FF4949', isBuiltIn: true },
  { id: 'others', name: 'অন্যান্য খরচ', type: 'expense', icon: '✨', color: '#06D6A0', isBuiltIn: true },
  { id: 'salary', name: 'বেতন', type: 'income', icon: '💰', color: '#4CAF50', isBuiltIn: true },
  { id: 'gift', name: 'উপহার', type: 'income', icon: '🎁', color: '#FFD700', isBuiltIn: true },
];

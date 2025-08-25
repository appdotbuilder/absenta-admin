import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { AdminLogin } from '@/components/AdminLogin';
import { AdminDashboard } from '@/components/AdminDashboard';
// Import enhanced styles
import './App.css';
// Using type-only imports for better TypeScript compliance
import type { AdminLoginInput } from '../../server/src/schema';

// Define admin type without password for frontend use
type AdminWithoutPassword = {
  id: number;
  nis: string;
  email: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
};

function App() {
  const [currentAdmin, setCurrentAdmin] = useState<AdminWithoutPassword | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Handle admin login
  const handleLogin = async (loginData: AdminLoginInput) => {
    setIsLoading(true);
    setLoginError(null);
    
    try {
      const result = await trpc.adminLogin.mutate(loginData);
      
      if (result.success && result.admin) {
        setCurrentAdmin(result.admin);
        // Store admin session in localStorage for persistence
        localStorage.setItem('absenta_admin', JSON.stringify(result.admin));
      } else {
        setLoginError(result.message || 'Login gagal. Periksa kembali NIS/email dan password Anda.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle admin logout
  const handleLogout = useCallback(() => {
    setCurrentAdmin(null);
    localStorage.removeItem('absenta_admin');
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const savedAdmin = localStorage.getItem('absenta_admin');
    if (savedAdmin) {
      try {
        const adminData = JSON.parse(savedAdmin);
        setCurrentAdmin(adminData);
      } catch (error) {
        console.error('Failed to parse saved admin data:', error);
        localStorage.removeItem('absenta_admin');
      }
    }
  }, []);

  // If admin is not logged in, show login page
  if (!currentAdmin) {
    return (
      <AdminLogin 
        onLogin={handleLogin}
        isLoading={isLoading}
        error={loginError}
      />
    );
  }

  // If admin is logged in, show dashboard
  return (
    <AdminDashboard 
      admin={currentAdmin}
      onLogout={handleLogout}
    />
  );
}

export default App;
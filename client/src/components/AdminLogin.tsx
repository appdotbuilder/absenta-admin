import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { AdminLoginInput } from '../../../server/src/schema';

interface AdminLoginProps {
  onLogin: (data: AdminLoginInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function AdminLogin({ onLogin, isLoading, error }: AdminLoginProps) {
  const [formData, setFormData] = useState<AdminLoginInput>({
    identifier: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(formData);
  };

  const handleInputChange = (field: keyof AdminLoginInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: AdminLoginInput) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ABSENTA</h1>
          <p className="text-gray-600">Sistem Manajemen Kehadiran</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center text-gray-800">
              Masuk Admin
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Masukkan NIS atau email dan password untuk melanjutkan
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* NIS/Email Field */}
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-700 font-medium">
                  NIS atau Email
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Masukkan NIS atau email Anda"
                  value={formData.identifier}
                  onChange={handleInputChange('identifier')}
                  required
                  disabled={isLoading}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  disabled={isLoading}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-6"
                disabled={isLoading || !formData.identifier.trim() || !formData.password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </div>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 ABSENTA - Sistem Manajemen Kehadiran</p>
        </div>
      </div>
    </div>
  );
}
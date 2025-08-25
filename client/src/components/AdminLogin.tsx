import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User, Lock, Loader2 } from 'lucide-react';
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

  const [focusedField, setFocusedField] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Header with enhanced branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-6">
            <User className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">ABSENTA</h1>
          <p className="text-gray-600 text-lg font-medium">Sistem Manajemen Kehadiran</p>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full mx-auto mt-4"></div>
        </div>

        {/* Login Card with enhanced depth */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="space-y-2 pb-8 pt-8 px-8">
            <CardTitle className="text-2xl font-bold text-center text-gray-800 tracking-tight">
              Masuk Admin
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-base">
              Masukkan kredensial Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Alert with enhanced styling */}
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-xl transition-all duration-300 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {/* NIS/Email Field with enhanced interactions */}
              <div className="space-y-3">
                <Label 
                  htmlFor="identifier" 
                  className={`text-gray-700 font-semibold text-sm transition-colors duration-200 flex items-center gap-2 ${
                    focusedField === 'identifier' ? 'text-blue-600' : ''
                  }`}
                >
                  <User className="h-4 w-4" />
                  NIS atau Email
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Masukkan NIS atau email Anda"
                  value={formData.identifier}
                  onChange={handleInputChange('identifier')}
                  onFocus={() => setFocusedField('identifier')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className={`h-12 border-2 rounded-xl transition-all duration-200 bg-gray-50/50 focus:bg-white ${
                    focusedField === 'identifier'
                      ? 'border-blue-500 ring-4 ring-blue-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-60' : ''}`}
                />
              </div>

              {/* Password Field with enhanced interactions */}
              <div className="space-y-3">
                <Label 
                  htmlFor="password" 
                  className={`text-gray-700 font-semibold text-sm transition-colors duration-200 flex items-center gap-2 ${
                    focusedField === 'password' ? 'text-blue-600' : ''
                  }`}
                >
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  disabled={isLoading}
                  className={`h-12 border-2 rounded-xl transition-all duration-200 bg-gray-50/50 focus:bg-white ${
                    focusedField === 'password'
                      ? 'border-blue-500 ring-4 ring-blue-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-60' : ''}`}
                />
              </div>

              {/* Submit Button with enhanced states */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] mt-8"
                disabled={isLoading || !formData.identifier.trim() || !formData.password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Masuk
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer with subtle styling */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p className="bg-white/60 backdrop-blur-sm rounded-lg py-2 px-4 inline-block">
            © 2024 ABSENTA - Sistem Manajemen Kehadiran
          </p>
        </div>
      </div>
    </div>
  );
}
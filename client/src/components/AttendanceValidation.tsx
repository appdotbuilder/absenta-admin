import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  User,
  Calendar,
  FileText,
  Loader2,
  Shield,
  Activity
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { AttendanceWithStudent, ValidateAttendanceInput } from '../../../server/src/schema';

interface AttendanceValidationProps {
  attendances: AttendanceWithStudent[];
  onValidationSuccess: () => void;
  adminId: number;
}

export function AttendanceValidation({ 
  attendances, 
  onValidationSuccess, 
  adminId 
}: AttendanceValidationProps) {
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleValidation = async (
    attendanceId: number, 
    action: 'validate' | 'reject',
    studentName: string
  ) => {
    setProcessingIds((prev: Set<number>) => new Set(prev).add(attendanceId));
    setError(null);
    setSuccess(null);

    try {
      const input: ValidateAttendanceInput = {
        attendance_id: attendanceId,
        action,
        admin_id: adminId
      };

      await trpc.validateAttendance.mutate(input);
      
      const actionText = action === 'validate' ? 'divalidasi' : 'ditolak';
      setSuccess(`Absensi ${studentName} berhasil ${actionText} ✓`);
      
      // Call parent callback to refresh data
      onValidationSuccess();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Validation failed:', error);
      setError('Gagal memproses validasi. Silakan coba lagi.');
    } finally {
      setProcessingIds((prev: Set<number>) => {
        const newSet = new Set(prev);
        newSet.delete(attendanceId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hadir':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'izin':
        return <Clock className="h-5 w-5 text-amber-500" />;
      case 'sakit':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'alpha':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      hadir: { className: 'bg-green-100 text-green-800 border-green-200 font-semibold' },
      izin: { className: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold' },
      sakit: { className: 'bg-blue-100 text-blue-800 border-blue-200 font-semibold' },
      alpha: { className: 'bg-red-100 text-red-800 border-red-200 font-semibold' }
    };

    const config = variants[status] || variants.hadir;
    return (
      <Badge className={`${config.className} px-3 py-1 rounded-full border-2 transition-all duration-200`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (attendances.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
              <Shield className="h-6 w-6" />
            </div>
            Validasi Absensi
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            Kelola validasi absensi siswa yang memerlukan persetujuan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-2xl mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Semua Absensi Tervalidasi
            </h3>
            <p className="text-gray-600 text-lg">
              Tidak ada absensi yang memerlukan validasi saat ini.
            </p>
            <div className="mt-6 p-4 bg-white/60 rounded-xl">
              <p className="text-sm text-green-600 font-medium">
                Sistem akan memperbarui secara otomatis ketika ada absensi baru
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white">
              <Shield className="h-6 w-6" />
            </div>
            Validasi Absensi
          </CardTitle>
          <CardDescription className="text-gray-700 text-base font-medium">
            <span className="inline-flex items-center gap-2 bg-white/60 rounded-full px-4 py-2">
              <Activity className="h-4 w-4" />
              {attendances.length} absensi menunggu validasi Anda
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages with enhanced styling */}
      {success && (
        <Alert className="bg-green-50 border-2 border-green-200 text-green-800 rounded-2xl shadow-lg animate-in slide-in-from-top-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="font-semibold text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="border-2 border-red-200 rounded-2xl shadow-lg animate-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Attendance List with enhanced design */}
      <div className="space-y-6">
        {attendances.map((attendance: AttendanceWithStudent, index: number) => (
          <Card 
            key={attendance.id} 
            className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group"
          >
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                
                {/* Student Info */}
                <div className="flex items-center gap-4 lg:col-span-6">
                  <Avatar className="h-16 w-16 border-3 border-white shadow-lg ring-4 ring-blue-50 group-hover:ring-blue-100 transition-all duration-200">
                    <AvatarImage 
                      src={attendance.student.photo_url || undefined} 
                      alt={attendance.student.full_name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                      {attendance.student.full_name.split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-800 truncate text-lg mb-1">
                      {attendance.student.full_name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                        <User className="h-3 w-3" />
                        {attendance.student.nis}
                      </span>
                      <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-1 font-medium">
                        {attendance.student.class_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-full px-3 py-1 inline-flex">
                      <Calendar className="h-3 w-3" />
                      {new Date(attendance.date).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                <div className="flex flex-col items-start lg:items-center gap-3 lg:col-span-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(attendance.status)}
                    {getStatusBadge(attendance.status)}
                  </div>
                  
                  {attendance.notes && (
                    <div className="w-full max-w-xs bg-gray-50 rounded-xl p-3 border border-gray-200">
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                        <span className="text-gray-700 line-clamp-3 font-medium">{attendance.notes}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons with enhanced styling */}
                <div className="flex gap-3 lg:justify-end lg:col-span-3">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold flex-1 lg:flex-none rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => handleValidation(attendance.id, 'validate', attendance.student.full_name)}
                    disabled={processingIds.has(attendance.id)}
                  >
                    {processingIds.has(attendance.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Validasi
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold flex-1 lg:flex-none rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    onClick={() => handleValidation(attendance.id, 'reject', attendance.student.full_name)}
                    disabled={processingIds.has(attendance.id)}
                  >
                    {processingIds.has(attendance.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Tolak
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
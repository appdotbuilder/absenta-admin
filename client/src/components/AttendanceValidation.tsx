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
  FileText
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
      setSuccess(`Absensi ${studentName} berhasil ${actionText}`);
      
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'izin':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'sakit':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'alpha':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      hadir: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      izin: { variant: 'secondary', className: 'bg-amber-100 text-amber-800 border-amber-200' },
      sakit: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      alpha: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = variants[status] || variants.hadir;
    return (
      <Badge className={`${config.className} font-medium`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (attendances.length === 0) {
    return (
      <Card className="border-0 shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Validasi Absensi
          </CardTitle>
          <CardDescription className="text-gray-600">
            Kelola validasi absensi siswa yang memerlukan persetujuan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">
              Semua Absensi Tervalidasi
            </h3>
            <p className="text-gray-600">
              Tidak ada absensi yang memerlukan validasi saat ini.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Validasi Absensi
          </CardTitle>
          <CardDescription className="text-gray-600">
            {attendances.length} absensi menunggu validasi Anda
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Attendance List */}
      <div className="space-y-4">
        {attendances.map((attendance: AttendanceWithStudent) => (
          <Card key={attendance.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                
                {/* Student Info */}
                <div className="flex items-center gap-3 lg:col-span-2">
                  <Avatar className="h-12 w-12 border-2 border-gray-200">
                    <AvatarImage 
                      src={attendance.student.photo_url || undefined} 
                      alt={attendance.student.full_name}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {attendance.student.full_name.split(' ')
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-800 truncate">
                      {attendance.student.full_name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {attendance.student.nis}
                      </span>
                      <span>{attendance.student.class_name}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
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
                <div className="flex flex-col items-start lg:items-center gap-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(attendance.status)}
                    {getStatusBadge(attendance.status)}
                  </div>
                  
                  {attendance.notes && (
                    <div className="flex items-start gap-1 text-xs text-gray-600 max-w-xs">
                      <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{attendance.notes}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 lg:justify-end">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 lg:flex-none"
                    onClick={() => handleValidation(attendance.id, 'validate', attendance.student.full_name)}
                    disabled={processingIds.has(attendance.id)}
                  >
                    {processingIds.has(attendance.id) ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Validasi
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 flex-1 lg:flex-none"
                    onClick={() => handleValidation(attendance.id, 'reject', attendance.student.full_name)}
                    disabled={processingIds.has(attendance.id)}
                  >
                    {processingIds.has(attendance.id) ? (
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
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
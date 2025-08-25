import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  Users, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ExportReportInput, AbsenceSummary } from '../../../server/src/schema';

export function ExportReport() {
  const [formData, setFormData] = useState<ExportReportInput>({
    class_name: '',
    start_date: '',
    end_date: '',
    format: 'excel'
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<AbsenceSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Set default dates (current month)
  const getCurrentMonthDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      start_date: startOfMonth.toISOString().split('T')[0],
      end_date: endOfMonth.toISOString().split('T')[0]
    };
  };

  // Initialize with current month dates
  useState(() => {
    const dates = getCurrentMonthDates();
    setFormData((prev: ExportReportInput) => ({
      ...prev,
      ...dates
    }));
  });

  const handleInputChange = (field: keyof ExportReportInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev: ExportReportInput) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Load preview data
  const handlePreview = async () => {
    if (!formData.start_date || !formData.end_date) {
      setError('Harap isi tanggal mulai dan tanggal akhir');
      return;
    }

    setIsPreviewLoading(true);
    setError(null);
    
    try {
      const data = await trpc.getAbsenceSummary.query({
        class_name: formData.class_name || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date
      });
      
      setPreviewData(data);
      setSuccess(`Ditemukan ${data.length} record ketidakhadiran`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to load preview:', error);
      setError('Gagal memuat preview data. Silakan coba lagi.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Export report
  const handleExport = async () => {
    if (!formData.start_date || !formData.end_date) {
      setError('Harap isi tanggal mulai dan tanggal akhir');
      return;
    }

    setIsExporting(true);
    setError(null);
    
    try {
      const result = await trpc.exportAbsenceReport.mutate(formData);
      
      if (result.success && result.download_url) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = `rekap-ketidakhadiran-${formData.start_date}-${formData.end_date}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setSuccess('Laporan berhasil diunduh!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || 'Gagal mengekspor laporan');
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Gagal mengekspor laporan. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const isFormValid = formData.start_date && formData.end_date;

  return (
    <div className="space-y-6">
      {/* Export Form */}
      <Card className="border-0 shadow-md bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Ekspor Rekap Ketidakhadiran Siswa per Kelas
          </CardTitle>
          <CardDescription className="text-gray-600">
            Generate laporan ketidakhadiran siswa dalam format Excel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
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

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class_name" className="text-gray-700 font-medium">
                Kelas (Opsional)
              </Label>
              <Input
                id="class_name"
                type="text"
                placeholder="Contoh: X-1, XI-IPA-2, XII-IPS-1"
                value={formData.class_name}
                onChange={handleInputChange('class_name')}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Kosongkan untuk semua kelas
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">
                Format Export
              </Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Excel (.xlsx)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-gray-700 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Mulai
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange('start_date')}
                required
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-gray-700 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Akhir
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange('end_date')}
                required
                min={formData.start_date}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePreview}
              disabled={!isFormValid || isPreviewLoading}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50"
            >
              {isPreviewLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memuat Preview...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Preview Data
                </>
              )}
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={!isFormValid || isExporting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Ekspor Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Results */}
      {previewData.length > 0 && (
        <Card className="border-0 shadow-md bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Preview Data Ketidakhadiran
            </CardTitle>
            <CardDescription className="text-gray-600">
              Menampilkan {previewData.length} siswa dengan ketidakhadiran dalam periode yang dipilih
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-medium text-gray-700">Kelas</th>
                    <th className="text-left p-3 font-medium text-gray-700">Nama Siswa</th>
                    <th className="text-left p-3 font-medium text-gray-700">NIS</th>
                    <th className="text-right p-3 font-medium text-gray-700">Total Tidak Hadir</th>
                    <th className="text-right p-3 font-medium text-gray-700">Izin</th>
                    <th className="text-right p-3 font-medium text-gray-700">Sakit</th>
                    <th className="text-right p-3 font-medium text-gray-700">Alpha</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((student: AbsenceSummary, index: number) => (
                    <tr key={`${student.nis}-${index}`} className="border-b border-gray-100">
                      <td className="p-3 text-gray-800">{student.class_name}</td>
                      <td className="p-3 font-medium text-gray-800">{student.student_name}</td>
                      <td className="p-3 text-gray-600">{student.nis}</td>
                      <td className="p-3 text-right font-semibold text-gray-800">{student.total_absences}</td>
                      <td className="p-3 text-right text-amber-600">{student.breakdown.izin}</td>
                      <td className="p-3 text-right text-blue-600">{student.breakdown.sakit}</td>
                      <td className="p-3 text-right text-red-600">{student.breakdown.alpha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previewData.length > 10 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Menampilkan {Math.min(10, previewData.length)} dari {previewData.length} siswa
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
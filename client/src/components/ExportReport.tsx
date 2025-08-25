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
  Loader2,
  Eye,
  Filter,
  BarChart3,
  FileX
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
      setSuccess(`Ditemukan ${data.length} siswa dengan ketidakhadiran ✓`);
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
        
        setSuccess('Laporan berhasil diunduh! 📊');
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
    <div className="space-y-8">
      {/* Export Form with enhanced design */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            Ekspor Rekap Ketidakhadiran Siswa per Kelas
          </CardTitle>
          <CardDescription className="text-gray-700 text-base">
            Generate laporan komprehensif ketidakhadiran siswa dalam format Excel yang mudah dianalisis
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8 bg-white/60 backdrop-blur-sm m-6 p-6 rounded-2xl">
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

          {/* Form Fields with enhanced styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="class_name" className="text-gray-800 font-bold text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filter Kelas (Opsional)
              </Label>
              <Input
                id="class_name"
                type="text"
                placeholder="Contoh: X-1, XI-IPA-2, XII-IPS-1"
                value={formData.class_name}
                onChange={handleInputChange('class_name')}
                className="h-12 border-2 border-gray-200 rounded-xl bg-white/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              />
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                💡 Kosongkan untuk mengekspor data dari semua kelas
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-800 font-bold text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Format Export
              </Label>
              <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                <div>
                  <span className="font-bold text-gray-800">Microsoft Excel (.xlsx)</span>
                  <p className="text-sm text-green-600">Format standar industri untuk analisis data</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="start_date" className="text-gray-800 font-bold text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tanggal Mulai
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange('start_date')}
                required
                className="h-12 border-2 border-gray-200 rounded-xl bg-white/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="end_date" className="text-gray-800 font-bold text-sm flex items-center gap-2">
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
                className="h-12 border-2 border-gray-200 rounded-xl bg-white/80 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              />
            </div>
          </div>

          <Separator className="border-gray-300" />

          {/* Action Buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handlePreview}
              disabled={!isFormValid || isPreviewLoading}
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              {isPreviewLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Memuat Preview...
                </>
              ) : (
                <>
                  <Eye className="h-5 w-5 mr-3" />
                  Preview Data
                </>
              )}
            </Button>
            
            <Button
              onClick={handleExport}
              disabled={!isFormValid || isExporting}
              className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-3" />
                  Ekspor Excel
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Results with enhanced design */}
      {previewData.length > 0 && (
        <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              Preview Data Ketidakhadiran
            </CardTitle>
            <CardDescription className="text-gray-700 text-base font-medium">
              <span className="inline-flex items-center gap-2 bg-white/60 rounded-full px-4 py-2">
                <Users className="h-4 w-4" />
                Menampilkan {previewData.length} siswa dengan ketidakhadiran dalam periode yang dipilih
              </span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-bold text-gray-700">Kelas</th>
                    <th className="text-left p-4 font-bold text-gray-700">Nama Siswa</th>
                    <th className="text-left p-4 font-bold text-gray-700">NIS</th>
                    <th className="text-center p-4 font-bold text-gray-700">Total</th>
                    <th className="text-center p-4 font-bold text-amber-600">Izin</th>
                    <th className="text-center p-4 font-bold text-blue-600">Sakit</th>
                    <th className="text-center p-4 font-bold text-red-600">Alpha</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((student: AbsenceSummary, index: number) => (
                    <tr 
                      key={`${student.nis}-${index}`} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {student.class_name}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-800">{student.student_name}</td>
                      <td className="p-4 text-gray-600 font-mono">{student.nis}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-800">
                          {student.total_absences}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 font-bold text-amber-800">
                          {student.breakdown.izin}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 font-bold text-blue-800">
                          {student.breakdown.sakit}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 font-bold text-red-800">
                          {student.breakdown.alpha}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {previewData.length > 10 && (
              <div className="p-6 text-center bg-gray-50 border-t border-gray-200">
                <p className="text-gray-600 font-medium">
                  Dan {previewData.length - 10} siswa lainnya akan disertakan dalam ekspor Excel...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No data state */}
      {previewData.length === 0 && isPreviewLoading === false && formData.start_date && formData.end_date && (
        <Card className="border-0 shadow-lg bg-gray-50 rounded-2xl overflow-hidden">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-2xl mb-6">
                <FileX className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data</h3>
              <p className="text-gray-600">
                Klik "Preview Data" untuk melihat data ketidakhadiran dalam periode yang dipilih
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
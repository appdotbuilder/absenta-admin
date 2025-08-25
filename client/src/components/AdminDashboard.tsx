import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  LogOut, 
  Bell, 
  FileSpreadsheet, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { AttendanceValidation } from '@/components/AttendanceValidation';
import { ExportReport } from '@/components/ExportReport';
import { AttendanceChart } from '@/components/AttendanceChart';
import type { 
  DashboardStats, 
  AttendanceWithStudent 
} from '../../../server/src/schema';

// Define admin type without password for frontend use
type AdminWithoutPassword = {
  id: number;
  nis: string;
  email: string;
  full_name: string;
  created_at: Date;
  updated_at: Date;
};

interface AdminDashboardProps {
  admin: AdminWithoutPassword;
  onLogout: () => void;
}

export function AdminDashboard({ admin, onLogout }: AdminDashboardProps) {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [pendingAttendances, setPendingAttendances] = useState<AttendanceWithStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [stats, pending] = await Promise.all([
        trpc.getDashboardStats.query(),
        trpc.getPendingAttendances.query()
      ]);
      
      setDashboardStats(stats);
      setPendingAttendances(pending);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle attendance validation success
  const handleValidationSuccess = useCallback(() => {
    loadDashboardData(); // Refresh all data after validation
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Memuat dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">ABSENTA</h1>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-medium text-gray-800">{admin.full_name}</p>
              <p className="text-sm text-gray-600">{admin.email}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg border border-gray-200">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Validasi</span>
              {dashboardStats && dashboardStats.pending_validations > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                  {dashboardStats.pending_validations}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Laporan</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Pending Validations Card */}
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Menunggu Validasi
                  </CardTitle>
                  <Bell className="h-5 w-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-gray-800">
                      {dashboardStats?.pending_validations || 0}
                    </div>
                    <div className="text-sm text-gray-600">siswa</div>
                  </div>
                  {dashboardStats && dashboardStats.pending_validations > 0 && (
                    <Button 
                      size="sm" 
                      className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => setActiveTab('validation')}
                    >
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Lihat Detail
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Today's Total Attendance */}
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total Kehadiran Hari Ini
                  </CardTitle>
                  <Users className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-gray-800">
                      {dashboardStats?.today_stats?.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">siswa</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Data kehadiran hari ini
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-md bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Pintasan Cepat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setActiveTab('validation')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validasi Absensi
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50"
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Ekspor Laporan
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Today's Attendance Chart */}
            {dashboardStats?.today_stats && (
              <Card className="border-0 shadow-md bg-white">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Statistik Kehadiran Hari Ini
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Distribusi status kehadiran siswa untuk hari ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceChart stats={dashboardStats.today_stats} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation">
            <AttendanceValidation 
              attendances={pendingAttendances}
              onValidationSuccess={handleValidationSuccess}
              adminId={admin.id}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ExportReport />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
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
  AlertCircle,
  TrendingUp,
  Activity,
  Loader2
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-lg font-semibold">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header with enhanced design */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl shadow-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ABSENTA</h1>
              <p className="text-sm text-gray-600 font-medium">Admin Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block bg-white/60 rounded-xl px-4 py-2">
              <p className="font-semibold text-gray-800">{admin.full_name}</p>
              <p className="text-sm text-gray-600">{admin.email}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-gray-200/50 shadow-sm">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-3 rounded-xl transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-3"
            >
              <Activity className="h-5 w-5" />
              <span className="font-semibold">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="validation" 
              className="flex items-center gap-3 rounded-xl transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-3 relative"
            >
              <Bell className="h-5 w-5" />
              <span className="font-semibold">Validasi</span>
              {dashboardStats && dashboardStats.pending_validations > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold min-w-[1.25rem] h-5 flex items-center justify-center">
                  {dashboardStats.pending_validations}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-3 rounded-xl transition-all duration-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg py-3"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="font-semibold">Laporan</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Stats Cards with enhanced design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pending Validations Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-semibold text-orange-700">
                    Menunggu Validasi
                  </CardTitle>
                  <div className="p-3 bg-orange-500 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Bell className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <div className="text-4xl font-bold text-orange-800">
                      {dashboardStats?.pending_validations || 0}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">siswa</div>
                  </div>
                  {dashboardStats && dashboardStats.pending_validations > 0 ? (
                    <Button 
                      size="sm" 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                      onClick={() => setActiveTab('validation')}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Lihat Detail
                    </Button>
                  ) : (
                    <p className="text-sm text-orange-600 bg-white/50 rounded-lg p-3 text-center">
                      Semua absensi telah divalidasi ✓
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Today's Total Attendance */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-sm font-semibold text-blue-700">
                    Total Kehadiran Hari Ini
                  </CardTitle>
                  <div className="p-3 bg-blue-500 text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                    <Users className="h-6 w-6" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-3">
                    <div className="text-4xl font-bold text-blue-800">
                      {dashboardStats?.today_stats?.total || 0}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">siswa</div>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>Data kehadiran terkini</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Pintasan Cepat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => setActiveTab('validation')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validasi Absensi
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-semibold rounded-xl transition-all duration-200"
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
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
                      <Activity className="h-6 w-6" />
                    </div>
                    Statistik Kehadiran Hari Ini
                  </CardTitle>
                  <CardDescription className="text-gray-600 text-base">
                    Visualisasi distribusi status kehadiran siswa untuk hari ini
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
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
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, Users, TrendingUp } from 'lucide-react';

interface AttendanceStats {
  hadir: number;
  izin: number;
  sakit: number;
  alpha: number;
  total: number;
}

interface AttendanceChartProps {
  stats: AttendanceStats;
}

export function AttendanceChart({ stats }: AttendanceChartProps) {
  const { hadir, izin, sakit, alpha, total } = stats;

  // Calculate percentages
  const hadirPercentage = total > 0 ? (hadir / total) * 100 : 0;
  const izinPercentage = total > 0 ? (izin / total) * 100 : 0;
  const sakitPercentage = total > 0 ? (sakit / total) * 100 : 0;
  const alphaPercentage = total > 0 ? (alpha / total) * 100 : 0;

  // Enhanced color palette
  const colors = {
    hadir: {
      primary: '#10B981', // emerald-500
      light: '#D1FAE5',   // emerald-100
      dark: '#059669'     // emerald-600
    },
    izin: {
      primary: '#F59E0B', // amber-500
      light: '#FEF3C7',   // amber-100
      dark: '#D97706'     // amber-600
    },
    sakit: {
      primary: '#3B82F6', // blue-500
      light: '#DBEAFE',   // blue-100
      dark: '#2563EB'     // blue-600
    },
    alpha: {
      primary: '#EF4444', // red-500
      light: '#FEE2E2',   // red-100
      dark: '#DC2626'     // red-600
    }
  };

  // SVG pie chart calculation with enhanced styling
  const radius = 90;
  const innerRadius = 35;
  const circumference = 2 * Math.PI * radius;
  
  const createPath = (percentage: number, startAngle: number) => {
    if (percentage === 0) return '';
    
    const angle = (percentage / 100) * 360;
    const x1 = 120 + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 120 + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 120 + radius * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = 120 + radius * Math.sin(((startAngle + angle) * Math.PI) / 180);
    
    const ix1 = 120 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
    const iy1 = 120 + innerRadius * Math.sin((startAngle * Math.PI) / 180);
    const ix2 = 120 + innerRadius * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const iy2 = 120 + innerRadius * Math.sin(((startAngle + angle) * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
  };

  let currentAngle = -90; // Start from top

  const segments = [
    { key: 'hadir', value: hadir, percentage: hadirPercentage, colors: colors.hadir, label: 'Hadir', icon: CheckCircle },
    { key: 'izin', value: izin, percentage: izinPercentage, colors: colors.izin, label: 'Izin', icon: Clock },
    { key: 'sakit', value: sakit, percentage: sakitPercentage, colors: colors.sakit, label: 'Sakit', icon: AlertCircle },
    { key: 'alpha', value: alpha, percentage: alphaPercentage, colors: colors.alpha, label: 'Alpha', icon: XCircle }
  ].filter(segment => segment.value > 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-2xl mb-6">
            <Users className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Data</h3>
          <p className="text-gray-600">Belum ada data kehadiran untuk hari ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Enhanced Pie Chart */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200/20 to-purple-200/20 blur-xl"></div>
          
          <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90 relative z-10">
            {/* Background circle */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="3"
              className="opacity-30"
            />
            
            {/* Segments */}
            {segments.map((segment, index) => {
              const path = createPath(segment.percentage, currentAngle);
              const prevAngle = currentAngle;
              currentAngle += (segment.percentage / 100) * 360;
              
              return (
                <g key={segment.key}>
                  <path
                    d={path}
                    fill={segment.colors.primary}
                    stroke="white"
                    strokeWidth="3"
                    className="transition-all duration-500 hover:brightness-110 cursor-pointer drop-shadow-sm"
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Enhanced center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white rounded-full w-24 h-24 flex items-center justify-center shadow-xl border-4 border-gray-50">
              <div>
                <div className="text-2xl font-bold text-gray-800">{total}</div>
                <div className="text-xs text-gray-500 font-semibold">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Distribusi Kehadiran
          </h3>
          <p className="text-sm text-gray-600">Breakdown status siswa hari ini</p>
        </div>

        {/* Legend items */}
        {segments.map((segment) => {
          const Icon = segment.icon;
          return (
            <div 
              key={segment.key} 
              className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gradient-to-r hover:shadow-lg transition-all duration-200 group cursor-pointer"
              style={{ 
                background: `linear-gradient(135deg, ${segment.colors.light} 0%, white 100%)`,
                borderColor: segment.colors.primary + '30'
              }}
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-6 h-6 rounded-full shadow-sm ring-2 ring-white"
                  style={{ backgroundColor: segment.colors.primary }}
                />
                <Icon 
                  className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" 
                  style={{ color: segment.colors.dark }} 
                />
                <span className="font-bold text-gray-700 text-base">{segment.label}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl text-gray-800 mb-1">{segment.value}</div>
                <div 
                  className="text-sm font-semibold px-3 py-1 rounded-full text-white shadow-sm"
                  style={{ backgroundColor: segment.colors.primary }}
                >
                  {segment.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}

        {/* Summary card */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-blue-800">Total Siswa</p>
                <p className="text-sm text-blue-600">Data terkini</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-800">{total}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
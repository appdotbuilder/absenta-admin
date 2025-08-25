import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, Users } from 'lucide-react';

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

  // Colors for each status
  const colors = {
    hadir: '#10B981', // green-500
    izin: '#F59E0B', // amber-500
    sakit: '#3B82F6', // blue-500
    alpha: '#EF4444'  // red-500
  };

  // SVG pie chart calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  
  const createPath = (percentage: number, startAngle: number) => {
    if (percentage === 0) return '';
    
    const angle = (percentage / 100) * 360;
    const x1 = 100 + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 100 + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 100 + radius * Math.cos(((startAngle + angle) * Math.PI) / 180);
    const y2 = 100 + radius * Math.sin(((startAngle + angle) * Math.PI) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `M 100 100 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -90; // Start from top

  const segments = [
    { key: 'hadir', value: hadir, percentage: hadirPercentage, color: colors.hadir, label: 'Hadir', icon: CheckCircle },
    { key: 'izin', value: izin, percentage: izinPercentage, color: colors.izin, label: 'Izin', icon: Clock },
    { key: 'sakit', value: sakit, percentage: sakitPercentage, color: colors.sakit, label: 'Sakit', icon: AlertCircle },
    { key: 'alpha', value: alpha, percentage: alphaPercentage, color: colors.alpha, label: 'Alpha', icon: XCircle }
  ].filter(segment => segment.value > 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Tidak ada data kehadiran hari ini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
      {/* Pie Chart */}
      <div className="flex justify-center">
        <div className="relative">
          <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
            {segments.map((segment, index) => {
              const path = createPath(segment.percentage, currentAngle);
              const prevAngle = currentAngle;
              currentAngle += (segment.percentage / 100) * 360;
              
              return (
                <path
                  key={segment.key}
                  d={path}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
          </svg>
          
          {/* Center circle with total */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-sm border border-gray-200">
              <div>
                <div className="text-xl font-bold text-gray-800">{total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {segments.map((segment) => {
          const Icon = segment.icon;
          return (
            <div key={segment.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <Icon className="h-4 w-4" style={{ color: segment.color }} />
                <span className="font-medium text-gray-700">{segment.label}</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">{segment.value}</div>
                <div className="text-xs text-gray-600">
                  {segment.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


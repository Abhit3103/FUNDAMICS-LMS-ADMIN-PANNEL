import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, CalendarCheck, Award } from 'lucide-react';

const attendanceTrend = [
  { day: 'Mon', rate: 92 },
  { day: 'Tue', rate: 95 },
  { day: 'Wed', rate: 91 },
  { day: 'Thu', rate: 94 },
  { day: 'Fri', rate: 96 },
  { day: 'Sat', rate: 89 },
];

const batchDistribution = [
  { name: 'Class 10 - Fdn', students: 48 },
  { name: 'Class 11 - JEE', students: 62 },
  { name: 'Class 11 - NEET', students: 54 },
  { name: 'Class 12 - JEE', students: 58 },
  { name: 'Class 12 - NEET', students: 66 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Centre Performance Analytics"
        description="Comprehensive metrics, academic benchmarks, student attendance trends, and cohort growth."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Analytics' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Attendance Average</span>
              <CalendarCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold">93.8%</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +2.4% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Test Pass Rate</span>
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-bold">88.2%</div>
            <p className="text-xs text-purple-600 mt-1">Across 12 mock exams</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Active Cohorts</span>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl font-bold">14 Batches</div>
            <p className="text-xs text-muted-foreground mt-1">Across 6 academic standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Biometric Compliance</span>
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold">97.1%</div>
            <p className="text-xs text-muted-foreground mt-1">Secureye device feed</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Attendance Progression</CardTitle>
            <CardDescription>Daily present rate (%) across all active batches</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" />
                <YAxis domain={[80, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="Attendance %"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Cohort Enrollment Distribution</CardTitle>
            <CardDescription>Number of registered students per academic standard</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batchDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" name="Students" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

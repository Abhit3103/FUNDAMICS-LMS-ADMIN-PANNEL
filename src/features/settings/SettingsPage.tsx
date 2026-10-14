import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  Loader2,
  Building,
  Shield,
  Bell,
  Clock,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from './settings.api';
import { useAuth } from '@/features/auth/auth.context';
import { toast } from '@/hooks/use-toast';
import type { UpdateInstituteSettingsRequest } from '@/types';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'institute' | 'account'>('institute');

  // Institute settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [attendanceCutoff, setAttendanceCutoff] = useState('09:30:00');
  const [requiredHours, setRequiredHours] = useState('6.0');
  const [missingCheckoutPolicy, setMissingCheckoutPolicy] = useState('HALF_DAY');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['institute-settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  useEffect(() => {
    if (settings) {
      setNotificationsEnabled(Boolean(settings.notifications_enabled));
      setAttendanceCutoff(settings.attendance_cutoff_time || '09:30:00');
      setRequiredHours(String(settings.attendance_required_hours ?? 6.0));
      setMissingCheckoutPolicy(settings.missing_checkout_policy || 'HALF_DAY');
      setTimezone(settings.timezone || 'Asia/Kolkata');
      setHasUnsavedChanges(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateInstituteSettingsRequest) =>
      settingsApi.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institute-settings'] });
      setHasUnsavedChanges(false);
      toast({
        title: 'Settings Saved',
        description: 'Institute configurations and ERP messaging state updated on backend.',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err?.response?.data?.detail || 'Could not update institute settings.',
      });
    },
  });

  const handleSaveInstituteSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateInstituteSettingsRequest = {
      notifications_enabled: notificationsEnabled,
      attendance_cutoff_time: attendanceCutoff,
      attendance_required_hours: parseFloat(requiredHours) || 6.0,
      missing_checkout_policy: missingCheckoutPolicy,
      timezone: timezone.trim() || 'Asia/Kolkata',
    };
    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Settings & Administration"
        description="Configure institute operating rules, ERP automated messaging, attendance thresholds, and administrator credentials."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Settings' },
        ]}
      />

      {/* Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('institute')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'institute'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building className="h-4 w-4" />
          Institute & ERP Policies
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'account'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          Account & Security
        </button>
      </div>

      {activeTab === 'institute' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Institute Operating Policies & Messaging
                </CardTitle>
                <CardDescription>
                  Live parameters governing attendance calculation, cutoff times, and automated ERP alerts.
                </CardDescription>
              </div>
              {hasUnsavedChanges && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Unsaved changes
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading institute settings...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveInstituteSettings} className="space-y-6">
                {/* ERP Messaging Switch */}
                <div className="rounded-lg border p-4 bg-muted/30 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <Label htmlFor="erp-toggle" className="font-semibold text-sm cursor-pointer">
                        Automated ERP Messaging & Notifications
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When enabled, the backend dispatches automated attendance and result alerts to students and guardians.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="erp-toggle"
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => {
                        setNotificationsEnabled(e.target.checked);
                        setHasUnsavedChanges(true);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="cutoff">Attendance Cutoff Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cutoff"
                        value={attendanceCutoff}
                        onChange={(e) => {
                          setAttendanceCutoff(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        placeholder="09:30:00"
                        className="pl-9 font-mono text-sm"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Punches after this cutoff time are categorized as LATE arrivals.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="req-hours">Faculty Required Daily Hours</Label>
                    <Input
                      id="req-hours"
                      type="number"
                      step="0.5"
                      min={1}
                      max={24}
                      value={requiredHours}
                      onChange={(e) => {
                        setRequiredHours(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="font-mono text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Minimum working duration for faculty to receive full-day attendance credit.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="policy">Missing Check-Out Policy</Label>
                    <select
                      id="policy"
                      value={missingCheckoutPolicy}
                      onChange={(e) => {
                        setMissingCheckoutPolicy(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="HALF_DAY">HALF_DAY — Credit half day only</option>
                      <option value="ABSENT">ABSENT — Mark absent for missing punch-out</option>
                      <option value="REVIEW_REQUIRED">REVIEW_REQUIRED — Flag for admin audit</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">Institute Timezone</Label>
                    <Input
                      id="timezone"
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Asia/Kolkata"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Institute Status: <span className="font-semibold text-foreground uppercase">{settings?.status || 'ACTIVE'}</span>
                  </div>
                  <Button
                    type="submit"
                    disabled={updateMutation.isPending || !hasUnsavedChanges}
                    className="min-w-[140px]"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Apply Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Admin Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Active Administrator Profile
              </CardTitle>
              <CardDescription>
                Verified session details authenticated against the FUNDAMICS LMS security gateway.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="text-sm font-semibold text-foreground">{user?.full_name || user?.name || 'Administrator'}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <p className="text-xs text-muted-foreground">Primary Email</p>
                  <p className="text-sm font-semibold font-mono text-foreground">{user?.email || 'admin@fundamics.com'}</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <p className="text-xs text-muted-foreground">Access Role</p>
                  <Badge variant="default" className="text-xs">
                    {String(user?.role || 'ADMIN').toUpperCase()}
                  </Badge>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 space-y-1">
                  <p className="text-xs text-muted-foreground">Account Status</p>
                  <Badge variant="success" className="text-xs flex items-center gap-1 w-fit">
                    <CheckCircle2 className="h-3 w-3" /> ACTIVE & VERIFIED
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password & Security Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security & Credential Management
              </CardTitle>
              <CardDescription>
                Manage administrator login password and account recovery rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Backend API Compatibility Notice */}
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900 p-4 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Password Update Endpoint Status</p>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                    The deployed backend OpenAPI specification (<code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">/api/v1/openapi.json</code>)
                    does not expose an administrative password mutation route (<code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">PATCH /auth/password</code> or <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">/admin/users/{'{id}'}/password</code>).
                    To protect security integrity, client-side simulation is disabled. Administrator credential rotation must be performed via backend administrative tools.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60 pointer-events-none">
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input type="password" value="••••••••••••" readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type="password" value="••••••••••••" readOnly />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="outline" disabled className="text-xs">
                  Password Updates Require Backend API Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import { useState, useId } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Menu,
  LogOut,
  User,
  ChevronDown,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Radio,
  UserCheck,
  Loader2,
  Info,
} from 'lucide-react';
import { useAuth } from '@/features/auth/auth.context';
import { settingsApi } from '@/features/settings/settings.api';
import { calendarApi } from '@/features/calendar/calendar.api';
import { registrationApprovalsApi } from '@/features/students/registration-approvals.api';
import { RegistrationApprovalsList } from '@/features/students/RegistrationApprovalsList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

interface TopBarProps {
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export function TopBar({ onToggleSidebar, onOpenMobileSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const erpMessagingSwitchId = useId();

  // Dialog states
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  // 1. Institute Settings Query
  const { data: instituteSettings } = useQuery({
    queryKey: ['institute-settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  // Operating states
  const [isCoachingOpen, setIsCoachingOpen] = useState(true);
  const [erpMessagingEnabled, setErpMessagingEnabled] = useState(true);
  const [cutoffTime, setCutoffTime] = useState('09:30:00');
  const [requiredHours, setRequiredHours] = useState('6.0');
  const [closureReason, setClosureReason] = useState('');
  const [hasUnsavedOpChanges, setHasUnsavedOpChanges] = useState(false);

  // Initialize from live settings
  useState(() => {
    if (instituteSettings) {
      setErpMessagingEnabled(Boolean(instituteSettings.notifications_enabled));
      setCutoffTime(instituteSettings.attendance_cutoff_time || '09:30:00');
      setRequiredHours(String(instituteSettings.attendance_required_hours ?? 6.0));
    }
  });

  // 2. Pending Student Registrations Query for Approvals Badge & Live Queue
  const { data: pendingRegistrations = [] } = useQuery({
    queryKey: ['pending-registrations'],
    queryFn: () => registrationApprovalsApi.getPendingRegistrations({ limit: 100 }),
    refetchInterval: 30000,
  });

  // Update Settings & Calendar Mutation
  const applyOperationsMutation = useMutation({
    mutationFn: async () => {
      // 1. Update Institute Settings
      await settingsApi.updateSettings({
        notifications_enabled: erpMessagingEnabled,
        attendance_cutoff_time: cutoffTime,
        attendance_required_hours: parseFloat(requiredHours) || 6.0,
      });

      // 2. If Coaching is marked CLOSED and a reason is provided, create a calendar event
      if (!isCoachingOpen && closureReason.trim()) {
        const today = new Date().toISOString().split('T')[0];
        await calendarApi.createEvent({
          title: `Centre Closed: ${closureReason.trim()}`,
          date: today,
          type: 'CLOSED',
          applies_to: 'ALL',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institute-settings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setHasUnsavedOpChanges(false);
      setOperationsOpen(false);
      setConfirmCloseOpen(false);
      toast({
        title: 'Operations Updated',
        description: `Institute is now marked ${isCoachingOpen ? 'OPEN' : 'CLOSED'}. ERP Messaging: ${erpMessagingEnabled ? 'Enabled' : 'Disabled'}.`,
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err?.response?.data?.detail || 'Could not update operating settings.',
      });
    },
  });

  const handleApplyOperations = () => {
    if (!isCoachingOpen && !closureReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide an explanatory reason for marking the coaching centre CLOSED.',
      });
      return;
    }

    if (!isCoachingOpen) {
      setConfirmCloseOpen(true);
    } else {
      applyOperationsMutation.mutate();
    }
  };

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      toast({ variant: 'destructive', title: 'Logout failed', description: 'Please try again.' });
    } finally {
      setLoggingOut(false);
    }
  }

  // Pre-configured system notices
  const systemNotices = [
    {
      id: '1',
      title: 'Upcoming Term Assessment Scheduled',
      message: 'Class 10 and Class 12 unit tests begin next Monday. Hall arrangements published.',
      date: 'Oct 14, 2026',
      status: 'PUBLISHED',
      target: 'All Students & Staff',
    },
    {
      id: '2',
      title: 'Automated Attendance Cutoff Rule Active',
      message: 'Daily cutoff is set to 09:30 AM. Biometric punches after cutoff are logged as LATE.',
      date: 'Oct 12, 2026',
      status: 'PUBLISHED',
      target: 'Faculty Members',
    },
    {
      id: '3',
      title: 'Diwali Break Notice (Preliminary)',
      message: 'Coaching centre holiday calendar updated for the upcoming festival break.',
      date: 'Oct 10, 2026',
      status: 'DRAFT',
      target: 'Coaching Wide',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center px-4 gap-3">
        {/* Mobile menu toggle */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-accent transition-colors"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar toggle */}
        <button
          className="hidden lg:flex p-2 rounded-md hover:bg-accent transition-colors"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Phase 12: Institute Daily Operating State Control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOperationsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-accent/70 transition-all text-xs font-medium shadow-2xs"
            title="Configure Daily Coaching Operating State & ERP Messaging"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCoachingOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-foreground font-semibold">
                Coaching: {isCoachingOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>

            <span className="text-border">|</span>

            <div className="flex items-center gap-1 text-muted-foreground hidden sm:flex">
              <Radio
                className={`h-3 w-3 ${
                  erpMessagingEnabled ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span>ERP: {erpMessagingEnabled ? 'Active' : 'Off'}</span>
            </div>

            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Phase 3 & 10: Student Registration Approvals Badge */}
          <button
            onClick={() => setApprovalsOpen(true)}
            className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border hover:bg-accent transition-colors text-xs font-medium"
            title="Student Registration Approvals"
          >
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="hidden md:inline">Approvals</span>
            {pendingRegistrations.length > 0 ? (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold">
                {pendingRegistrations.length}
              </Badge>
            ) : (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                0
              </Badge>
            )}
          </button>

          {/* Phase 3: Notices & Announcements Button */}
          <button
            onClick={() => setNoticesOpen(true)}
            className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="Coaching Notices & Announcements"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-accent transition-colors"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              id="user-menu-button"
            >
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                {user ? getInitials(user.full_name) : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium leading-none">{user?.full_name ?? 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{user?.role ?? 'admin'}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>

            {/* Dropdown */}
            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border bg-popover shadow-lg z-20 py-1">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {user?.role ?? 'ADMIN'}
                    </Badge>
                  </div>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {loggingOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* PHASE 12: Institute Operations & ERP Messaging Modal */}
      <Dialog open={operationsOpen} onOpenChange={setOperationsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Daily Institute Operations
            </DialogTitle>
            <DialogDescription>
              Configure the centre's live operating state, working hours, and automated ERP alerts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Coaching Open / Closed */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Institute Operations</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCoachingOpen(true);
                    setHasUnsavedOpChanges(true);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    isCoachingOpen
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Coaching Open
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCoachingOpen(false);
                    setHasUnsavedOpChanges(true);
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    !isCoachingOpen
                      ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 ring-2 ring-rose-500/20'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Coaching Closed
                </button>
              </div>
            </div>

            {/* ERP Messaging Enabled / Disabled */}
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-semibold">ERP Automated Messaging</Label>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {erpMessagingEnabled ? 'Messaging Enabled' : 'Messaging Disabled'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Attendance notices and result notifications dispatched to guardians.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id={erpMessagingSwitchId}
                    type="checkbox"
                    checked={erpMessagingEnabled}
                    onChange={(e) => {
                      setErpMessagingEnabled(e.target.checked);
                      setHasUnsavedOpChanges(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>

            {/* Time Window */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Start / Cutoff Time</Label>
                <Input
                  value={cutoffTime}
                  onChange={(e) => {
                    setCutoffTime(e.target.value);
                    setHasUnsavedOpChanges(true);
                  }}
                  placeholder="09:30:00"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Required Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={requiredHours}
                  onChange={(e) => {
                    setRequiredHours(e.target.value);
                    setHasUnsavedOpChanges(true);
                  }}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Reason if Closed */}
            {!isCoachingOpen && (
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Closure Reason (Added to Academic Calendar) *
                </Label>
                <Input
                  placeholder="e.g. Severe Weather / Gazetted Holiday"
                  value={closureReason}
                  onChange={(e) => {
                    setClosureReason(e.target.value);
                    setHasUnsavedOpChanges(true);
                  }}
                  className="border-rose-300 focus:border-rose-500"
                />
                <p className="text-[11px] text-muted-foreground">
                  Creates an official calendar entry marking classes suspended for today.
                </p>
              </div>
            )}

            {hasUnsavedOpChanges && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> You have unsaved changes.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOperationsOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyOperations}
              disabled={applyOperationsMutation.isPending}
            >
              {applyOperationsMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Marking Closed */}
      <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Institute Closure
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to mark the coaching centre CLOSED for today? This will record
              the closure on the academic calendar: <strong>"{closureReason}"</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmCloseOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => applyOperationsMutation.mutate()}
              disabled={applyOperationsMutation.isPending}
            >
              {applyOperationsMutation.isPending ? 'Updating...' : 'Confirm & Close Centre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 3: Notices & Announcements Modal */}
      <Dialog open={noticesOpen} onOpenChange={setNoticesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Coaching Notices & Announcements
            </DialogTitle>
            <DialogDescription>
              Active broadcasts, scheduled student notifications, and coaching alerts.
            </DialogDescription>
          </DialogHeader>

          {/* Backend API Notice */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-900 p-3 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold">Notice Management Integration</p>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80">
                Notice creation endpoint (<code className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1 py-0.2 rounded">/api/v1/admin/notices</code>) is pending backend deployment. Below notices reflect currently active coaching bulletins.
              </p>
            </div>
          </div>

          <div className="space-y-3 py-1 max-h-[360px] overflow-y-auto">
            {systemNotices.map((notice) => (
              <div key={notice.id} className="p-3 rounded-lg border bg-card space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-foreground">{notice.title}</h4>
                  <Badge
                    variant={notice.status === 'PUBLISHED' ? 'success' : 'outline'}
                    className="text-[10px] h-4.5"
                  >
                    {notice.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{notice.message}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                  <span>Target: {notice.target}</span>
                  <span>{notice.date}</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNoticesOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 3A: Student Registration Approvals Modal */}
      <Dialog open={approvalsOpen} onOpenChange={setApprovalsOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Student Registration Approvals ({pendingRegistrations.length})
            </DialogTitle>
            <DialogDescription>
              Review pending registrations submitted by students awaiting account verification and administrative approval.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <RegistrationApprovalsList onSuccessDecision={() => {}} />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApprovalsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Calendar,
  School,
  ShieldCheck,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from '@/hooks/use-toast';
import { registrationApprovalsApi } from './registration-approvals.api';
import type { PendingRegistration } from '@/types';

interface RegistrationApprovalsListProps {
  onSuccessDecision?: () => void;
}

export function RegistrationApprovalsList({
  onSuccessDecision,
}: RegistrationApprovalsListProps) {
  const queryClient = useQueryClient();

  // Dialog state for Approval
  const [approvingTarget, setApprovingTarget] = useState<PendingRegistration | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  // Dialog state for Rejection
  const [rejectingTarget, setRejectingTarget] = useState<PendingRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Active mutation tracking to prevent duplicate submissions
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null);

  // Fetch pending registrations
  const {
    data: pendingList = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<PendingRegistration[]>({
    queryKey: ['pending-registrations'],
    queryFn: () => registrationApprovalsApi.getPendingRegistrations({ limit: 100 }),
    refetchInterval: 30000,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ userId, remarks }: { userId: string; remarks?: string }) => {
      setSubmittingUserId(userId);
      return registrationApprovalsApi.approveRegistration(userId, { remarks });
    },
    onSuccess: (data, variables) => {
      // Invalidate queries so lists refresh accurately from server
      queryClient.invalidateQueries({ queryKey: ['pending-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      queryClient.invalidateQueries({ queryKey: ['students-approvals-check'] });

      toast({
        title: 'Registration Approved',
        description: `Student ${data.name || variables.userId} has been approved and activated.`,
      });

      setApprovingTarget(null);
      setApprovalRemarks('');
      onSuccessDecision?.();
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to approve registration. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: typeof message === 'string' ? message : 'Operation could not be completed.',
      });
    },
    onSettled: () => {
      setSubmittingUserId(null);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      setSubmittingUserId(userId);
      return registrationApprovalsApi.rejectRegistration(userId, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      queryClient.invalidateQueries({ queryKey: ['students-approvals-check'] });

      toast({
        title: 'Registration Rejected',
        description: `Registration for applicant has been rejected. Notification sent.`,
      });

      setRejectingTarget(null);
      setRejectionReason('');
      setRejectionError(null);
      onSuccessDecision?.();
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'Failed to reject registration. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Rejection Failed',
        description: typeof message === 'string' ? message : 'Operation could not be completed.',
      });
    },
    onSettled: () => {
      setSubmittingUserId(null);
    },
  });

  // Submission handlers
  const handleConfirmApprove = () => {
    if (!approvingTarget) return;
    if (approveMutation.isPending || submittingUserId) return; // Prevent duplicate submission

    approveMutation.mutate({
      userId: approvingTarget.user_id,
      remarks: approvalRemarks.trim() || undefined,
    });
  };

  const handleConfirmReject = () => {
    if (!rejectingTarget) return;
    if (rejectMutation.isPending || submittingUserId) return; // Prevent duplicate submission

    const trimmed = rejectionReason.trim();
    if (!trimmed) {
      setRejectionError('A rejection reason is required for applicant notification.');
      return;
    }
    if (trimmed.length > 255) {
      setRejectionError('Rejection reason cannot exceed 255 characters.');
      return;
    }

    setRejectionError(null);
    rejectMutation.mutate({
      userId: rejectingTarget.user_id,
      reason: trimmed,
    });
  };

  const isActionInProgress = approveMutation.isPending || rejectMutation.isPending || submittingUserId !== null;

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">Loading pending registrations...</p>
        <p className="text-xs text-muted-foreground">Checking backend approval queue</p>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    const errorMsg =
      (error as any)?.response?.data?.detail ||
      (error as any)?.message ||
      'Failed to load pending registrations from server.';
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <div className="rounded-full bg-destructive/10 p-4 mb-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Unable to Load Registrations
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mb-4">{errorMsg}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Retry Connection
        </Button>
      </div>
    );
  }

  // 3. Empty State
  if (pendingList.length === 0) {
    return (
      <EmptyState
        title="No Pending Registrations"
        description="All applicant registrations have been reviewed. New student applications will appear here."
        icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-2 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        }
      />
    );
  }

  // 4. Content State (Table of pending registrations)
  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold text-xs">Applicant</TableHead>
                <TableHead className="font-semibold text-xs">Contact</TableHead>
                <TableHead className="font-semibold text-xs">Class &amp; Batch</TableHead>
                <TableHead className="font-semibold text-xs">Email Verified</TableHead>
                <TableHead className="font-semibold text-xs">Registration Date</TableHead>
                <TableHead className="font-semibold text-xs text-right">Decisions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingList.map((reg) => {
                const isTargetSubmitting = submittingUserId === reg.user_id;

                return (
                  <TableRow
                    key={reg.user_id}
                    className="hover:bg-muted/30 transition-colors text-xs"
                  >
                    {/* Applicant details */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{reg.name}</span>
                          {reg.student_code && (
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border">
                              {reg.student_code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[200px]" title={reg.email}>
                            {reg.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Phone */}
                    <TableCell>
                      {reg.phone ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{reg.phone}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-[11px]">Not provided</span>
                      )}
                    </TableCell>

                    {/* Class & Batch */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-foreground font-medium">
                          <School className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{reg.class_name || 'No Class Assigned'}</span>
                        </div>
                        {reg.batch_name ? (
                          <p className="text-[11px] text-muted-foreground pl-4">
                            Batch: {reg.batch_name}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>

                    {/* Email Verification Status */}
                    <TableCell>
                      {reg.email_verified ? (
                        <Badge
                          variant="success"
                          className="text-[10px] h-5 gap-1 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        >
                          <Check className="h-2.5 w-2.5" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="warning"
                          className="text-[10px] h-5 gap-1 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          Pending Email
                        </Badge>
                      )}
                    </TableCell>

                    {/* Registration Date */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{reg.created_at || '—'}</span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approve Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 gap-1"
                          onClick={() => {
                            setApprovingTarget(reg);
                            setApprovalRemarks('');
                          }}
                          disabled={isActionInProgress}
                          aria-label={`Approve ${reg.name}`}
                        >
                          {isTargetSubmitting && approveMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          <span>Approve</span>
                        </Button>

                        {/* Reject Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-1"
                          onClick={() => {
                            setRejectingTarget(reg);
                            setRejectionReason('');
                            setRejectionError(null);
                          }}
                          disabled={isActionInProgress}
                          aria-label={`Reject ${reg.name}`}
                        >
                          {isTargetSubmitting && rejectMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          <span>Reject</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Confirmation Dialog: APPROVE */}
      <Dialog
        open={Boolean(approvingTarget)}
        onOpenChange={(open) => {
          if (!open && !approveMutation.isPending) {
            setApprovingTarget(null);
            setApprovalRemarks('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Confirm Registration Approval
            </DialogTitle>
            <DialogDescription>
              This will activate the student account, enable access, and send a welcome confirmation email.
            </DialogDescription>
          </DialogHeader>

          {approvingTarget && (
            <div className="space-y-4 py-2">
              {/* Applicant Card Summary */}
              <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Applicant Name:</span>
                  <span className="font-semibold text-foreground">{approvingTarget.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">{approvingTarget.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Class / Batch:</span>
                  <span className="text-foreground">
                    {approvingTarget.class_name || 'N/A'}{' '}
                    {approvingTarget.batch_name ? `(${approvingTarget.batch_name})` : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email Status:</span>
                  <Badge
                    variant={approvingTarget.email_verified ? 'success' : 'warning'}
                    className="text-[10px] h-4.5"
                  >
                    {approvingTarget.email_verified ? 'Verified' : 'Unverified Email'}
                  </Badge>
                </div>
              </div>

              {/* Optional Remarks Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="approval-remarks" className="text-xs">
                    Administrative Remarks <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {approvalRemarks.length}/255
                  </span>
                </div>
                <Textarea
                  id="approval-remarks"
                  placeholder="e.g. Identity and fee documents verified on-site."
                  value={approvalRemarks}
                  maxLength={255}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  className="text-xs min-h-[70px] resize-none"
                  disabled={approveMutation.isPending}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApprovingTarget(null)}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleConfirmApprove}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve &amp; Activate</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: REJECT */}
      <Dialog
        open={Boolean(rejectingTarget)}
        onOpenChange={(open) => {
          if (!open && !rejectMutation.isPending) {
            setRejectingTarget(null);
            setRejectionReason('');
            setRejectionError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Reject Registration
            </DialogTitle>
            <DialogDescription>
              Please state the reason for rejection. This explanation will be included in the notification email sent to the applicant.
            </DialogDescription>
          </DialogHeader>

          {rejectingTarget && (
            <div className="space-y-4 py-2">
              {/* Applicant Card Summary */}
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Applicant:</span>
                  <span className="font-semibold text-foreground">{rejectingTarget.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-mono text-foreground">{rejectingTarget.email}</span>
                </div>
              </div>

              {/* Required Reason Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="rejection-reason" className="text-xs font-semibold text-foreground">
                    Reason for Rejection <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {rejectionReason.length}/255
                  </span>
                </div>
                <Textarea
                  id="rejection-reason"
                  placeholder="e.g. Incomplete application details or duplicate enrollment."
                  value={rejectionReason}
                  maxLength={255}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError(null);
                  }}
                  className={`text-xs min-h-[80px] resize-none ${
                    rejectionError ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  disabled={rejectMutation.isPending}
                />
                {rejectionError ? (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {rejectionError}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Minimum 1 character, maximum 255 characters required by backend.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectingTarget(null)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="gap-1.5"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5" />
                  <span>Confirm Rejection</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { RegistrationApprovalsList } from './RegistrationApprovalsList';

export default function RegistrationApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Registration Approvals"
        description="Review and process student self-registration requests awaiting administrator approval."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Students', href: '/students' },
          { label: 'Registration Approvals' },
        ]}
      />

      {/* Architecture note banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-foreground">
            Student Lifecycle &amp; Verification Policy
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Applicants must complete token-based email verification before or during administrative review.
            Approving an application activates the user account, confirms classroom enrollment, and dispatches
            onboarding credentials to the student. Rejection notifies the applicant with the specified reason.
          </p>
        </div>
      </div>

      {/* Main Approvals Interface */}
      <RegistrationApprovalsList />
    </div>
  );
}

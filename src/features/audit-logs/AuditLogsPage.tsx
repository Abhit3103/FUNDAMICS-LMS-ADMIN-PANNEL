import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search, Loader2, Clock } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { auditApi } from './audit.api';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types';

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getLogs(),
  });

  const filteredLogs = (Array.isArray(logs) ? logs : []).filter((log: AuditLog) =>
    (log.actor_email && log.actor_email.toLowerCase().includes(search.toLowerCase())) ||
    (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
    (log.entity_type && log.entity_type.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & System Audit Logs"
        description="Immutable record of administrative actions, attendance commits, user credential mutations, and API requests."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Audit Logs' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by admin, action, or entity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground self-start sm:self-auto">
          Total: <span className="font-semibold text-foreground">{logs.length}</span> recorded events
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading audit records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-10 w-10 text-muted-foreground" />}
            title="No audit entries found"
            message={
              search
                ? `No event logs matching "${search}".`
                : 'Administrative transactions will appear here as users perform operations.'
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor / User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Reference ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log: AuditLog) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground">
                    {log.actor_email || log.actor_id || 'System'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.entity_type}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.entity_id || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

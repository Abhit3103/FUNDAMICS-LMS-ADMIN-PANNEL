import { Construction } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="rounded-full bg-yellow-50 p-6 mb-6">
        <Construction className="h-12 w-12 text-yellow-600" />
      </div>
      <Badge variant="warning" className="mb-4">Coming Soon</Badge>
      <h2 className="text-2xl font-bold text-foreground mb-3">Module Under Construction</h2>
      <p className="text-muted-foreground max-w-md">
        This module is being implemented. The backend API integration for this feature is either
        pending verification or not yet available in the deployed backend.
      </p>
      <p className="text-xs text-muted-foreground mt-4">
        See <code className="font-mono bg-muted px-1 rounded">docs/API_INTEGRATION_MATRIX.md</code> for integration status.
      </p>
    </div>
  );
}

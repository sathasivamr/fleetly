import { Link } from 'react-router-dom';
import { User, Mail, Shield, Settings2, Server } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/SessionContext';
import { usePermissions } from '@/hooks/usePermissions';

export default function AccountPage() {
  const { user, server } = useSession();
  const { administrator } = usePermissions();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Account"
        description="Your profile and shortcuts to Traccar settings."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Signed in as {user?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </div>
              <div className="mt-1 text-sm font-medium">{user?.name || '—'}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                {user?.email || '—'}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 sm:col-span-2">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Access
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {user?.administrator ? (
                  <span className="font-medium">Administrator</span>
                ) : (
                  <span className="font-medium">Standard user</span>
                )}
                {user?.readonly && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs">Read-only</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="default">
              <Link to="/settings/preferences">
                <Settings2 className="mr-2 h-4 w-4" />
                Preferences & attributes
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/settings">All settings</Link>
            </Button>
            {administrator && (
              <Button asChild variant="outline">
                <Link to="/settings/server">
                  <Server className="mr-2 h-4 w-4" />
                  Server
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Server</CardTitle>
          <CardDescription>Connected Traccar backend</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Version {server?.version || '—'}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect, useTransition } from 'react';
import { getAllUsers, grantPremiumAction, revokePremiumAction } from '@/lib/actions/users';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconCrown, IconCrownOff } from '@tabler/icons-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  subscriptionStatus: 'FREE' | 'PREMIUM';
  subscriptionEndDate: Date | null;
  createdAt: Date;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data as User[]);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrantPremium = (userId: string) => {
    setPendingUserId(userId);
    startTransition(async () => {
      const result = await grantPremiumAction(userId);
      if (result.success) {
        await loadUsers();
      } else {
        alert(result.error || 'Failed to grant premium');
      }
      setPendingUserId(null);
    });
  };

  const handleRevokePremium = (userId: string) => {
    if (!confirm('Are you sure you want to revoke premium from this user?')) {
      return;
    }
    setPendingUserId(userId);
    startTransition(async () => {
      const result = await revokePremiumAction(userId);
      if (result.success) {
        await loadUsers();
      } else {
        alert(result.error || 'Failed to revoke premium');
      }
      setPendingUserId(null);
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <>
        <div className="py-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="py-4">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">Manage user subscriptions and premium access</p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.subscriptionStatus === 'PREMIUM' ? (
                      <Badge className="bg-amber-500 hover:bg-amber-600">
                        <IconCrown className="h-3 w-3 mr-1" />
                        PREMIUM
                      </Badge>
                    ) : (
                      <Badge variant="secondary">FREE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.subscriptionStatus === 'PREMIUM' ? formatDate(user.subscriptionEndDate) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.subscriptionStatus === 'FREE' ? (
                      <Button
                        size="sm"
                        onClick={() => handleGrantPremium(user.id)}
                        disabled={isPending && pendingUserId === user.id}
                      >
                        <IconCrown className="h-4 w-4 mr-1" />
                        {isPending && pendingUserId === user.id ? 'Granting...' : 'Grant Pro'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRevokePremium(user.id)}
                        disabled={isPending && pendingUserId === user.id}
                      >
                        <IconCrownOff className="h-4 w-4 mr-1" />
                        {isPending && pendingUserId === user.id ? 'Revoking...' : 'Revoke'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

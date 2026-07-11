import React from 'react';
import { Bell, Users } from 'lucide-react';
import { useBilling } from '@/context/BillingContext';
import { firestoreService } from '@/lib/firestoreService';
import { getBillingStatus } from '@/lib/billingUtils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

export function BulkNotifyMenu() {
    const { allTenants, user } = useBilling();

    const activeTenantsList = (allTenants || []).filter(t => t.status === 'active' || !t.status);
    
    const activeWithStatus = activeTenantsList.map(tenant => ({
        ...tenant,
        ...getBillingStatus(tenant.joiningDate, tenant.paymentHistory)
    }));

    const unpaidTenants = activeWithStatus.filter(t => t.status === 'OVERDUE' || t.status === 'DUE_SOON');
    const unpaidCount = unpaidTenants.length;
    const totalActiveCount = activeTenantsList.length;

    const handleNotifyUnpaid = () => {
        if (unpaidCount === 0) {
            toast.info("All tenants have paid their rent! If you want to notify everyone anyway, use 'Notify All Active Tenants'.");
            return;
        }

        let isUndone = false;
        toast(`Sending push notifications to ${unpaidCount} unpaid tenant(s)...`, {
            duration: 10000,
            action: {
                label: 'Undo',
                onClick: () => {
                    isUndone = true;
                    toast.info("Bulk notifications cancelled.");
                }
            },
            onAutoClose: () => {
                if (!isUndone) {
                    unpaidTenants.forEach(tenant => {
                        const total = (tenant.monthlyRent || 0) + (tenant.waterBill || 0) + (tenant.electricityCharges || 0) + (tenant.extraCharges || 0);
                        const msg = `Your rent bill has been generated/updated. Total Due: ₹${total.toLocaleString()}`;
                        firestoreService.requestPushNotification(tenant.id, user?.uid || '', msg);
                    });
                    toast.success(`Notifications pushed to ${unpaidCount} tenant(s)!`);
                }
            }
        });
    };

    const handleNotifyAll = () => {
        if (totalActiveCount === 0) {
            toast.info("You don't have any active tenants to notify.");
            return;
        }

        let isUndone = false;
        toast(`Sending push notifications to all ${totalActiveCount} active tenant(s)...`, {
            duration: 10000,
            action: {
                label: 'Undo',
                onClick: () => {
                    isUndone = true;
                    toast.info("Broadcast notifications cancelled.");
                }
            },
            onAutoClose: () => {
                if (!isUndone) {
                    activeWithStatus.forEach(tenant => {
                        const total = (tenant.monthlyRent || 0) + (tenant.waterBill || 0) + (tenant.electricityCharges || 0) + (tenant.extraCharges || 0);
                        const msg = `Your rent bill details are available. Total Outstanding: ₹${total.toLocaleString()}`;
                        firestoreService.requestPushNotification(tenant.id, user?.uid || '', msg);
                    });
                    toast.success(`Announcements pushed to all ${totalActiveCount} tenant(s)!`);
                }
            }
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-muted/50 hover:bg-muted transition-colors relative">
                    <Bell className="h-5 w-5" />
                    {unpaidCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                            {unpaidCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-border shadow-lg p-2">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/50 pb-1">
                    Notifications
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                
                {/* Option 1: Unpaid Only */}
                <DropdownMenuItem
                    onClick={handleNotifyUnpaid}
                    className="flex flex-col items-start gap-1 cursor-pointer rounded-lg p-2.5 focus:bg-primary/5"
                >
                    <div className="flex items-center gap-2 font-semibold">
                        <Bell className="h-4 w-4 text-primary" />
                        <span>Notify Unpaid Tenants ({unpaidCount})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Pushes alerts to tenants with due/overdue status.
                    </span>
                </DropdownMenuItem>

                {/* Option 2: Broadcast to Everyone */}
                <DropdownMenuItem
                    onClick={handleNotifyAll}
                    className="flex flex-col items-start gap-1 cursor-pointer rounded-lg p-2.5 focus:bg-primary/5 mt-1"
                >
                    <div className="flex items-center gap-2 font-semibold">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <span>Notify All Active Tenants ({totalActiveCount})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Broadcasts rent overview alert to all active tenants.
                    </span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

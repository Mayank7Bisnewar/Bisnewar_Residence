import { PaymentRecord } from '@/types/tenant';

export type DueStatus = 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'NONE';

export function getBillingStatus(joiningDateStr?: string, paymentHistory?: PaymentRecord[]): { status: DueStatus; dueDate: Date | null } {
  if (!joiningDateStr) return { status: 'NONE', dueDate: null };

  const joiningDate = new Date(joiningDateStr);
  if (isNaN(joiningDate.getTime())) return { status: 'NONE', dueDate: null };

  const today = new Date();
  const targetDay = joiningDate.getDate();

  // Find the most recent occurrence of the billing day
  let lastDueDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
  if (today.getTime() < lastDueDate.getTime()) {
    lastDueDate.setMonth(lastDueDate.getMonth() - 1);
  }
  
  // Find the next occurrence
  let nextDueDate = new Date(lastDueDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  // If the joining date is exactly today or in the future, the next due date is 1 month from joining
  if (joiningDate.getTime() >= today.getTime()) {
    let initialDue = new Date(joiningDate);
    initialDue.setMonth(initialDue.getMonth() + 1);
    
    const diffDays = Math.ceil((initialDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return { status: 'DUE_SOON', dueDate: initialDue };
    return { status: 'UPCOMING', dueDate: initialDue };
  }

  let hasPaidCurrentCycle = false;
  if (paymentHistory && paymentHistory.length > 0) {
      const sortedPayments = [...paymentHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestPaymentDate = new Date(sortedPayments[0].date);
      
      const bufferDate = new Date(lastDueDate);
      bufferDate.setDate(bufferDate.getDate() - 5); // 5 days early payment buffer
      
      if (latestPaymentDate.getTime() >= bufferDate.getTime()) {
          hasPaidCurrentCycle = true;
      }
  }

  // If no payment history exists, but they joined recently (within last 30 days), assume they paid at joining
  if (!hasPaidCurrentCycle && paymentHistory?.length === 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (joiningDate.getTime() > thirtyDaysAgo.getTime()) {
          hasPaidCurrentCycle = true; // Still on their first month
      }
  }

  if (!hasPaidCurrentCycle) {
      const gracePeriodEnd = new Date(lastDueDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 day grace period
      
      if (today.getTime() > gracePeriodEnd.getTime()) {
          return { status: 'OVERDUE', dueDate: lastDueDate };
      } else {
          return { status: 'DUE_SOON', dueDate: lastDueDate };
      }
  } else {
      const diffTime = nextDueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3) {
          return { status: 'DUE_SOON', dueDate: nextDueDate };
      } else {
          return { status: 'UPCOMING', dueDate: nextDueDate };
      }
  }
}

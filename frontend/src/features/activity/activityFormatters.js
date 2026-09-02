const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  rescheduleProposed: 'New time proposed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
  approved: 'Approved',
  expired: 'Expired',
  active: 'Active stay',
  unpaid: 'Payment pending',
  receiptUploaded: 'Receipt under review',
  verified: 'Payment verified',
  draft: 'Draft',
  pendingReview: 'Pending review',
  published: 'Published',
  unavailable: 'Unavailable',
  rented: 'Rented',
  sold: 'Sold',
  archived: 'Archived',
}

export const formatStatus = (status) => statusLabels[status] || status || 'Unknown'

export const getStatusTone = (status) => {
  if (
    ['confirmed', 'completed', 'verified', 'active', 'published'].includes(
      status,
    )
  ) {
    return 'bg-emerald-100 text-emerald-800'
  }

  if (
    ['rejected', 'cancelled', 'expired', 'archived', 'sold', 'rented'].includes(
      status,
    )
  ) {
    return 'bg-red-50 text-red-700'
  }

  if (
    [
      'approved',
      'rescheduleProposed',
      'receiptUploaded',
      'pendingReview',
      'unavailable',
    ].includes(status)
  ) {
    return 'bg-amber-100 text-amber-800'
  }

  return 'bg-stone-100 text-stone-700'
}

export const formatDateTime = (value) => {
  if (!value) return 'Not scheduled'

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export const formatDate = (value) => {
  if (!value) return 'Not available'

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export const formatMoney = (amount, currency = 'NGN') =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount || 0))

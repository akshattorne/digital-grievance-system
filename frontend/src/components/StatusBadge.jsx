import React from 'react';

export const StatusBadge = ({ status }) => {
  const statusMap = {
    SUBMITTED: { label: 'Submitted', className: 'badge-submitted' },
    RECEIVED: { label: 'Received', className: 'badge-received' },
    ASSIGNED: { label: 'Assigned', className: 'badge-assigned' },
    IN_PROGRESS: { label: 'In Progress', className: 'badge-in-progress' },
    ON_HOLD: { label: 'On Hold', className: 'badge-on-hold' },
    RESOLVED: { label: 'Resolved', className: 'badge-resolved' },
    CLOSED: { label: 'Closed', className: 'badge-closed' },
    REJECTED: { label: 'Rejected', className: 'badge-rejected' },
    REOPENED: { label: 'Reopened', className: 'badge-reopened' },
  };

  const conf = statusMap[status] || { label: status, className: 'badge-closed' };

  return (
    <span className={`badge ${conf.className}`}>
      {conf.label}
    </span>
  );
};

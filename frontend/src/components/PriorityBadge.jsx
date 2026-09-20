import React from 'react';

export const PriorityBadge = ({ priority }) => {
  const map = {
    LOW: { label: 'Low', className: 'badge-low' },
    MEDIUM: { label: 'Medium', className: 'badge-medium' },
    HIGH: { label: 'High Priority', className: 'badge-high' },
  };

  const conf = map[priority] || { label: priority, className: 'badge-medium' };

  return (
    <span className={`badge ${conf.className}`}>
      {conf.label}
    </span>
  );
};

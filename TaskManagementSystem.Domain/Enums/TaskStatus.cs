using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskManagementSystem.Domain.Enums
{
    public enum TaskStatus
    {
        Pending = 0,
        Accepted = 1,
        InProgress = 2,
        Completed = 3,
        Rejected = 4,
        Closed = 5,
        // NEW - Approval workflow statuses
        PendingApproval = 6,   // Waiting for approver
        Approved = 7,          // Approved by approver
        Published = 8          // Published by publisher
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskManagementSystem.Domain.Enums
{
    public enum UserRole
    {
        User = 0,
        Admin = 1,
        Approver = 2,    // NEW: Can approve completed tasks
        Publisher = 3    // NEW: Can publish approved tasks
    }
}
using System;

namespace TaskManagementSystem.Domain.Enums
{
    [Flags]  // Allows multiple roles
    public enum RoleType
    {
        User = 1,      // 2^0 - Can accept and complete tasks
        Approver = 2,  // 2^1 - Can approve or reject completed tasks
        Publisher = 4, // 2^2 - Can publish approved tasks
        Admin = 8      // 2^3 - Can assign tasks and manage everything
    }
}
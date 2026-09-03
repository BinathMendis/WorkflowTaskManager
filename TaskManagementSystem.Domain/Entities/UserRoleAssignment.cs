using System;
using TaskManagementSystem.Domain.Enums;

namespace TaskManagementSystem.Domain.Entities
{
    public class UserRoleAssignment
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserRole Role { get; set; }
        public DateTime AssignedAt { get; set; }
        public int AssignedBy { get; set; }

        // Navigation properties
        public virtual User? User { get; set; }
    }
}
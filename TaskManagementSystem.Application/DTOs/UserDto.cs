using System;
using System.Collections.Generic;

namespace TaskManagementSystem.Application.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new List<string>();  // ✅ FIXED: Added this
        public DateTime CreatedAt { get; set; }
    }

    // NEW: Role assignment DTO
    public class AssignRoleDto
    {
        public int UserId { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool Assign { get; set; } = true;
    }
}
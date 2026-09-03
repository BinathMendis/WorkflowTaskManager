using System;

namespace TaskManagementSystem.Domain.Entities
{
    public class ApprovalHistory
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string Action { get; set; } = string.Empty; // Approve, Reject, Publish
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual Task? Task { get; set; }
        public virtual User? User { get; set; }
    }
}
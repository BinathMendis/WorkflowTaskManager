using System;
using System.Collections.Generic;
using TaskManagementSystem.Domain.Enums;
using TaskStatus = TaskManagementSystem.Domain.Enums.TaskStatus;

namespace TaskManagementSystem.Domain.Entities
{
    public class Task
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public int AssignedUserId { get; set; }
        public int CreatedBy { get; set; }  // Who created the task (admin)
        public Platform Platform { get; set; }
        public TaskPriority Priority { get; set; }
        public TaskStatus Status { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // NEW: Approval workflow fields
        public int? ApprovedByUserId { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int? PublishedByUserId { get; set; }
        public DateTime? PublishedAt { get; set; }
        public string? ApprovalComment { get; set; }
        public string? RejectionReason { get; set; }

        // Navigation properties
        public virtual Company? Company { get; set; }
        public virtual User? AssignedUser { get; set; }
        public virtual User? Creator { get; set; }
        public virtual User? ApprovedByUser { get; set; }
        public virtual User? PublishedByUser { get; set; }
        public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public virtual ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    }
}
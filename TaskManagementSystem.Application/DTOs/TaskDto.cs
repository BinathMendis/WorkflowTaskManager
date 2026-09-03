using System;
using System.Collections.Generic;

namespace TaskManagementSystem.Application.DTOs
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public int AssignedUserId { get; set; }
        public string AssignedUserName { get; set; } = string.Empty;
        public int CreatedBy { get; set; }
        public string CreatedByUserName { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CommentsCount { get; set; }
        public int AttachmentsCount { get; set; }
        public List<CommentDto>? Comments { get; set; }

        // NEW: Approval fields
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByUserName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int? PublishedByUserId { get; set; }
        public string? PublishedByUserName { get; set; }
        public DateTime? PublishedAt { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int CompanyId { get; set; }
        public int AssignedUserId { get; set; }
        public string Platform { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public DateTime DueDate { get; set; }
    }

    public class UpdateTaskStatusDto
    {
        public string Status { get; set; } = string.Empty;
        public string? Comment { get; set; }
    }

    public class TaskFilterDto
    {
        public int? CompanyId { get; set; }
        public int? AssignedUserId { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
        public string? Status { get; set; }
        public string? Platform { get; set; }
        public string? Priority { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; }
        public bool SortDescending { get; set; } = false;
    }
}
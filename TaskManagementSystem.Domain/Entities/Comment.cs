using System;

namespace TaskManagementSystem.Domain.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string CommentText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual Task? Task { get; set; }
        public virtual User? User { get; set; }
    }
}
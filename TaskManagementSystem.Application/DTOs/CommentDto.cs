using System;

namespace TaskManagementSystem.Application.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string CommentText { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CreateCommentDto
    {
        public string CommentText { get; set; } = string.Empty;
    }
}
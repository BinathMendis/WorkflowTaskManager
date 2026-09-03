using System;

namespace TaskManagementSystem.Application.DTOs
{
    public class AttachmentDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string UploadedByUserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
    }
}

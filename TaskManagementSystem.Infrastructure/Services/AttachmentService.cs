using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Entities;
using TaskManagementSystem.Infrastructure.Data;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class AttachmentService : IAttachmentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly string _uploadPath;

        public AttachmentService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _uploadPath = configuration["FileStorage:UploadPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            
            if (!Directory.Exists(_uploadPath))
                Directory.CreateDirectory(_uploadPath);
        }

        public async Task<AttachmentDto> UploadAttachmentAsync(int taskId, int userId, byte[] fileContent, string fileName, string contentType)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                throw new Exception("Task not found");

            var maxFileSizeMB = int.Parse(_configuration["FileStorage:MaxFileSizeMB"] ?? "10");
            if (fileContent.Length > maxFileSizeMB * 1024 * 1024)
                throw new Exception($"File size cannot exceed {maxFileSizeMB} MB");

            var allowedExtensions = _configuration["FileStorage:AllowedExtensions"] ?? ".jpg,.jpeg,.png,.pdf,.doc,.docx";
            var fileExtension = Path.GetExtension(fileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
                throw new Exception($"File type not allowed. Allowed types: {allowedExtensions}");

            var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
            var filePath = Path.Combine(_uploadPath, uniqueFileName);

            await System.IO.File.WriteAllBytesAsync(filePath, fileContent);

            var attachment = new Attachment
            {
                TaskId = taskId,
                UploadedBy = userId,
                FileName = fileName,
                FilePath = uniqueFileName,
                FileType = contentType,
                FileSize = fileContent.Length,
                CreatedAt = DateTime.UtcNow
            };

            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();

            return await MapToDto(attachment);
        }

        public async Task<(byte[] FileContent, string ContentType, string FileName)> DownloadAttachmentAsync(int attachmentId)
        {
            var attachment = await _context.Attachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId);
            
            if (attachment == null)
                throw new Exception("Attachment not found");

            var filePath = Path.Combine(_uploadPath, attachment.FilePath);
            if (!System.IO.File.Exists(filePath))
                throw new Exception("File not found");

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return (fileBytes, attachment.FileType, attachment.FileName);
        }

        public async Task<IEnumerable<AttachmentDto>> GetTaskAttachmentsAsync(int taskId)
        {
            var attachments = await _context.Attachments
                .Include(a => a.User)
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            var dtos = new List<AttachmentDto>();
            foreach (var attachment in attachments)
            {
                dtos.Add(await MapToDto(attachment));
            }
            return dtos;
        }

        public async Task<bool> DeleteAttachmentAsync(int attachmentId, int userId, bool isAdmin)
        {
            var attachment = await _context.Attachments.FindAsync(attachmentId);
            if (attachment == null)
                return false;

            if (attachment.UploadedBy != userId && !isAdmin)
                return false;

            var filePath = Path.Combine(_uploadPath, attachment.FilePath);
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            _context.Attachments.Remove(attachment);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<AttachmentDto> MapToDto(Attachment attachment)
        {
            var user = await _context.Users.FindAsync(attachment.UploadedBy);
            return new AttachmentDto
            {
                Id = attachment.Id,
                TaskId = attachment.TaskId,
                FileName = attachment.FileName,
                FileType = attachment.FileType,
                FileSize = attachment.FileSize,
                UploadedByUserName = user?.Username ?? "Unknown",
                CreatedAt = attachment.CreatedAt,
                DownloadUrl = $"/api/tasks/{attachment.TaskId}/attachments/{attachment.Id}/download"
            };
        }
    }
}

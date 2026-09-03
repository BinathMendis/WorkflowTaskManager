using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface IAttachmentService
    {
        Task<AttachmentDto> UploadAttachmentAsync(int taskId, int userId, byte[] fileContent, string fileName, string contentType);
        Task<(byte[] FileContent, string ContentType, string FileName)> DownloadAttachmentAsync(int attachmentId);
        Task<IEnumerable<AttachmentDto>> GetTaskAttachmentsAsync(int taskId);
        Task<bool> DeleteAttachmentAsync(int attachmentId, int userId, bool isAdmin);
    }
}

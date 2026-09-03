using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface ICommentService
    {
        Task<CommentDto> AddCommentAsync(int taskId, int userId, CreateCommentDto createDto);
        Task<IEnumerable<CommentDto>> GetTaskCommentsAsync(int taskId);
        Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin);
    }
}
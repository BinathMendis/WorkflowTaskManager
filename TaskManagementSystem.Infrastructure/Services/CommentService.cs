using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Entities;
using TaskManagementSystem.Infrastructure.Data;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext _context;

        public CommentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CommentDto> AddCommentAsync(int taskId, int userId, CreateCommentDto createDto)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                throw new Exception("Task not found");

            var comment = new Comment
            {
                TaskId = taskId,
                UserId = userId,
                CommentText = createDto.CommentText,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return await MapToDto(comment);
        }

        public async Task<IEnumerable<CommentDto>> GetTaskCommentsAsync(int taskId)
        {
            var comments = await _context.Comments
                .Include(c => c.User)
                .Where(c => c.TaskId == taskId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return comments.Select(c => new CommentDto
            {
                Id = c.Id,
                TaskId = c.TaskId,
                UserId = c.UserId,
                UserName = c.User?.Username ?? "Unknown",
                CommentText = c.CommentText,
                CreatedAt = c.CreatedAt
            });
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin)
        {
            var comment = await _context.Comments.FindAsync(commentId);
            if (comment == null)
                return false;

            // Only comment owner or admin can delete
            if (comment.UserId != userId && !isAdmin)
                return false;

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<CommentDto> MapToDto(Comment comment)
        {
            var user = await _context.Users.FindAsync(comment.UserId);
            return new CommentDto
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                UserName = user?.Username ?? "Unknown",
                CommentText = comment.CommentText,
                CreatedAt = comment.CreatedAt
            };
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Entities;
using TaskManagementSystem.Domain.Enums;
using TaskManagementSystem.Infrastructure.Data;
using TaskStatus = TaskManagementSystem.Domain.Enums.TaskStatus;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class ApprovalService : IApprovalService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly IRoleManagementService _roleService;

        public ApprovalService(
            ApplicationDbContext context,
            INotificationService notificationService,
            IEmailService emailService,
            IRoleManagementService roleService)
        {
            _context = context;
            _notificationService = notificationService;
            _emailService = emailService;
            _roleService = roleService;
        }

        public async Task<TaskDto> ApproveTaskAsync(int taskId, int approverId, string? comment = null)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                throw new Exception("Task not found");

            // Check if user is Approver
            if (!await _roleService.HasRoleAsync(approverId, UserRole.Approver))
                throw new Exception("Only Approvers can approve tasks");

            // Check if task is completed and waiting for approval
            if (task.Status != TaskStatus.Completed)
                throw new Exception("Only completed tasks can be approved");

            // Add approval comment if provided
            if (!string.IsNullOrEmpty(comment))
            {
                var taskComment = new Comment
                {
                    TaskId = taskId,
                    UserId = approverId,
                    CommentText = $"APPROVED: {comment}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Comments.Add(taskComment);
            }

            // Add approval history
            var history = new ApprovalHistory
            {
                TaskId = taskId,
                UserId = approverId,
                Action = "Approve",
                Comment = comment,
                CreatedAt = DateTime.UtcNow
            };
            _context.ApprovalHistories.Add(history);

            // Update task
            task.Status = TaskStatus.Approved;
            task.ApprovedByUserId = approverId;
            task.ApprovedAt = DateTime.UtcNow;
            task.ApprovalComment = comment;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify all Publishers
            var publishers = await _roleService.GetUsersByRoleAsync(UserRole.Publisher);
            foreach (var publisher in publishers)
            {
                await _notificationService.CreateNotificationAsync(
                    publisher.Id,
                    "Task Ready for Publishing",
                    $"Task '{task.Title}' has been approved and is ready for publishing"
                );
            }

            // Notify the user who completed the task
            if (task.AssignedUser != null)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssignedUser.Id,
                    "Task Approved",
                    $"Your task '{task.Title}' has been approved by an approver!"
                );
            }

            return await MapToTaskDto(taskId);
        }

        public async Task<TaskDto> RejectTaskAsync(int taskId, int approverId, string rejectionReason)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                throw new Exception("Task not found");

            if (!await _roleService.HasRoleAsync(approverId, UserRole.Approver))
                throw new Exception("Only Approvers can reject tasks");

            if (task.Status != TaskStatus.Completed)
                throw new Exception("Only completed tasks can be rejected");

            // Add rejection comment
            var comment = new Comment
            {
                TaskId = taskId,
                UserId = approverId,
                CommentText = $"REJECTED: {rejectionReason}",
                CreatedAt = DateTime.UtcNow
            };
            _context.Comments.Add(comment);

            // Add rejection history
            var history = new ApprovalHistory
            {
                TaskId = taskId,
                UserId = approverId,
                Action = "Reject",
                Comment = rejectionReason,
                CreatedAt = DateTime.UtcNow
            };
            _context.ApprovalHistories.Add(history);

            // Update task - Send back to user for rework
            task.Status = TaskStatus.Rejected;
            task.RejectionReason = rejectionReason;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify assigned user about rejection
            if (task.AssignedUser != null)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssignedUser.Id,
                    "Task Rejected",
                    $"Your task '{task.Title}' was rejected. Reason: {rejectionReason}. Please rework and complete again."
                );
            }

            return await MapToTaskDto(taskId);
        }

        public async Task<TaskDto> PublishTaskAsync(int taskId, int publisherId, string? comment = null)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                throw new Exception("Task not found");

            if (!await _roleService.HasRoleAsync(publisherId, UserRole.Publisher))
                throw new Exception("Only Publishers can publish tasks");

            if (task.Status != TaskStatus.Approved)
                throw new Exception("Only approved tasks can be published");

            // Add publish comment if provided
            if (!string.IsNullOrEmpty(comment))
            {
                var taskComment = new Comment
                {
                    TaskId = taskId,
                    UserId = publisherId,
                    CommentText = $"PUBLISHED: {comment}",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Comments.Add(taskComment);
            }

            // Add publish history
            var history = new ApprovalHistory
            {
                TaskId = taskId,
                UserId = publisherId,
                Action = "Publish",
                Comment = comment,
                CreatedAt = DateTime.UtcNow
            };
            _context.ApprovalHistories.Add(history);

            // Update task
            task.Status = TaskStatus.Published;
            task.PublishedByUserId = publisherId;
            task.PublishedAt = DateTime.UtcNow;
            task.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify Admin (creator) that task is published
            if (task.Creator != null)
            {
                await _notificationService.CreateNotificationAsync(
                    task.Creator.Id,
                    "Task Published",
                    $"Task '{task.Title}' has been published. You can now close the task if completed."
                );
            }

            // Notify assigned user
            if (task.AssignedUser != null && task.AssignedUser.Id != task.Creator?.Id)
            {
                await _notificationService.CreateNotificationAsync(
                    task.AssignedUser.Id,
                    "Task Published",
                    $"Your task '{task.Title}' has been published!"
                );
            }

            return await MapToTaskDto(taskId);
        }

        public async Task<IEnumerable<TaskDto>> GetTasksPendingApprovalAsync()
        {
            var query = _context.Tasks
                .Where(t => t.Status == TaskStatus.Completed)
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)
                .OrderByDescending(t => t.UpdatedAt);

            var tasks = await query.ToListAsync();

            var taskDtos = new List<TaskDto>();
            foreach (var task in tasks)
            {
                taskDtos.Add(await MapToTaskDto(task.Id));
            }

            return taskDtos;
        }

        public async Task<IEnumerable<TaskDto>> GetTasksApprovedForPublishAsync()
        {
            var query = _context.Tasks
                .Where(t => t.Status == TaskStatus.Approved)
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)
                .OrderByDescending(t => t.ApprovedAt);

            var tasks = await query.ToListAsync();

            var taskDtos = new List<TaskDto>();
            foreach (var task in tasks)
            {
                taskDtos.Add(await MapToTaskDto(task.Id));
            }

            return taskDtos;
        }

        private async Task<TaskDto> MapToTaskDto(int taskId)
        {
            var task = await _context.Tasks
                .Include(t => t.Company)
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)
                .Include(t => t.ApprovedByUser)
                .Include(t => t.PublishedByUser)
                .Include(t => t.Comments)
                    .ThenInclude(c => c.User)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                throw new Exception("Task not found");

            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                CompanyId = task.CompanyId,
                CompanyName = task.Company?.Name ?? string.Empty,
                AssignedUserId = task.AssignedUserId,
                AssignedUserName = task.AssignedUser?.Username ?? string.Empty,
                CreatedBy = task.CreatedBy,
                CreatedByUserName = task.Creator?.Username ?? string.Empty,
                Platform = task.Platform.ToString(),
                Priority = task.Priority.ToString(),
                Status = task.Status.ToString(),
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                CommentsCount = task.Comments?.Count ?? 0,
                AttachmentsCount = 0,
                Comments = task.Comments?.OrderByDescending(c => c.CreatedAt).Select(c => new CommentDto
                {
                    Id = c.Id,
                    TaskId = c.TaskId,
                    UserId = c.UserId,
                    UserName = c.User?.Username ?? string.Empty,
                    CommentText = c.CommentText,
                    CreatedAt = c.CreatedAt
                }).ToList(),
                // Approval fields
                ApprovedByUserId = task.ApprovedByUserId,
                ApprovedByUserName = task.ApprovedByUser?.Username,
                ApprovedAt = task.ApprovedAt,
                PublishedByUserId = task.PublishedByUserId,
                PublishedByUserName = task.PublishedByUser?.Username,
                PublishedAt = task.PublishedAt,
                RejectionReason = task.RejectionReason
            };
        }
    }
}
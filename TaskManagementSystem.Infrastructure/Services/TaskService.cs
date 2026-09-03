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
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;

        public TaskService(ApplicationDbContext context, INotificationService notificationService, IEmailService emailService)
        {
            _context = context;
            _notificationService = notificationService;
            _emailService = emailService;
        }

        // UPDATED: Added createdBy parameter
        public async Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto, int createdBy)
        {
            // Validate company exists
            var company = await _context.Companies.FindAsync(createTaskDto.CompanyId);
            if (company == null)
                throw new Exception("Company not found");

            // Validate user exists
            var user = await _context.Users.FindAsync(createTaskDto.AssignedUserId);
            if (user == null)
                throw new Exception("Assigned user not found");

            // Get creator (admin)
            var creator = await _context.Users.FindAsync(createdBy);
            if (creator == null)
                throw new Exception("Creator not found");

            // Parse platform and priority
            if (!Enum.TryParse<Platform>(createTaskDto.Platform, true, out var platform))
                throw new Exception("Invalid platform. Valid values: Facebook, Instagram, TikTok, YouTube");

            if (!Enum.TryParse<TaskPriority>(createTaskDto.Priority, true, out var priority))
                throw new Exception("Invalid priority. Valid values: Low, Medium, High, Urgent");

            var task = new Domain.Entities.Task
            {
                Title = createTaskDto.Title,
                Description = createTaskDto.Description,
                CompanyId = createTaskDto.CompanyId,
                AssignedUserId = createTaskDto.AssignedUserId,
                CreatedBy = createdBy,  // NEW: Set the creator
                Platform = platform,
                Priority = priority,
                Status = TaskStatus.Pending,
                DueDate = createTaskDto.DueDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            // Send notification to assigned user
            await _notificationService.CreateNotificationAsync(
                createTaskDto.AssignedUserId,
                "New Task Assigned",
                $"You have been assigned a new task: {createTaskDto.Title}"
            );

            // Send email to assigned user
            if (!string.IsNullOrEmpty(user.Email))
            {
                await _emailService.SendTaskAssignmentEmailAsync(
                    user.Email,
                    user.Username,
                    createTaskDto.Title,
                    createTaskDto.DueDate
                );
            }

            return await GetTaskDto(task.Id);
        }

        public async Task<TaskDto> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusDto updateDto, int userId)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)  // NEW: Include creator
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
                throw new Exception("Task not found");

            if (!Enum.TryParse<TaskStatus>(updateDto.Status, true, out var newStatus))
                throw new Exception("Invalid status");

            var oldStatus = task.Status;
            task.Status = newStatus;
            task.UpdatedAt = DateTime.UtcNow;

            // Add comment if provided
            if (!string.IsNullOrEmpty(updateDto.Comment))
            {
                var comment = new Comment
                {
                    TaskId = taskId,
                    UserId = userId,
                    CommentText = updateDto.Comment,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Comments.Add(comment);
            }

            await _context.SaveChangesAsync();

            // Handle status change notifications based on your email flow
            var currentUser = await _context.Users.FindAsync(userId);

            if (newStatus == TaskStatus.Accepted && oldStatus != TaskStatus.Accepted)
            {
                // Send email to task creator (admin) ONLY
                if (task.Creator != null && !string.IsNullOrEmpty(task.Creator.Email))
                {
                    await _emailService.SendTaskAcceptedEmailAsync(
                        task.Creator.Email,
                        task.Creator.Username,
                        task.Title,
                        currentUser?.Username ?? "User"
                    );
                }
            }
            else if (newStatus == TaskStatus.Rejected && oldStatus != TaskStatus.Rejected)
            {
                // Send email to task creator (admin) ONLY with rejection reason
                if (task.Creator != null && !string.IsNullOrEmpty(task.Creator.Email))
                {
                    await _emailService.SendTaskRejectedEmailAsync(
                        task.Creator.Email,
                        task.Creator.Username,
                        task.Title,
                        currentUser?.Username ?? "User",
                        updateDto.Comment ?? "No reason provided"
                    );
                }
            }
            else if (newStatus == TaskStatus.Completed && oldStatus != TaskStatus.Completed)
            {
                // Send email to ALL admins
                var admins = await _context.Users.Where(u => u.Role == UserRole.Admin).ToListAsync();
                foreach (var admin in admins)
                {
                    if (!string.IsNullOrEmpty(admin.Email))
                    {
                        await _emailService.SendTaskCompletedEmailAsync(
                            admin.Email,
                            admin.Username,
                            task.Title,
                            currentUser?.Username ?? "User"
                        );
                    }
                }
            }

            return await GetTaskDto(taskId);
        }

        public async Task<TaskDto?> GetTaskByIdAsync(int taskId)
        {
            return await GetTaskDto(taskId);
        }

        public async Task<(IEnumerable<TaskDto> Tasks, int TotalCount, int TotalPages)> GetTasksAsync(TaskFilterDto filter)
        {
            var query = _context.Tasks
                .Include(t => t.Company)
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)  // NEW: Include creator
                .AsQueryable();

            // Apply filters
            if (filter.CompanyId.HasValue)
                query = query.Where(t => t.CompanyId == filter.CompanyId.Value);

            if (filter.AssignedUserId.HasValue)
                query = query.Where(t => t.AssignedUserId == filter.AssignedUserId.Value);

            if (filter.DueDateFrom.HasValue)
                query = query.Where(t => t.DueDate >= filter.DueDateFrom.Value);

            if (filter.DueDateTo.HasValue)
                query = query.Where(t => t.DueDate <= filter.DueDateTo.Value);

            if (!string.IsNullOrEmpty(filter.Status) && Enum.TryParse<TaskStatus>(filter.Status, true, out var status))
                query = query.Where(t => t.Status == status);

            if (!string.IsNullOrEmpty(filter.Platform) && Enum.TryParse<Platform>(filter.Platform, true, out var platform))
                query = query.Where(t => t.Platform == platform);

            if (!string.IsNullOrEmpty(filter.Priority) && Enum.TryParse<TaskPriority>(filter.Priority, true, out var priority))
                query = query.Where(t => t.Priority == priority);

            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "duedate" => filter.SortDescending ? query.OrderByDescending(t => t.DueDate) : query.OrderBy(t => t.DueDate),
                "priority" => filter.SortDescending ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
                "status" => filter.SortDescending ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
                _ => query.OrderByDescending(t => t.CreatedAt)
            };

            // Apply pagination
            var tasks = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            var taskDtos = new List<TaskDto>();
            foreach (var task in tasks)
            {
                taskDtos.Add(await GetTaskDto(task.Id));
            }

            var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);
            return (taskDtos, totalCount, totalPages);
        }

        public async Task<bool> DeleteTaskAsync(int taskId)
        {
            var task = await _context.Tasks.FindAsync(taskId);
            if (task == null)
                return false;

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<TaskDto>> GetMyTasksAsync(int userId)
        {
            var tasks = await _context.Tasks
                .Where(t => t.AssignedUserId == userId)
                .Include(t => t.Creator)  // NEW: Include creator
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var taskDtos = new List<TaskDto>();
            foreach (var task in tasks)
            {
                taskDtos.Add(await GetTaskDto(task.Id));
            }
            return taskDtos;
        }

        private async Task<TaskDto> GetTaskDto(int taskId)
        {
            var task = await _context.Tasks
                .Include(t => t.Company)
                .Include(t => t.AssignedUser)
                .Include(t => t.Creator)  // NEW: Include creator
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
                CreatedBy = task.CreatedBy,  // NEW: Map CreatedBy
                CreatedByUserName = task.Creator?.Username ?? string.Empty,  // NEW: Map creator username
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
                }).ToList()
            };
        }
    }
}
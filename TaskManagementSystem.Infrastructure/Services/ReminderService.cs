using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Enums;
using TaskManagementSystem.Infrastructure.Data;
using TaskStatus = TaskManagementSystem.Domain.Enums.TaskStatus;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class ReminderService : IReminderService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly ILogger<ReminderService> _logger;

        public ReminderService(
            ApplicationDbContext context,
            INotificationService notificationService,
            IEmailService emailService,
            ILogger<ReminderService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task SendDueDateRemindersAsync()
        {
            try
            {
                _logger.LogInformation("Starting due date reminder check at {Time}", DateTime.UtcNow);

                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                // Tasks due tomorrow
                var tasksDueTomorrow = await _context.Tasks
                    .Include(t => t.AssignedUser)
                    .Where(t => t.DueDate.Date == tomorrow &&
                                t.Status != TaskStatus.Completed &&
                                t.Status != TaskStatus.Closed)
                    .ToListAsync();

                foreach (var task in tasksDueTomorrow)
                {
                    // Null check for AssignedUser
                    if (task.AssignedUser == null)
                    {
                        _logger.LogWarning("Task {TaskId} has no assigned user, skipping reminder", task.Id);
                        continue;
                    }

                    await _notificationService.CreateNotificationAsync(
                        task.AssignedUserId,
                        "Task Due Tomorrow",
                        $"Task '{task.Title}' is due tomorrow"
                    );

                    // Null check for email before sending
                    if (!string.IsNullOrEmpty(task.AssignedUser.Email))
                    {
                        await _emailService.SendDueDateReminderEmailAsync(
                            task.AssignedUser.Email,
                            task.AssignedUser.Username ?? "User",
                            task.Title,
                            task.DueDate
                        );
                    }

                    _logger.LogInformation("Sent reminder for task {TaskId} due tomorrow", task.Id);
                }

                // Tasks due today
                var tasksDueToday = await _context.Tasks
                    .Include(t => t.AssignedUser)
                    .Where(t => t.DueDate.Date == today &&
                                t.Status != TaskStatus.Completed &&
                                t.Status != TaskStatus.Closed)
                    .ToListAsync();

                foreach (var task in tasksDueToday)
                {
                    // Null check for AssignedUser
                    if (task.AssignedUser == null)
                    {
                        _logger.LogWarning("Task {TaskId} has no assigned user, skipping urgent reminder", task.Id);
                        continue;
                    }

                    await _notificationService.CreateNotificationAsync(
                        task.AssignedUserId,
                        "Task Due Today - URGENT",
                        $"Task '{task.Title}' is due today! Please complete it ASAP."
                    );

                    // Null check for email before sending
                    if (!string.IsNullOrEmpty(task.AssignedUser.Email))
                    {
                        await _emailService.SendDueDateReminderEmailAsync(
                            task.AssignedUser.Email,
                            task.AssignedUser.Username ?? "User",
                            task.Title,
                            task.DueDate
                        );
                    }

                    _logger.LogInformation("Sent urgent reminder for task {TaskId} due today", task.Id);
                }

                _logger.LogInformation("Completed due date reminder check. Processed {Count} tasks",
                    tasksDueTomorrow.Count + tasksDueToday.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while sending due date reminders");
            }
        }

        public async Task SendOverdueNotificationsAsync()
        {
            try
            {
                _logger.LogInformation("Starting overdue tasks check at {Time}", DateTime.UtcNow);

                var today = DateTime.UtcNow.Date;

                var overdueTasks = await _context.Tasks
                    .Include(t => t.AssignedUser)
                    .Include(t => t.Company)
                    .Where(t => t.DueDate.Date < today &&
                                t.Status != TaskStatus.Completed &&
                                t.Status != TaskStatus.Closed)
                    .ToListAsync();

                foreach (var task in overdueTasks)
                {
                    // Null check for AssignedUser
                    if (task.AssignedUser == null)
                    {
                        _logger.LogWarning("Task {TaskId} has no assigned user, skipping overdue notification", task.Id);
                        continue;
                    }

                    // Notify assigned user
                    await _notificationService.CreateNotificationAsync(
                        task.AssignedUserId,
                        "Task Overdue",
                        $"Task '{task.Title}' is overdue. Please update its status."
                    );

                    // Notify admins
                    var admins = await _context.Users
                        .Where(u => u.Role == UserRole.Admin)
                        .ToListAsync();

                    foreach (var admin in admins)
                    {
                        if (admin == null) continue;

                        await _notificationService.CreateNotificationAsync(
                            admin.Id,
                            "Task Overdue - Admin Alert",
                            $"Task '{task.Title}' assigned to {task.AssignedUser.Username ?? "Unknown"} is overdue"
                        );
                    }

                    _logger.LogWarning("Task {TaskId} is overdue. Due date was {DueDate}", task.Id, task.DueDate);
                }

                _logger.LogInformation("Completed overdue tasks check. Found {Count} overdue tasks", overdueTasks.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking overdue tasks");
            }
        }
    }
}
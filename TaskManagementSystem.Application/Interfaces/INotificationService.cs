using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateNotificationAsync(int userId, string title, string message);
        Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId);
        Task<IEnumerable<NotificationDto>> GetUnreadNotificationsAsync(int userId);
        Task MarkAsReadAsync(int notificationId, int userId);
        Task MarkAllAsReadAsync(int userId);  // Note: This returns Task, not Task<T>
        Task<int> GetUnreadCountAsync(int userId);
    }
}
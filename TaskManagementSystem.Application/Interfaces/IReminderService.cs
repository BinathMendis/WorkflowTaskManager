using System.Threading.Tasks;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface IReminderService
    {
        Task SendDueDateRemindersAsync();
        Task SendOverdueNotificationsAsync();
    }
}
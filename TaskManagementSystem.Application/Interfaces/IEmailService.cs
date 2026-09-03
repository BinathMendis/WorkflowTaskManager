using System.Threading.Tasks;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);

        // Email when admin creates task (sent to assigned user)
        Task SendTaskAssignmentEmailAsync(string to, string userName, string taskTitle, DateTime dueDate);

        // Email when user accepts task (sent to task creator/admin)
        Task SendTaskAcceptedEmailAsync(string to, string adminName, string taskTitle, string acceptedBy);

        // Email when user rejects task (sent to task creator/admin with reason)
        Task SendTaskRejectedEmailAsync(string to, string adminName, string taskTitle, string rejectedBy, string reason);

        // Email when user completes task (sent to ALL admins)
        Task SendTaskCompletedEmailAsync(string to, string adminName, string taskTitle, string completedBy);

        // Email for due date reminder (sent to assigned user)
        Task SendDueDateReminderEmailAsync(string to, string userName, string taskTitle, DateTime dueDate);
    }
}
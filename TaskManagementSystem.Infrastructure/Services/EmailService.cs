using System;
using System.Threading.Tasks;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using TaskManagementSystem.Application.Interfaces;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            if (string.IsNullOrEmpty(to))
            {
                _logger.LogWarning("Skipping email - No recipient address provided");
                return;
            }

            try
            {
                var emailSettings = _configuration.GetSection("EmailSettings");

                var smtpServer = emailSettings["SmtpServer"];
                var smtpPortStr = emailSettings["SmtpPort"];
                var smtpUsername = emailSettings["SmtpUsername"];
                var smtpPassword = emailSettings["SmtpPassword"];
                var fromEmail = emailSettings["FromEmail"];
                var fromName = emailSettings["FromName"];

                // Validate required settings with null checks
                if (string.IsNullOrEmpty(smtpServer))
                {
                    _logger.LogWarning("SMTP Server is not configured. Email not sent to {Recipient}", to);
                    return;
                }

                if (string.IsNullOrEmpty(smtpUsername))
                {
                    _logger.LogWarning("SMTP Username is not configured. Email not sent to {Recipient}", to);
                    return;
                }

                if (string.IsNullOrEmpty(smtpPassword))
                {
                    _logger.LogWarning("SMTP Password is not configured. Email not sent to {Recipient}", to);
                    return;
                }

                var message = new MimeMessage();

                // Handle from address with null safety
                var fromAddress = string.IsNullOrEmpty(fromName)
                    ? new MailboxAddress(fromEmail ?? "noreply", fromEmail ?? "noreply@localhost")
                    : new MailboxAddress(fromName, fromEmail ?? "noreply@localhost");

                message.From.Add(fromAddress);
                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject ?? "Notification";

                var bodyBuilder = new BodyBuilder
                {
                    HtmlBody = body ?? string.Empty
                };
                message.Body = bodyBuilder.ToMessageBody();

                using var client = new SmtpClient();

                // Parse port with null check
                if (!int.TryParse(smtpPortStr, out int smtpPort))
                    smtpPort = 587;

                // Connect with timeout
                await client.ConnectAsync(smtpServer, smtpPort, SecureSocketOptions.StartTls);

                // Authenticate with non-null values (already checked above)
                await client.AuthenticateAsync(smtpUsername, smtpPassword);

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Recipient}", to);
            }
            catch (SmtpCommandException ex)
            {
                _logger.LogError(ex, "SMTP error sending email to {Recipient}. Error: {ErrorCode}", to, ex.ErrorCode);
            }
            catch (SmtpProtocolException ex)
            {
                _logger.LogError(ex, "SMTP protocol error sending email to {Recipient}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Recipient}", to);
            }
        }

        public async Task SendTaskAssignmentEmailAsync(string to, string userName, string taskTitle, DateTime dueDate)
        {
            var subject = $"New Task Assigned: {taskTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #2563eb;'>New Task Assignment</h2>
                    <p>Hello <strong>{EscapeHtml(userName ?? "User")}</strong>,</p>
                    <p>You have been assigned a new task:</p>
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                        <p style='margin: 5px 0;'><strong>Task:</strong> {EscapeHtml(taskTitle)}</p>
                        <p style='margin: 5px 0;'><strong>Due Date:</strong> {dueDate:MMMM dd, yyyy}</p>
                    </div>
                    <p>Please log in to the system to view and accept this task.</p>
                    <hr style='margin: 20px 0; border-color: #e0e0e0;'/>
                    <p style='color: #6b7280; font-size: 12px;'>Task Management System</p>
                </div>";
            await SendEmailAsync(to, subject, body);
        }

        public async Task SendTaskAcceptedEmailAsync(string to, string adminName, string taskTitle, string acceptedBy)
        {
            var subject = $"Task Accepted: {taskTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #16a34a;'>Task Accepted ?</h2>
                    <p>Hello <strong>{EscapeHtml(adminName ?? "Admin")}</strong>,</p>
                    <p>The following task has been accepted by <strong>{EscapeHtml(acceptedBy ?? "User")}</strong>:</p>
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;'>
                        <p style='margin: 5px 0;'><strong>Task:</strong> {EscapeHtml(taskTitle)}</p>
                    </div>
                    <p>The assignee has accepted the task and will start working on it.</p>
                    <hr style='margin: 20px 0; border-color: #e0e0e0;'/>
                    <p style='color: #6b7280; font-size: 12px;'>Task Management System</p>
                </div>";
            await SendEmailAsync(to, subject, body);
        }

        public async Task SendTaskRejectedEmailAsync(string to, string adminName, string taskTitle, string rejectedBy, string reason)
        {
            var subject = $"Task Rejected: {taskTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #dc2626;'>Task Rejected ?</h2>
                    <p>Hello <strong>{EscapeHtml(adminName ?? "Admin")}</strong>,</p>
                    <p>The following task has been rejected by <strong>{EscapeHtml(rejectedBy ?? "User")}</strong>:</p>
                    <div style='background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;'>
                        <p style='margin: 5px 0;'><strong>Task:</strong> {EscapeHtml(taskTitle)}</p>
                        <p style='margin: 5px 0;'><strong>Rejection Reason:</strong> {EscapeHtml(reason ?? "No reason provided")}</p>
                    </div>
                    <p>Please review and reassign if necessary.</p>
                    <hr style='margin: 20px 0; border-color: #e0e0e0;'/>
                    <p style='color: #6b7280; font-size: 12px;'>Task Management System</p>
                </div>";
            await SendEmailAsync(to, subject, body);
        }

        public async Task SendTaskCompletedEmailAsync(string to, string adminName, string taskTitle, string completedBy)
        {
            var subject = $"Task Completed: {taskTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #16a34a;'>Task Completed ?</h2>
                    <p>Hello <strong>{EscapeHtml(adminName ?? "Admin")}</strong>,</p>
                    <p>The following task has been marked as completed by <strong>{EscapeHtml(completedBy ?? "User")}</strong>:</p>
                    <div style='background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #16a34a;'>
                        <p style='margin: 5px 0;'><strong>Task:</strong> {EscapeHtml(taskTitle)}</p>
                    </div>
                    <p>Please review the completion status.</p>
                    <hr style='margin: 20px 0; border-color: #e0e0e0;'/>
                    <p style='color: #6b7280; font-size: 12px;'>Task Management System</p>
                </div>";
            await SendEmailAsync(to, subject, body);
        }

        public async Task SendDueDateReminderEmailAsync(string to, string userName, string taskTitle, DateTime dueDate)
        {
            var subject = $"Reminder: Task Due - {taskTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #eab308;'>Task Due Reminder ?</h2>
                    <p>Hello <strong>{EscapeHtml(userName ?? "User")}</strong>,</p>
                    <p>This is a reminder that the following task is due soon:</p>
                    <div style='background-color: #fefce8; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #eab308;'>
                        <p style='margin: 5px 0;'><strong>Task:</strong> {EscapeHtml(taskTitle)}</p>
                        <p style='margin: 5px 0;'><strong>Due Date:</strong> {dueDate:MMMM dd, yyyy}</p>
                    </div>
                    <p>Please ensure the task is completed on time.</p>
                    <hr style='margin: 20px 0; border-color: #e0e0e0;'/>
                    <p style='color: #6b7280; font-size: 12px;'>Task Management System</p>
                </div>";
            await SendEmailAsync(to, subject, body);
        }

        public async Task SendOverdueNotificationEmailAsync(string to, string userName, string taskTitle, DateTime dueDate)
        {
            var subject = $"URGENT: Task Overdue - {taskTitle}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;'>
                    <h2 style='color: #dc2626;'>Task Overdue Alert ??</h2>
                    <p>Hello <strong>{EscapeHtml(userName ?? "User")}</strong>,</p>
                    <p>The following task is now overdue:</p>
                    <div style='background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;'>
                        <p style='margin: 5px 0;'><strong>Task:</strong> {EscapeHtml(taskTitle)}</p>
                        <p style='margin: 5px 0;'><strong>Due Date:</strong> {dueDate:MMMM dd, yyyy}</p>
                    </div>
                    <p>Please take immediate action on this task.</p>
                    <hr style='margin: 20px 0; border-color: #e0e0e0;'/>
                    <p style='color: #6b7280; font-size: 12px;'>Task Management System</p>
                </div>";
            await SendEmailAsync(to, subject, body);
        }

        // Helper method to escape HTML special characters
        private static string EscapeHtml(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            return text
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&#39;");
        }
    }
}
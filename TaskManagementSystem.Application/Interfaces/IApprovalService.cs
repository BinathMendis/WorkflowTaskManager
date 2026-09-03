using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface IApprovalService
    {
        // For Approver
        Task<TaskDto> ApproveTaskAsync(int taskId, int approverId, string? comment = null);
        Task<TaskDto> RejectTaskAsync(int taskId, int approverId, string rejectionReason);

        // For Publisher
        Task<TaskDto> PublishTaskAsync(int taskId, int publisherId, string? comment = null);

        // For getting tasks
        Task<IEnumerable<TaskDto>> GetTasksPendingApprovalAsync();
        Task<IEnumerable<TaskDto>> GetTasksApprovedForPublishAsync();
    }
}
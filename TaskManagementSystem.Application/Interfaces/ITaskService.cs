using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface ITaskService
    {
        // Add createdBy parameter to track who created the task
        Task<TaskDto> CreateTaskAsync(CreateTaskDto createTaskDto, int createdBy);

        Task<TaskDto> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusDto updateDto, int userId);

        Task<TaskDto?> GetTaskByIdAsync(int taskId);

        Task<(IEnumerable<TaskDto> Tasks, int TotalCount, int TotalPages)> GetTasksAsync(TaskFilterDto filter);

        Task<bool> DeleteTaskAsync(int taskId);

        Task<IEnumerable<TaskDto>> GetMyTasksAsync(int userId);
    }
}
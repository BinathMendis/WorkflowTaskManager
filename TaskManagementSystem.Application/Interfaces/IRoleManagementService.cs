using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Domain.Enums;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface IRoleManagementService
    {
        Task AssignRoleToUserAsync(int userId, UserRole role, int assignedBy);
        Task RemoveRoleFromUserAsync(int userId, UserRole role);
        Task<IEnumerable<UserRole>> GetUserRolesAsync(int userId);
        Task<bool> HasRoleAsync(int userId, UserRole role);
        Task<IEnumerable<UserDto>> GetUsersByRoleAsync(UserRole role);
        Task<UserDto?> GetCurrentUserWithRolesAsync(int userId);
    }
}
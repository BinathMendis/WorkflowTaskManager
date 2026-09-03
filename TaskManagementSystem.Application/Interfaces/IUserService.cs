using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetAssignableUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<UserDto?> GetUserByUsernameAsync(string username);
        Task<List<UserDto>> GetAllAdminsAsync();
        Task<UserDto?> GetCurrentUserAsync(int userId);
        Task<bool> UserExistsAsync(int id);
    }
}
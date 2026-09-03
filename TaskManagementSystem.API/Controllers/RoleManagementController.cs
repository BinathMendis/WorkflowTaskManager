using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Enums;

namespace TaskManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]  // Controller level - Admin only by default
    public class RoleManagementController : ControllerBase
    {
        private readonly IRoleManagementService _roleService;

        public RoleManagementController(IRoleManagementService roleService)
        {
            _roleService = roleService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignRole([FromBody] AssignRoleDto dto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();

                if (!System.Enum.TryParse<UserRole>(dto.Role, true, out var role))
                    return BadRequest(new { message = "Invalid role. Valid: User, Admin, Approver, Publisher" });

                if (role == UserRole.Admin && dto.Assign)
                {
                    // Only existing admins can assign admin role
                    var currentUserRoles = await _roleService.GetUserRolesAsync(currentUserId);
                    if (!currentUserRoles.Contains(UserRole.Admin))
                        return BadRequest(new { message = "Only admins can assign admin role" });
                }

                if (dto.Assign)
                {
                    await _roleService.AssignRoleToUserAsync(dto.UserId, role, currentUserId);
                    return Ok(new { message = $"Role {dto.Role} assigned successfully" });
                }
                else
                {
                    await _roleService.RemoveRoleFromUserAsync(dto.UserId, role);
                    return Ok(new { message = $"Role {dto.Role} removed successfully" });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserRoles(int userId)
        {
            var roles = await _roleService.GetUserRolesAsync(userId);
            return Ok(new { userId = userId, roles = roles.Select(r => r.ToString()) });
        }

        [HttpGet("by-role/{role}")]
        public async Task<IActionResult> GetUsersByRole(string role)
        {
            if (!System.Enum.TryParse<UserRole>(role, true, out var userRole))
                return BadRequest(new { message = "Invalid role" });

            var users = await _roleService.GetUsersByRoleAsync(userRole);
            return Ok(users);
        }

        // This endpoint is now accessible to ALL authenticated users (overrides the controller-level restriction)
        [AllowAnonymous]  // Or [Authorize] - allows any authenticated user
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentUserRoles()
        {
            var userId = GetCurrentUserId();
            var user = await _roleService.GetCurrentUserWithRolesAsync(userId);
            return Ok(user);
        }
    }
}
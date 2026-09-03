using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Entities;
using TaskManagementSystem.Domain.Enums;
using TaskManagementSystem.Infrastructure.Data;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class RoleManagementService : IRoleManagementService
    {
        private readonly ApplicationDbContext _context;

        public RoleManagementService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async System.Threading.Tasks.Task AssignRoleToUserAsync(int userId, UserRole role, int assignedBy)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("User not found");

            var existing = await _context.UserRoleAssignments
                .FirstOrDefaultAsync(r => r.UserId == userId && r.Role == role);

            if (existing != null)
                throw new Exception($"User already has the {role} role");

            var assignment = new UserRoleAssignment
            {
                UserId = userId,
                Role = role,
                AssignedAt = DateTime.UtcNow,
                AssignedBy = assignedBy
            };

            _context.UserRoleAssignments.Add(assignment);

            // Only Admin changes primary role. Approver/Publisher stay additional roles.
            if (role == UserRole.Admin && user.Role != UserRole.Admin)
            {
                user.Role = UserRole.Admin;
            }

            await _context.SaveChangesAsync();
        }

        public async System.Threading.Tasks.Task RemoveRoleFromUserAsync(int userId, UserRole role)
        {
            var assignment = await _context.UserRoleAssignments
                .FirstOrDefaultAsync(r => r.UserId == userId && r.Role == role);

            if (assignment == null)
                throw new Exception($"User does not have the {role} role");

            _context.UserRoleAssignments.Remove(assignment);

            if (role == UserRole.Admin)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null && user.Role == UserRole.Admin)
                {
                    var remainingRoles = await GetUserRolesAsync(userId);
                    if (remainingRoles.Contains(UserRole.Approver))
                        user.Role = UserRole.Approver;
                    else if (remainingRoles.Contains(UserRole.Publisher))
                        user.Role = UserRole.Publisher;
                    else
                        user.Role = UserRole.User;
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<UserRole>> GetUserRolesAsync(int userId)
        {
            var roles = await _context.UserRoleAssignments
                .Where(r => r.UserId == userId)
                .Select(r => r.Role)
                .ToListAsync();

            var user = await _context.Users.FindAsync(userId);
            if (user != null && !roles.Contains(user.Role))
                roles.Add(user.Role);

            return roles.Distinct();
        }

        public async Task<bool> HasRoleAsync(int userId, UserRole role)
        {
            var roles = await GetUserRolesAsync(userId);
            return roles.Contains(role);
        }

        public async Task<IEnumerable<UserDto>> GetUsersByRoleAsync(UserRole role)
        {
            var userIdsWithRole = await _context.UserRoleAssignments
                .Where(r => r.Role == role)
                .Select(r => r.UserId)
                .ToListAsync();

            var usersWithMainRole = await _context.Users
                .Where(u => u.Role == role)
                .Select(u => u.Id)
                .ToListAsync();

            var allUserIds = userIdsWithRole.Union(usersWithMainRole).Distinct();

            var users = await _context.Users
                .Where(u => allUserIds.Contains(u.Id))
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role.ToString(),
                    Roles = new List<string>(),
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync();

            return users;
        }

        public async Task<UserDto?> GetCurrentUserWithRolesAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            var roles = await GetUserRolesAsync(userId);

            return new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString(),
                Roles = roles.Select(r => r.ToString()).ToList(),
                CreatedAt = user.CreatedAt
            };
        }
    }
}
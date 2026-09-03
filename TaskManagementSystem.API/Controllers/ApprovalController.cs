using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;  // ✅ FIXED: Added this for Exception
using System.Security.Claims;
using System.Threading.Tasks;
using TaskManagementSystem.Application.Interfaces;

namespace TaskManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ApprovalController : ControllerBase
    {
        private readonly IApprovalService _approvalService;

        public ApprovalController(IApprovalService approvalService)
        {
            _approvalService = approvalService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        // Approver endpoints
        [HttpGet("pending-approval")]
        public async Task<IActionResult> GetTasksPendingApproval()
        {
            var tasks = await _approvalService.GetTasksPendingApprovalAsync();
            return Ok(tasks);
        }

        [HttpPost("{taskId}/approve")]
        public async Task<IActionResult> ApproveTask(int taskId, [FromBody] string? comment)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _approvalService.ApproveTaskAsync(taskId, userId, comment);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{taskId}/reject")]
        public async Task<IActionResult> RejectTask(int taskId, [FromBody] string rejectionReason)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _approvalService.RejectTaskAsync(taskId, userId, rejectionReason);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Publisher endpoints
        [HttpGet("approved-for-publish")]
        public async Task<IActionResult> GetTasksApprovedForPublish()
        {
            var tasks = await _approvalService.GetTasksApprovedForPublishAsync();
            return Ok(tasks);
        }

        [HttpPost("{taskId}/publish")]
        public async Task<IActionResult> PublishTask(int taskId, [FromBody] string? comment)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _approvalService.PublishTaskAsync(taskId, userId, comment);
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
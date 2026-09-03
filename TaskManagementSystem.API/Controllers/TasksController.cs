using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;

namespace TaskManagementSystem.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ICommentService _commentService;
        private readonly IAttachmentService _attachmentService;
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;

        public TasksController(
            ITaskService taskService,
            ICommentService commentService,
            IAttachmentService attachmentService,
            IEmailService emailService,
            IUserService userService)
        {
            _taskService = taskService;
            _commentService = commentService;
            _attachmentService = attachmentService;
            _emailService = emailService;
            _userService = userService;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto createTaskDto)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var task = await _taskService.CreateTaskAsync(createTaskDto, currentUserId);

                // Send email to assigned user ONLY
                var assignedUser = await _userService.GetUserByIdAsync(createTaskDto.AssignedUserId);
                if (assignedUser != null && !string.IsNullOrEmpty(assignedUser.Email))
                {
                    await _emailService.SendTaskAssignmentEmailAsync(
                        assignedUser.Email,
                        assignedUser.Username,
                        task.Title,
                        task.DueDate
                    );
                }

                return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks([FromQuery] TaskFilterDto filter)
        {
            var (tasks, totalCount, totalPages) = await _taskService.GetTasksAsync(filter);
            return Ok(new
            {
                data = tasks,
                totalCount,
                totalPages,
                page = filter.Page,
                pageSize = filter.PageSize
            });
        }

        [HttpGet("my-tasks")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userId = GetCurrentUserId();
            var tasks = await _taskService.GetMyTasksAsync(userId);
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var task = await _taskService.GetTaskByIdAsync(id);
            if (task == null)
                return NotFound(new { message = "Task not found" });
            return Ok(task);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, [FromBody] UpdateTaskStatusDto updateDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var task = await _taskService.UpdateTaskStatusAsync(id, updateDto, userId);
                if (task == null)
                    return NotFound(new { message = "Task not found" });
                return Ok(task);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/accept")]
        public async Task<IActionResult> AcceptTask(int id)
        {
            var userId = GetCurrentUserId();
            var task = await _taskService.GetTaskByIdAsync(id);

            if (task == null)
                return NotFound(new { message = "Task not found" });

            var updatedTask = await _taskService.UpdateTaskStatusAsync(id, new UpdateTaskStatusDto
            {
                Status = "Accepted",
                Comment = "Task accepted"
            }, userId);

            // Send email to task creator (admin) ONLY
            var taskCreator = await _userService.GetUserByIdAsync(task.CreatedBy);
            var currentUser = await _userService.GetUserByIdAsync(userId);

            if (taskCreator != null && !string.IsNullOrEmpty(taskCreator.Email))
            {
                await _emailService.SendTaskAcceptedEmailAsync(
                    taskCreator.Email,
                    taskCreator.Username,
                    task.Title,
                    currentUser?.Username ?? "User"
                );
            }

            return Ok(updatedTask);
        }

        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectTask(int id, [FromBody] string? reason)
        {
            var userId = GetCurrentUserId();
            var task = await _taskService.GetTaskByIdAsync(id);

            if (task == null)
                return NotFound(new { message = "Task not found" });

            var updatedTask = await _taskService.UpdateTaskStatusAsync(id, new UpdateTaskStatusDto
            {
                Status = "Rejected",
                Comment = reason ?? "Task rejected"
            }, userId);

            // Send email to task creator (admin) ONLY with rejection reason
            var taskCreator = await _userService.GetUserByIdAsync(task.CreatedBy);
            var currentUser = await _userService.GetUserByIdAsync(userId);

            if (taskCreator != null && !string.IsNullOrEmpty(taskCreator.Email))
            {
                await _emailService.SendTaskRejectedEmailAsync(
                    taskCreator.Email,
                    taskCreator.Username,
                    task.Title,
                    currentUser?.Username ?? "User",
                    reason ?? "No reason provided"
                );
            }

            return Ok(updatedTask);
        }

        [HttpPost("{id}/complete")]
        public async Task<IActionResult> CompleteTask(int id)
        {
            var userId = GetCurrentUserId();
            var task = await _taskService.GetTaskByIdAsync(id);

            if (task == null)
                return NotFound(new { message = "Task not found" });

            var updatedTask = await _taskService.UpdateTaskStatusAsync(id, new UpdateTaskStatusDto
            {
                Status = "Completed",
                Comment = "Task marked as completed"
            }, userId);

            // Send email to ALL admins
            var allAdmins = await _userService.GetAllAdminsAsync();
            var currentUser = await _userService.GetUserByIdAsync(userId);

            foreach (var admin in allAdmins)
            {
                if (admin != null && !string.IsNullOrEmpty(admin.Email))
                {
                    await _emailService.SendTaskCompletedEmailAsync(
                        admin.Email,
                        admin.Username,
                        task.Title,
                        currentUser?.Username ?? "User"
                    );
                }
            }

            return Ok(updatedTask);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var result = await _taskService.DeleteTaskAsync(id);
            if (!result)
                return NotFound(new { message = "Task not found" });
            return NoContent();
        }

        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto createDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var comment = await _commentService.AddCommentAsync(id, userId, createDto);
                return Ok(comment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetTaskComments(int id)
        {
            var comments = await _commentService.GetTaskCommentsAsync(id);
            return Ok(comments);
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");

            var result = await _commentService.DeleteCommentAsync(commentId, userId, isAdmin);
            if (!result)
                return BadRequest(new { message = "Cannot delete comment" });

            return NoContent();
        }

        [HttpPost("{id}/attachments")]
        public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest(new { message = "No file uploaded" });

                var userId = GetCurrentUserId();

                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                var fileBytes = memoryStream.ToArray();

                var attachment = await _attachmentService.UploadAttachmentAsync(
                    taskId: id,
                    userId: userId,
                    fileContent: fileBytes,
                    fileName: file.FileName,
                    contentType: file.ContentType
                );

                return Ok(attachment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}/attachments")]
        public async Task<IActionResult> GetTaskAttachments(int id)
        {
            var attachments = await _attachmentService.GetTaskAttachmentsAsync(id);
            return Ok(attachments);
        }

        [HttpGet("{taskId}/attachments/{attachmentId}/download")]
        public async Task<IActionResult> DownloadAttachment(int attachmentId)
        {
            try
            {
                var (fileContent, contentType, fileName) = await _attachmentService.DownloadAttachmentAsync(attachmentId);
                return File(fileContent, contentType, fileName);
            }
            catch (Exception ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("attachments/{attachmentId}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");

            var result = await _attachmentService.DeleteAttachmentAsync(attachmentId, userId, isAdmin);
            if (!result)
                return BadRequest(new { message = "Cannot delete attachment" });

            return NoContent();
        }
    }
}
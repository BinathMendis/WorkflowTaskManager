namespace TaskManagementSystem.Application.DTOs
{
    public class UpdateUserDto
    {
        public UpdateUserDto()
        {
            Username = string.Empty;
            Email = string.Empty;
            Password = string.Empty;
            Role = string.Empty;
        }

        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Role { get; set; }
    }

    public class DeleteResponseDto
    {
        public DeleteResponseDto()
        {
            Message = string.Empty;
        }

        public bool Success { get; set; }
        public string Message { get; set; }
        public int DeletedUserId { get; set; }
    }
}
namespace TaskManagementSystem.Domain.Enums
{
    public enum ApprovalLevel
    {
        TaskAssigned = 0,      // Admin assigned task
        PendingAcceptance = 1,  // Waiting for user to accept
        Accepted = 2,           // User accepted
        InProgress = 3,         // Working on task
        Completed = 4,          // User completed, waiting for approver
        PendingApproval = 5,    // Under review by approver
        Approved = 6,           // Approver approved, ready for publisher
        Rejected = 7,           // Approver rejected, needs rework
        Published = 8           // Publisher published
    }
}
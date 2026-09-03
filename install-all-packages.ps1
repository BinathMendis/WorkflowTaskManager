# fix-tasks-controller.ps1
Write-Host "Fixing TasksController.cs UploadAttachment method..." -ForegroundColor Green

$controllerPath = "TaskManagementSystem.API\Controllers\TasksController.cs"

if (Test-Path $controllerPath) {
    $content = Get-Content $controllerPath -Raw
    
    # Find and replace the old method with the new one
    $oldMethodPattern = '\[HttpPost\("{id}/attachments"\)\][\s\S]*?Task<IActionResult> UploadAttachment\(int id, IFormFile file\)[\s\S]*?return Ok\(attachment\);[\s\S]*?\}'
    
    $newMethod = @'
[HttpPost("{id}/attachments")]
public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
{
    try
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded" });

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        
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
'@
    
    # Check if the old method exists and replace
    if ($content -match 'UploadAttachment\(int id, IFormFile file\)') {
        # Simple approach - find and replace the specific line
        $content = $content -replace '(?s)(\[HttpPost\("{id}/attachments"\)\].*?)(return Ok\(attachment\);.*?\})', $newMethod
        
        Set-Content -Path $controllerPath -Value $content -NoNewline
        Write-Host "TasksController.cs updated!" -ForegroundColor Green
    } else {
        Write-Host "Could not find the UploadAttachment method. Please check manually." -ForegroundColor Yellow
    }
}

# Add required using statement if missing
$controllerContent = Get-Content $controllerPath -Raw
if ($controllerContent -notlike '*using System.IO;*') {
    $controllerContent = $controllerContent -replace 'using System;', "using System;`nusing System.IO;"
    Set-Content -Path $controllerPath -Value $controllerContent
    Write-Host "Added System.IO using statement" -ForegroundColor Green
}

# Rebuild
Write-Host "`nRebuilding solution..." -ForegroundColor Yellow
dotnet build

Write-Host "`nDone!" -ForegroundColor Green
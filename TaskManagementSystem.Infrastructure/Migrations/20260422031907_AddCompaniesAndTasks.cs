using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagementSystem.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCompaniesAndTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompanyId1",
                table: "Tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_CompanyId1",
                table: "Tasks",
                column: "CompanyId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Companies_CompanyId1",
                table: "Tasks",
                column: "CompanyId1",
                principalTable: "Companies",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Companies_CompanyId1",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_CompanyId1",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "CompanyId1",
                table: "Tasks");
        }
    }
}

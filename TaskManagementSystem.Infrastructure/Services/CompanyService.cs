using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskManagementSystem.Application.DTOs;
using TaskManagementSystem.Application.Interfaces;
using TaskManagementSystem.Domain.Entities;
using TaskManagementSystem.Infrastructure.Data;

namespace TaskManagementSystem.Infrastructure.Services
{
    public class CompanyService : ICompanyService
    {
        private readonly ApplicationDbContext _context;

        public CompanyService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto createDto)
        {
            var company = new Company
            {
                Name = createDto.Name,
                Description = createDto.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            return await MapToDto(company);
        }

        public async Task<CompanyDto> UpdateCompanyAsync(int id, UpdateCompanyDto updateDto)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
                throw new Exception("Company not found");

            company.Name = updateDto.Name;
            company.Description = updateDto.Description;
            await _context.SaveChangesAsync();

            return await MapToDto(company);
        }

        public async Task<bool> DeleteCompanyAsync(int id)
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
                return false;

            _context.Companies.Remove(company);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CompanyDto?> GetCompanyByIdAsync(int id)
        {
            var company = await _context.Companies
                .Include(c => c.Tasks)
                .FirstOrDefaultAsync(c => c.Id == id);

            return company == null ? null : await MapToDto(company);
        }

        public async Task<IEnumerable<CompanyDto>> GetAllCompaniesAsync()
        {
            var companies = await _context.Companies
                .Include(c => c.Tasks)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return companies.Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                TaskCount = c.Tasks?.Count ?? 0
            });
        }

        private async Task<CompanyDto> MapToDto(Company company)
        {
            var taskCount = await _context.Tasks.CountAsync(t => t.CompanyId == company.Id);

            return new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                Description = company.Description,
                CreatedAt = company.CreatedAt,
                TaskCount = taskCount
            };
        }
    }
}
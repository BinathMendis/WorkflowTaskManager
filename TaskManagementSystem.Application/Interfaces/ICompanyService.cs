using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagementSystem.Application.DTOs;

namespace TaskManagementSystem.Application.Interfaces
{
    public interface ICompanyService
    {
        Task<CompanyDto> CreateCompanyAsync(CreateCompanyDto createDto);
        Task<CompanyDto> UpdateCompanyAsync(int id, UpdateCompanyDto updateDto);
        Task<bool> DeleteCompanyAsync(int id);
        Task<CompanyDto?> GetCompanyByIdAsync(int id);
        Task<IEnumerable<CompanyDto>> GetAllCompaniesAsync();
    }
}
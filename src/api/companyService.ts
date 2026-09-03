import api from './axiosInstance'
import { CompanyDto, CreateCompanyDto, UpdateCompanyDto } from '../types/company.types'

export const getCompanies = async (): Promise<CompanyDto[]> => {
  const res = await api.get<CompanyDto[]>('/companies')
  return res.data
}

export const getCompanyById = async (id: number): Promise<CompanyDto> => {
  const res = await api.get<CompanyDto>(`/companies/${id}`)
  return res.data
}

export const createCompany = async (data: CreateCompanyDto): Promise<CompanyDto> => {
  const res = await api.post<CompanyDto>('/companies', data)
  return res.data
}

export const updateCompany = async (id: number, data: UpdateCompanyDto): Promise<CompanyDto> => {
  const res = await api.put<CompanyDto>(`/companies/${id}`, data)
  return res.data
}

export const deleteCompany = async (id: number): Promise<void> => {
  await api.delete(`/companies/${id}`)
}

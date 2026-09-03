export interface CompanyDto {
  id: number
  name: string
  description: string
  createdAt: string
  taskCount: number
}

export interface CreateCompanyDto {
  name: string
  description: string
}

export interface UpdateCompanyDto {
  name: string
  description: string
}

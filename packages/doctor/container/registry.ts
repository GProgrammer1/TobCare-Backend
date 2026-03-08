import "reflect-metadata"
import { container } from "common/container/registry"
import { DoctorApplicationRepository } from "../repositories/doctor-application.repository"
import { DoctorAuthService } from "../services/auth.service"

export function registerDoctorContainer() {
  container.registerSingleton("DoctorApplicationRepository", DoctorApplicationRepository)
  container.registerSingleton("DoctorAuthService", DoctorAuthService)
}

export { container }

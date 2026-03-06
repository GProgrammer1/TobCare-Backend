import "reflect-metadata"
import { container } from "tsyringe"
import { registerContainer as registerCommonContainer } from "common/container/registry"
import { PatientRepository } from "../repositories/patient.repository"
import { PatientAuthService } from "../services/auth.service"

export function registerContainer() {
  registerCommonContainer()
  container.registerSingleton("PatientRepository", PatientRepository)
  container.registerSingleton("PatientAuthService", PatientAuthService)
}

export { container }

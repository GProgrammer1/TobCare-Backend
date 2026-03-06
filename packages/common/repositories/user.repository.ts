import { PrismaClient, UserRole } from "@tobcare/prisma"
import { EncryptedUserSignupDto, UserSignupDto } from "common/dtos/auth.dto"
import { UserAlreadyExistsError } from "common/errors/errors"
import { inject, injectable } from "tsyringe"

@injectable()
export class UserRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async createUser(userSignupReq: EncryptedUserSignupDto) {
    const potentialUser = await this.findUserByEmail(userSignupReq.email)
    if (potentialUser) {
      throw new UserAlreadyExistsError(userSignupReq.email)
    }
    return await this.prisma.user.create({
        data: {
            firstName: userSignupReq.firstName,
            lastName: userSignupReq.lastName,
            email: userSignupReq.email,
            passwordHash: userSignupReq.passwordHash,
            role: userSignupReq.role,
            phoneNumber: userSignupReq.phoneNumber,
        }
    })
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
        where: {
            email,
        },
    })
  }
}
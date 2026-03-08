import { PrismaClient } from "@tobcare/prisma"
import { EncryptedUserSignupDto } from "common/dtos/auth.dto"
import { UserAlreadyExistsError } from "common/errors/errors"
import { inject, injectable } from "tsyringe"

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">

@injectable()
export class UserRepository {
  constructor(@inject("PrismaClient") private prisma: PrismaClient) {}

  async createUser(userSignupReq: EncryptedUserSignupDto) {
    return this.createUserWithClient(this.prisma, userSignupReq)
  }

  /** Use within a transaction for atomic rollback with patient creation */
  async createUserInTransaction(tx: TxClient, userSignupReq: EncryptedUserSignupDto) {
    return this.createUserWithClient(tx, userSignupReq)
  }

  private async createUserWithClient(
    client: TxClient,
    userSignupReq: EncryptedUserSignupDto,
  ) {
    const potentialUser = await client.user.findUnique({
      where: { email: userSignupReq.email },
    })
    if (potentialUser) {
      throw new UserAlreadyExistsError()
    }
    return client.user.create({
      data: {
        firstName: userSignupReq.firstName,
        lastName: userSignupReq.lastName,
        email: userSignupReq.email,
        passwordHash: userSignupReq.passwordHash,
        role: userSignupReq.role,
        phoneNumber: userSignupReq.phoneNumber,
      },
    })
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }
}
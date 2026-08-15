import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from "@nestjs/common";
import { CAPABILITIES } from "@vonveria-swim/permissions";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { RequireCapability } from "./decorators/require-capability.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import type { AuthenticatedUser } from "./types";

@Controller("users")
@RequireCapability(CAPABILITIES.USERS_MANAGE)
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.list(user.organizationId);
  }

  @RequireCapability(CAPABILITIES.SCHEDULING_MANAGE, CAPABILITIES.USERS_MANAGE)
  @Get("instructors")
  listInstructors(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listInstructors(user.organizationId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.organizationId, user.id, dto);
  }

  @Post(":id/reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.usersService.resetPassword(user.organizationId, user.id, id);
  }
}

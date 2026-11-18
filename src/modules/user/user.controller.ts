import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ResponseMessage } from "@/common/decorators/response-message.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/role.enum";
import { AuthUser } from "@/common/interfaces/auth-user.interface";
import { UserService } from "./user.service";
import { UpdateProfileDto, UpdateUserStatusDto, UserQueryDto } from "./dto/user.dto";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  // "me" routes must stay above the ":id" routes, otherwise Nest reads "me" as an ID
  @Patch("me")
  @ResponseMessage("Profile updated")
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto, @Ip() ip: string) {
    return this.userService.updateProfile(user, dto, ip);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ResponseMessage("Users fetched")
  findAll(@Query() q: UserQueryDto) {
    return this.userService.findAll(q);
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @ResponseMessage("User fetched")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(":id/status")
  @Roles(Role.ADMIN)
  @ResponseMessage("User status updated")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: AuthUser,
    @Ip() ip: string,
  ) {
    return this.userService.updateStatus(id, dto, admin, ip);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @ResponseMessage("User deleted")
  deleteUser(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() admin: AuthUser, @Ip() ip: string) {
    return this.userService.deleteUser(id, admin, ip);
  }
}

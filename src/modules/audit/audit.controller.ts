import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ResponseMessage } from "@/common/decorators/response-message.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/role.enum";
import { AuditService } from "./audit.service";
import { AuditQueryDto } from "./dto/audit-query.dto";

@ApiTags("Audit logs")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ResponseMessage("Audit logs fetched")
  findAll(@Query() q: AuditQueryDto) {
    return this.auditService.findAll(q);
  }

  @Get(":id")
  @ResponseMessage("Audit entry fetched")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}

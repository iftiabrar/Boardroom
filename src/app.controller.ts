import { AppService } from "@/src/app.service";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators/public.decorator";

@ApiTags("App")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  healthCheck() {
    // The middleware in main.ts will automatically 
    // attach the CSRF cookies to this response.
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

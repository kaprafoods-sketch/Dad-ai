import { Controller, Get } from '@nestjs/common';
import { Public } from './core/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return { status: 'ok', service: 'dad-ai-api', time: new Date().toISOString() };
  }
}

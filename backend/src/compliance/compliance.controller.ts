import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Get compliance rules' })
  findRules(@Query() filters: any) {
    return this.complianceService.findRules(filters);
  }

  @Post('check')
  @ApiOperation({ summary: 'Generate compliance checklist' })
  generateChecklist(@Body() data: any) {
    return this.complianceService.generateChecklist(data);
  }
}

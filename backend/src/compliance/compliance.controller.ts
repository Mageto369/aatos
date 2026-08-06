import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance')
@Controller('compliance')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('rules')
  @ApiOperation({ summary: 'Get compliance rules' })
  findRules(@Query() filters: any) {
    return this.complianceService.findRules(filters);
  }

  @Post('check')
  @ApiOperation({ summary: 'Generate compliance checklist' })
  @Roles('owner', 'admin', 'operator', 'compliance_officer')
  generateChecklist(@Body() data: any) {
    return this.complianceService.generateChecklist(data);
  }
}

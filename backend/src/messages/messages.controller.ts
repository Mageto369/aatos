import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  @Roles('owner', 'admin', 'operator')
  async createMessage(
    @Body() data: { dealId?: string; rfqId?: string; content: string; messageType?: string },
    @Request() req: any,
  ) {
    return this.messagesService.createMessage(req.user.orgId, req.user.userId, data);
  }

  @Get('deal/:dealId')
  @ApiOperation({ summary: 'Get messages for a deal' })
  async getDealMessages(
    @Param('dealId') dealId: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.messagesService.getDealMessages(dealId, cursor, limit);
  }
}

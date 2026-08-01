import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  async createMessage(
    @Body() data: { dealId?: string; rfqId?: string; content: string; messageType?: string },
    @Request() req,
  ) {
    const orgId = req.headers['x-organization-id'];
    return this.messagesService.createMessage(orgId, req.user.userId, data);
  }

  @Get('deal/:dealId')
  @ApiOperation({ summary: 'Get messages for a deal' })
  async getDealMessages(
    @Param('dealId') dealId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getDealMessages(dealId, cursor, limit);
  }
}

import { Controller, Get, Post, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findAll(
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Request() req?: any,
  ) {
    return this.notificationsService.findAll(req.user.userId, {
      unreadOnly: unread === 'true',
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markRead(id, req.user.userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllRead(@Request() req: any) {
    await this.notificationsService.markAllRead(req.user.userId);
    return { message: 'All notifications marked as read' };
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss notification' })
  async dismiss(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.dismiss(id, req.user.userId);
    return { message: 'Notification dismissed' };
  }
}

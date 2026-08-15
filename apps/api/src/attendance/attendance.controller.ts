import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { CAPABILITIES } from '@vonveria-swim/permissions';
import { AttendanceService, type SessionAttendance } from './attendance.service';
import { RequireCapability } from '../identity/decorators/require-capability.decorator';
import { CurrentUser } from '../identity/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../identity/types';

class MarkAbsentDto {
  notes?: string;
}

@Controller('attendance')
export class AttendanceController {
  constructor(@Inject(AttendanceService) private readonly attendanceService: AttendanceService) {}

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post(':sessionId/students/:studentId/absent')
  async markAbsent(
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
    @Body() dto: MarkAbsentDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionAttendance> {
    return this.attendanceService.markAbsent(
      user.organizationId,
      sessionId,
      studentId,
      dto.notes ?? null,
      user.id,
    );
  }

  @RequireCapability(CAPABILITIES.BILLING_MANAGE)
  @Post(':sessionId/students/:studentId/present')
  async markPresent(
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SessionAttendance> {
    return this.attendanceService.markPresent(user.organizationId, sessionId, studentId, user.id);
  }

  @Get(':sessionId/attendance')
  async getSessionAttendance(@Param('sessionId') sessionId: string): Promise<SessionAttendance[]> {
    return this.attendanceService.getSessionAttendance(sessionId);
  }
}

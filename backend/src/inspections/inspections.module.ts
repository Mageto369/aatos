import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import { Inspection } from './entities/inspection.entity';

import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [TypeOrmModule.forFeature([Inspection]), WorkflowsModule],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}

import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { CommentEntity } from '../entities/comment.entity';

@Module({
  imports: [ProfilesModule, TypeOrmModule.forFeature([ProjectEntity, CommentEntity])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

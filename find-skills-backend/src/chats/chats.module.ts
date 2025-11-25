import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatEntity } from '../entities/chat.entity';
import { MessageEntity } from '../entities/message.entity';

@Module({
  imports: [ProfilesModule, TypeOrmModule.forFeature([ChatEntity, MessageEntity])],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}

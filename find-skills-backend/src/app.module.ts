import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfilesModule } from './profiles/profiles.module';
import { ProjectsModule } from './projects/projects.module';
import { WebauthnModule } from './webauthn/webauthn.module';
import { ChatsModule } from './chats/chats.module';
import { AuthController } from './auth.controller';
import { ProfileEntity } from './entities/profile.entity';
import { WebauthnCredentialEntity } from './entities/webauthn-credential.entity';
import { ProjectEntity } from './entities/project.entity';
import { CommentEntity } from './entities/comment.entity';
import { ChatEntity } from './entities/chat.entity';
import { MessageEntity } from './entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      username: process.env.DB_USER || 'findskills_user',
      password: process.env.DB_PASSWORD || 'findskills_pass',
      database: process.env.DB_NAME || 'findskills_dev',
      entities: [ProfileEntity, ProjectEntity, CommentEntity, ChatEntity, MessageEntity, WebauthnCredentialEntity, __dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      timezone: 'Z',
    }),
    ProfilesModule,
    ProjectsModule,
    WebauthnModule,
    ChatsModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { WebauthnController } from './webauthn.controller';
import { WebauthnService } from './webauthn.service';
import { ProfilesModule } from '../profiles/profiles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebauthnCredentialEntity } from '../entities/webauthn-credential.entity';

@Module({
  imports: [ProfilesModule, TypeOrmModule.forFeature([WebauthnCredentialEntity])],
  controllers: [WebauthnController],
  providers: [WebauthnService],
})
export class WebauthnModule {}

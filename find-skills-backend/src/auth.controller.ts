import { Body, Controller, Post, Res, Get, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { ProfilesService } from './profiles/profiles.service';

class LoginDto {
  login!: string;
  password!: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(private readonly profilesService: ProfilesService) {}

  // Login: validate credentials and set session cookie
  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { login, password } = body;
    const valid = await this.profilesService.validatePassword(login, password);
    if (!valid) {
      return { ok: false, error: 'Invalid credentials' };
    }
    const sessionValue = `sess:${Buffer.from(login).toString('base64')}:${Date.now()}`;
    res.cookie('session', sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.USE_HTTPS === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = await this.profilesService.findByLogin(login);
    const id = user ? user.id : undefined;

    return { ok: true, login, id };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear the session cookie
    res.clearCookie('session', { httpOnly: true, sameSite: 'lax', secure: process.env.USE_HTTPS === 'true' });
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: Request) {
    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') return { ok: false };

    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') return { ok: false };

    let login: string;
    try {
      login = Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      return { ok: false };
    }

    const ts = Number(parts[2]);
    if (isNaN(ts)) return { ok: false };

    const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // same as cookie maxAge
    if (Date.now() - ts > maxAgeMs) return { ok: false };

    const user = await this.profilesService.findByLogin(login);
    if (!user) return { ok: false };

    return { ok: true, id: user.id, login };
  }
}

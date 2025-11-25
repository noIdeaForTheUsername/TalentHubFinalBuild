import { Body, Controller, Post, BadRequestException, Req, Res } from '@nestjs/common';
import { WebauthnService } from './webauthn.service';
import { ProfilesService } from '../profiles/profiles.service';
import type { Request, Response } from 'express';

@Controller('api/webauthn')
export class WebauthnController {
  constructor(private readonly webauthn: WebauthnService, private readonly profiles: ProfilesService) {}

  // Verify session cookie and return the logged-in user's login and id
  private getSessionLogin(req: Request): string {
    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') throw new BadRequestException('no session');
    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') throw new BadRequestException('invalid session');
    try {
      return Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      throw new BadRequestException('invalid session');
    }
  }

  @Post('register/options')
  async registerOptions(@Body() body: { login?: string }, @Req() req?: Request) {
    // require an authenticated session to start registration
    if (!req) throw new BadRequestException('no request');
    const sessionLogin = this.getSessionLogin(req);
    const login = body?.login ? String(body.login) : sessionLogin;
    if (login !== sessionLogin) throw new BadRequestException('login must match authenticated user');
    const opts = await this.webauthn.generateRegisterOptions(login);
    if (!opts) throw new BadRequestException('user not found');
    return opts;
  }

  @Post('register/verify')
  async registerVerify(@Body() body: { login?: string; attestation: any }, @Req() req?: Request) {
    if (!req) throw new BadRequestException('no request');
    const sessionLogin = this.getSessionLogin(req);
    const login = body?.login ? String(body.login) : sessionLogin;
    if (login !== sessionLogin) throw new BadRequestException('login must match authenticated user');
    if (!body?.attestation) throw new BadRequestException('invalid');
    // eslint-disable-next-line no-console
    console.log('webauthn.registerVerify: incoming', {
      loginFromBody: body?.login,
      sessionLogin,
      attestationKeys: body?.attestation ? Object.keys(body.attestation).slice(0, 10) : null,
      attestationSize: body?.attestation ? JSON.stringify(body.attestation).length : 0,
    });
    try {
      const res = await this.webauthn.verifyRegister(login, body.attestation);
      // eslint-disable-next-line no-console
      console.log('webauthn.registerVerify: verified result', { ok: res?.verified ?? false });
      return res;
    } catch (e) {
      // log full error to server console for debugging
      // eslint-disable-next-line no-console
      console.error('webauthn.registerVerify error for', login, e && (e.stack || e));
      throw new BadRequestException('webauthn registration failed');
    }
  }

  @Post('login/options')
  loginOptions(@Body() body: { login?: string }) {
    // login optional: if omitted, server will return an options object that allows discoverable credentials
    const opts = this.webauthn.generateLoginOptions(body?.login);
    return opts;
  }

  @Post('login/verify')
  async loginVerify(
    @Body() body: { login?: string; assertion: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!body?.assertion) throw new BadRequestException('invalid');
    // verifyLogin returns { verification, login } on success or throws
    const result = await this.webauthn.verifyLogin(body?.login, body.assertion);
    const login = result?.login;
    if (!login) throw new BadRequestException('could not determine login');

    // set session cookie same as password login
    const sessionValue = `sess:${Buffer.from(login).toString('base64')}:${Date.now()}`;
    res.cookie('session', sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.USE_HTTPS === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const user = await this.profiles.findByLogin(login);
    const id = user ? user.id : undefined;

    return { ok: true, login, id };
  }
}

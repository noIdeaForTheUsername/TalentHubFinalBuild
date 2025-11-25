import { Injectable } from '@nestjs/common';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { ProfilesService } from '../profiles/profiles.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebauthnCredentialEntity } from '../entities/webauthn-credential.entity';

function toBase64url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufferToBase64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function arrayBufferToBuffer(ab: any) {
  if (Buffer.isBuffer(ab)) return ab as Buffer;
  if (ab instanceof ArrayBuffer) return Buffer.from(new Uint8Array(ab));
  if (ArrayBuffer.isView && ArrayBuffer.isView(ab)) return Buffer.from(ab as any);
  return Buffer.from(String(ab));
}

function normalizeRawId(rawId: any): string {
  if (!rawId && rawId !== 0) return '';
  if (typeof rawId === 'string') return String(rawId);
  // handle node Buffer or browser Uint8Array / ArrayBuffer or object { type: 'Buffer', data: [...] }
  if (Buffer.isBuffer(rawId)) return bufferToBase64url(rawId);
  if (rawId && (rawId as any).type === 'Buffer' && Array.isArray((rawId as any).data)) return bufferToBase64url(Buffer.from((rawId as any).data));
  try {
    const buf = arrayBufferToBuffer(rawId);
    return bufferToBase64url(buf);
  } catch (e) {
    return String(rawId);
  }
}

@Injectable()
export class WebauthnService {
  // store challenges per user login
  private challengesByLogin = new Map<string, string>();
  // also keep anonymous challenges (login omitted) stored as a set of challenge strings
  private anonChallenges = new Set<string>();

  constructor(
    private readonly profilesService: ProfilesService,
    @InjectRepository(WebauthnCredentialEntity) private credRepo: Repository<WebauthnCredentialEntity>,
  ) {}

  private async bufferFromPublicKey(pk: any): Promise<Buffer> {
    if (!pk) return Buffer.alloc(0);
    if (Buffer.isBuffer(pk)) return pk;
    if (pk && (pk as any).type === 'Buffer' && Array.isArray((pk as any).data)) return Buffer.from((pk as any).data);
    if (pk instanceof ArrayBuffer) return Buffer.from(new Uint8Array(pk as any));
    if (typeof pk === 'string') return Buffer.from(pk, 'base64');
    try {
      return Buffer.from(JSON.stringify(pk));
    } catch (e) {
      return Buffer.alloc(0);
    }
  }

  async generateRegisterOptions(login: string) {
    const user = await this.profilesService.findByLogin(login);
    if (!user) return null;
    const userId = toBase64url(String(user.id));
    const opts = generateRegistrationOptions({
      rpName: 'FindSkills',
      rpID: 'localhost',
      userID: userId,
      userName: user.login,
      attestationType: 'indirect',
      authenticatorSelection: {
        userVerification: 'preferred',
      },
    });
    this.challengesByLogin.set(login, opts.challenge);
    return opts;
  }

  async verifyRegister(login: string, body: any) {
    const expectedChallenge = this.challengesByLogin.get(login);
    if (!expectedChallenge) throw new Error('No challenge found for user');
    let verification: any;
    try {
      // log attestation summary to help debugging
      // eslint-disable-next-line no-console
      console.log('webauthn.verifyRegister: attestation summary', {
        login,
        rawIdType: typeof body?.rawId,
        // rawId may be a Buffer/ArrayBuffer - length may be on different property
        rawIdLength:
          body?.rawId && (body.rawId.length ?? body.rawId.byteLength ?? null)
            ? (body.rawId.length ?? body.rawId.byteLength ?? null)
            : null,
        hasResponse: !!body?.response,
      });
      verification = await verifyRegistrationResponse({
        credential: body,
        expectedChallenge,
        expectedOrigin: ['http://localhost:4200', 'https://localhost:4200'],
        expectedRPID: 'localhost',
      });
      // eslint-disable-next-line no-console
      console.log('webauthn.verifyRegister: verification result', {
        verified: !!verification?.verified,
        registrationInfoKeys: verification?.registrationInfo ? Object.keys(verification.registrationInfo) : null,
        authenticationInfo: !!verification?.authenticationInfo,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('webauthn.verifyRegister: verifyRegistrationResponse threw', err && (err.stack || err));
      throw err;
    }
    if (verification.verified) {
      try {
        const profileEnt = await this.profilesService.findByLoginRaw(login);
        const pub = await this.bufferFromPublicKey(verification.registrationInfo?.credentialPublicKey);
        const credentialIdStr = normalizeRawId(body.rawId);
        // debug logging about incoming types (helps figure out 500s when saving)
        // eslint-disable-next-line no-console
        console.log('webauthn: saving credential', {
          login,
          credentialIdType: typeof body.rawId,
          credentialIdStrLength: credentialIdStr.length,
          publicKeyBytes: pub.length,
          regCounter: verification.registrationInfo?.counter ?? null,
        });
        const ent = this.credRepo.create({
          profileId: profileEnt ? profileEnt.id : null,
          login,
          credentialId: credentialIdStr,
          publicKey: pub,
          counter: verification.registrationInfo?.counter || 0,
        });
        await this.credRepo.save(ent);
        // eslint-disable-next-line no-console
        console.log('webauthn.verifyRegister: persisted credential id', credentialIdStr);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('webauthn.verifyRegister: failed to persist credential', e && (e.stack || e));
        throw e;
      }
    }
    this.challengesByLogin.delete(login);
    return verification;
  }

  generateLoginOptions(login?: string) {
    // note: generateAuthenticationOptions can accept credential IDs as strings
    if (login) {
      // fetch credentials from DB
      return (async () => {
        const creds = await this.credRepo.find({ where: { login } });
        const opts = generateAuthenticationOptions({
          allowCredentials: creds.map((c) => ({ id: c.credentialId, type: 'public-key' })),
          userVerification: 'preferred',
        });
        this.challengesByLogin.set(login, opts.challenge);
        return opts;
      })();
    }
    // no login provided: allow discoverable credentials by omitting allowCredentials
    const opts = generateAuthenticationOptions({ userVerification: 'preferred' });
    this.anonChallenges.add(opts.challenge);
    return opts;
  }

  // verifyLogin: if `login` provided, verify against that user's credentials; if `login` is falsy,
  // attempt to verify against any known credential (allows login without entering a username).
  async verifyLogin(login: string | undefined, body: any) {
    // helper to attempt verification with given expectedChallenge and stored credential
    const tryVerify = async (expectedChallenge: string, stored: WebauthnCredentialEntity) => {
      try {
        const verification = await verifyAuthenticationResponse({
          credential: body,
          expectedChallenge,
          expectedOrigin: ['http://localhost:4200', 'https://localhost:4200'],
          expectedRPID: 'localhost',
          authenticator: {
            credentialID: stored.credentialId,
            credentialPublicKey: stored.publicKey,
            counter: stored.counter || 0,
          },
        });
        return verification;
      } catch (e) {
        return null;
      }
    };

    if (login) {
      const expectedChallenge = this.challengesByLogin.get(login);
      if (!expectedChallenge) throw new Error('No challenge found for user');
      const requestedId = normalizeRawId(body.rawId);
      const stored = await this.credRepo.findOne({ where: { login, credentialId: requestedId } });
      if (!stored) throw new Error('Unknown credential');
      const verification = await tryVerify(expectedChallenge, stored);
      if (!verification) throw new Error('Verification failed');
      if (verification.verified) {
        stored.counter = verification.authenticationInfo?.newCounter ?? stored.counter;
        await this.credRepo.save(stored);
      }
      this.challengesByLogin.delete(login);
      return { verification, login };
    }

    // login omitted: find matching credentials by rawId and try against stored challenges and anonymous challenges
    const requestedId = normalizeRawId(body.rawId);
    const storedCandidates = await this.credRepo.find({ where: { credentialId: requestedId } });
    const candidates: Array<{ challenge: string; loginOwner: string; stored: WebauthnCredentialEntity }> = [];
    for (const s of storedCandidates) {
      const ch = this.challengesByLogin.get(s.login);
      if (ch) candidates.push({ challenge: ch, loginOwner: s.login, stored: s });
    }
    if (this.anonChallenges.size > 0) {
      for (const ch of this.anonChallenges) {
        for (const s of storedCandidates) {
          candidates.push({ challenge: ch, loginOwner: s.login, stored: s });
        }
      }
    }

    for (const cand of candidates) {
      const verification = await tryVerify(cand.challenge, cand.stored);
      if (verification && verification.verified) {
        cand.stored.counter = verification.authenticationInfo?.newCounter ?? cand.stored.counter;
        await this.credRepo.save(cand.stored);
        this.challengesByLogin.delete(cand.loginOwner);
        this.anonChallenges.delete(cand.challenge);
        return { verification, login: cand.loginOwner };
      }
    }

    throw new Error('Verification failed or unknown credential');
  }
}

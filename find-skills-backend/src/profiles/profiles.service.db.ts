import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileEntity } from '../entities/profile.entity';

export type SchoolType = 'primary' | 'secondary' | 'university';

export interface Profile {
  id: number;
  login: string;
  schoolType: SchoolType | undefined;
  schoolClass: number | undefined;
  city: string | undefined;
  favoriteSubjects?: string;
  bio?: string;
}

@Injectable()
export class ProfilesService {
  constructor(@InjectRepository(ProfileEntity) private repo: Repository<ProfileEntity>) {}

  private async ensureSeed() {
    const count = await this.repo.count();
    if (count > 0) return;
    const samples: Partial<ProfileEntity>[] = [
      {
        login: 'janek',
        schoolType: 'secondary',
        city: 'Warszawa',
        favoriteSubjects: 'angular,typescript,html,css',
        bio: 'Fullstack enthusiast. Loves Angular and clean code.',
          schoolClass: 3,
        passwordHash: bcrypt.hashSync('password123', 8),
      },
      {
        login: 'asia',
        schoolType: 'university',
        city: 'Krakow',
        favoriteSubjects: 'python,machine learning,data science',
        bio: 'Interested in data and ML.',
          schoolClass: 1,
        passwordHash: bcrypt.hashSync('asiaspass', 8),
      },
      {
        login: 'marek',
        schoolType: 'secondary',
        city: 'Gdansk',
        favoriteSubjects: 'java,spring,sql',
        bio: 'Backend dev, likes Java and databases.',
          schoolClass: 2,
        passwordHash: bcrypt.hashSync('marekpw', 8),
      },
      {
        login: 'ola',
        schoolType: 'secondary',
        city: 'Poznan',
        favoriteSubjects: 'html,css,design',
        bio: 'Interested in UI/UX and frontend.',
          schoolClass: null,
        passwordHash: bcrypt.hashSync('olapass123', 8),
      },
    ];
    for (const s of samples) {
      const ent = this.repo.create(s as ProfileEntity);
      await this.repo.save(ent);
    }
  }

  private toPublicEntity(u: ProfileEntity): Profile {
    const pub: any = {
      id: u.id,
      login: u.login,
      schoolType: (u.schoolType as any) ?? undefined,
      city: (u.city as any) ?? undefined,
      schoolClass: u.schoolClass ?? undefined as number | undefined,
      favoriteSubjects: u.favoriteSubjects ?? undefined,
      bio: u.bio ?? undefined,
    };
    // legacy: if schoolClass is already set keep it, otherwise nothing to do
    if (pub.login && typeof pub.login === 'string') {
      pub.login = pub.login
        .split(' ')
        .map((s: string) => (s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s))
        .join(' ');
    }
    return pub;
  }

  async findAll(): Promise<Profile[]> {
    await this.ensureSeed();
    const all = await this.repo.find();
    return all.map((u) => this.toPublicEntity(u));
  }

  async findOne(id: number): Promise<Profile | undefined> {
    await this.ensureSeed();
    const u = await this.repo.findOne({ where: { id } });
    return u ? this.toPublicEntity(u) : undefined;
  }

  async findByLoginRaw(login: string): Promise<ProfileEntity | null> {
    return this.repo.findOne({ where: { login } });
  }

  async findByLogin(login: string): Promise<Profile | undefined> {
    const u = await this.repo.findOne({ where: { login } });
    return u ? this.toPublicEntity(u) : undefined;
  }

  async create(dto: any): Promise<Profile> {
    await this.ensureSeed();
    if (!dto.login) throw new BadRequestException('login is required');
    if (!dto.password) throw new BadRequestException('password is required');
    if (dto.password.length < 8) throw new BadRequestException('password must be at least 8 characters long');
    const existing = await this.repo.findOne({ where: { login: dto.login } });
    if (existing) throw new ConflictException('login already exists');

    const incomingClass = dto.schoolClass !== undefined ? Number(dto.schoolClass) : undefined;
    this.validateClassRange({ schoolType: dto.schoolType, value: incomingClass });

    const ent = this.repo.create();
    ent.login = dto.login;
    ent.schoolType = dto.schoolType ?? null;
    ent.city = dto.city ?? null;
    ent.favoriteSubjects = dto.favoriteSubjects ? String(dto.favoriteSubjects).toLowerCase() : null;
    ent.bio = dto.bio ?? null;
    ent.schoolClass = incomingClass ?? null;
    ent.passwordHash = bcrypt.hashSync(dto.password, 8);

    const saved = await this.repo.save(ent);
    return this.toPublicEntity(saved);
  }

  async update(id: number, patch: any): Promise<Profile | undefined> {
    await this.ensureSeed();
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return undefined;

    if (patch.login && patch.login !== existing.login) {
      const other = await this.repo.findOne({ where: { login: patch.login } });
      if (other && other.id !== id) throw new ConflictException('login already exists');
    }

    if (patch.password !== undefined) {
      if (!patch.password) throw new BadRequestException('password is required');
      if (patch.password.length < 8) throw new BadRequestException('password must be at least 8 characters long');
      existing.passwordHash = bcrypt.hashSync(patch.password, 8);
    }

    const allowed = ['login', 'schoolType', 'city', 'favoriteSubjects', 'bio'];
    for (const key of allowed) {
      if (patch[key] !== undefined) {
        if (key === 'favoriteSubjects' && patch[key] !== undefined && patch[key] !== null) {
          (existing as any)[key] = String(patch[key]).toLowerCase();
        } else {
          (existing as any)[key] = patch[key];
        }
      }
    }

    if (patch.schoolClass !== undefined) {
      const v = Number(patch.schoolClass);
      existing.schoolClass = isNaN(v) ? null : v;
    }

    const resultingSchoolType = patch.schoolType ?? existing.schoolType;
    const resultingValue = existing.schoolClass === null ? undefined : existing.schoolClass;
    this.validateClassRange({ schoolType: resultingSchoolType as any, value: resultingValue });

    const saved = await this.repo.save(existing);
    return this.toPublicEntity(saved);
  }

  async search(input: { skills?: string; login?: string; schoolType?: string; minSchoolClass?: number; maxSchoolClass?: number; city?: string; limit?: number; maxId?: number }): Promise<Profile[]> {
    await this.ensureSeed();
    let all = await this.repo.find();
    if (input.maxId !== undefined) {
      all = all.filter((p) => p.id < input.maxId!);
    }
    if (input.skills) {
      const tokens = this.tokenizeSearch(input.skills);
      if (tokens.length) {
        all = all.filter((p) => {
          const fav = (p.favoriteSubjects || '').toLowerCase();
          const bio = (p.bio || '').toLowerCase();
          return tokens.some((tok) => fav.includes(tok) || bio.includes(tok));
        });
      }
    }
    if (input.login) {
      const l = input.login.trim().toLowerCase();
      if (l) all = all.filter((p) => p.login.toLowerCase().includes(l));
    }
    if (input.schoolType) {
      all = all.filter((p) => p.schoolType === input.schoolType);
    }
    if (input.minSchoolClass !== undefined) {
      const m = input.minSchoolClass;
      all = all.filter((p) => {
        const sc = (p as any).schoolClass;
        if (sc === null || sc === undefined) return true;
        return sc >= m!;
      });
    }
    if (input.maxSchoolClass !== undefined) {
      const m = input.maxSchoolClass;
      all = all.filter((p) => {
        const sc = (p as any).schoolClass;
        if (sc === null || sc === undefined) return true;
        return sc <= m!;
      });
    }
    if (input.city) {
      const c = input.city.trim().toLowerCase();
      if (c) all = all.filter((p) => (p.city || '').toLowerCase().includes(c));
    }
    all = all.sort((a, b) => b.id - a.id);
    if (input.limit === undefined) return all.map((u) => this.toPublicEntity(u));
    if (!Number.isFinite(input.limit!) || input.limit! <= 0) return all.map((u) => this.toPublicEntity(u));
    return all.slice(0, input.limit).map((u) => this.toPublicEntity(u));
  }

  async validatePassword(login: string, password: string): Promise<boolean> {
    const u = await this.repo.findOne({ where: { login }, select: ['id', 'login', 'passwordHash'] as any });
    if (!u || !u.passwordHash) return false;
    return bcrypt.compareSync(password, u.passwordHash);
  }

  async searchByText(skills?: string): Promise<Profile[]> {
    if (!skills) return this.findAll();
    const tokens = this.tokenizeSearch(skills);
    if (!tokens.length) return this.findAll();
    const all = await this.repo.find();
    return all
      .filter((p) => {
        const fav = (p.favoriteSubjects || '').toLowerCase();
        const bio = (p.bio || '').toLowerCase();
        return tokens.some((tok) => fav.includes(tok) || bio.includes(tok));
      })
      .map((u) => this.toPublicEntity(u));
  }

  private tokenizeSearch(input: string): string[] {
    if (!input) return [];
    const cleaned = input.replace(/[^^\p{L}\p{N}\+#]+/gu, ' ').toLowerCase().trim();
    if (!cleaned) return [];
    return cleaned.split(/\s+/).filter(Boolean);
  }

  private validateClassRange(input: { schoolType?: any; value?: number | undefined }) {
    const { schoolType, value } = input;
    if (!schoolType) return;
    const ranges: Record<string, [number, number]> = {
      primary: [1, 8],
      secondary: [1, 5],
      university: [1, 6],
    };
    const [low, high] = ranges[schoolType];
    if (value !== undefined && value !== null) {
      if (!Number.isFinite(value) || value < low || value > high) {
        throw new BadRequestException(`schoolClass for type ${schoolType} must be between ${low} and ${high}`);
      }
    }
  }
}

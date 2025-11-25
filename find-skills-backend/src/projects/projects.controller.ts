import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import type { Project, SchoolType } from './projects.service';
import { ProfilesService } from '../profiles/profiles.service';
import type { Request } from 'express';

class CreateProjectDto {
  name!: string;
  remote!: boolean;
  subject!: string;
  description!: string;
  type!: 'project' | 'competition';

  schoolType?: 'primary' | 'secondary' | 'university';
  schoolClass?: number;
  city?: string;
  beginDate?: string;
  endDate?: string;
  minPeople?: number;
  maxPeople?: number;
}

class UpdateProjectDto {
  name?: string;
  remote?: boolean;
  subject?: string;
  description?: string;
  type?: 'project' | 'competition';

  schoolType?: 'primary' | 'secondary' | 'university';
  schoolClass?: number;
  city?: string;
  beginDate?: string;
  endDate?: string;
  minPeople?: number;
  maxPeople?: number;
  currentPeople?: number;
}

@Controller('api/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly profilesService: ProfilesService,
  ) {}

  @Get()
  async getAll(
    @Query('type') type?: 'project' | 'competition',
    @Query('limit') limit?: string,
    @Query('maxId') maxId?: string,
    @Query('q') q?: string,
    @Query('subject') subject?: string,
    @Query('city') city?: string,
    @Query('schoolType') schoolType?: SchoolType,
    @Query('minSchoolClass') minSchoolClass?: string,
    @Query('maxSchoolClass') maxSchoolClass?: string,
    @Query('remote') remote?: 'all' | 'remote' | 'onsite',
    @Query('authorId') authorId?: string,
  ): Promise<Project[]> {
    let all = await this.projectsService.findAll(type);

    // filter by maxId for pagination (id < maxId)
    if (maxId) {
      const m = parseInt(maxId, 10);
      if (!isNaN(m)) {
        all = all.filter((p) => p.id < m);
      }
    }

    // filter by authorId if provided
    if (authorId) {
      const a = parseInt(authorId, 10);
      if (!isNaN(a)) all = all.filter((p) => p.authorId === a);
    }

    // text search on name + description
    if (q) {
      const t = q.trim().toLowerCase();
      if (t) {
        all = all.filter((p) => (p.name + ' ' + p.description).toLowerCase().includes(t));
      }
    }

    // subject filter (contains)
    if (subject) {
      const s = subject.trim().toLowerCase();
      if (s) all = all.filter((p) => p.subject.toLowerCase().includes(s));
    }

    // schoolType filter (exact match)
    if (schoolType) {
      all = all.filter((p) => p.schoolType === schoolType);
    }

    // school class filters: project matches if its single schoolClass lies within query range
    if (minSchoolClass) {
      const m = parseInt(minSchoolClass, 10);
      if (!isNaN(m)) {
        all = all.filter((p) => p.schoolClass === undefined || p.schoolClass === null || p.schoolClass >= m);
      }
    }
    if (maxSchoolClass) {
      const m = parseInt(maxSchoolClass, 10);
      if (!isNaN(m)) {
        all = all.filter((p) => p.schoolClass === undefined || p.schoolClass === null || p.schoolClass <= m);
      }
    }

    // city filter (contains) BUT if the project is remote we still include it
    if (city) {
      const c = city.trim().toLowerCase();
      if (c) all = all.filter((p) => p.remote === true || (p.city || '').toLowerCase().includes(c));
    }

    // remote filter
    if (remote && remote !== 'all') {
      if (remote === 'remote') all = all.filter((p) => p.remote === true);
      if (remote === 'onsite') all = all.filter((p) => p.remote === false);
    }

    // filter out expired projects (those with endDate earlier than now) for general listing
    // if an authorId filter was specified, keep expired items (author view should see their own posts)
    if (!authorId) {
      const now = Date.now();
      all = all.filter((p) => !p.endDate || (new Date(p.endDate).getTime() >= now));
    }

    // sort by id descending (highest id first)
    all = all.sort((a, b) => b.id - a.id);

    if (!limit) return all;
    const n = parseInt(limit, 10);
    if (isNaN(n) || n <= 0) return all;
    return all.slice(0, n);
  }

  @Get('author/:authorId')
  getByAuthor(@Param('authorId') authorId: string, @Query('limit') limit?: string, @Query('maxId') maxId?: string): Promise<Project[]> {
    // reuse getAll but ensure authorId is passed into the correct parameter slot
    // signature: type, limit, maxId, q, subject, city, schoolType, schoolClass, remote, authorId
    return this.getAll(undefined, limit, maxId, undefined, undefined, undefined, undefined, undefined, undefined, undefined, authorId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Project | { error: string }> {
    const p = await this.projectsService.findOne(Number(id));
    if (!p) return { error: 'Not found' };
    return p;
  }

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateProjectDto): Promise<Project> {
    // get session from cookie and resolve author
    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') throw new UnauthorizedException();
    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') throw new UnauthorizedException();
    let login: string;
    try {
      login = Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      throw new UnauthorizedException();
    }
    const user = await this.profilesService.findByLogin(login);
    if (!user) throw new UnauthorizedException();

    const parsed = {
      ...dto,
      beginDate: dto.beginDate ? new Date(dto.beginDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      authorId: user.id,
    } as any;

    return await this.projectsService.create(parsed);
  }

  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const existing = await this.projectsService.findOne(Number(id));
    if (!existing) return { error: 'Not found' };

    // authorize: only author can edit
    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') throw new UnauthorizedException();
    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') throw new UnauthorizedException();
    let login: string;
    try {
      login = Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      throw new UnauthorizedException();
    }
    const user = await this.profilesService.findByLogin(login);
    if (!user) throw new UnauthorizedException();
    if (existing.authorId !== user.id) throw new ForbiddenException();

    const incoming: any = { ...dto } as any;

    // jeśli schoolClass jest pominięte/undefined, explicite ustaw null (czyści klasę w bazie)
    if (!('schoolClass' in incoming) || incoming.schoolClass === undefined) {
      incoming.schoolClass = null;
    }

    const patch = {
      ...incoming,
      beginDate: incoming.beginDate ? new Date(incoming.beginDate) : undefined,
      endDate: incoming.endDate ? new Date(incoming.endDate) : undefined,
    } as any;
    const updated = await this.projectsService.update(Number(id), patch);
    if (!updated) return { error: 'Not found' };
    return updated;
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const existing = await this.projectsService.findOne(Number(id));
    if (!existing) return { ok: false };

    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') throw new UnauthorizedException();
    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') throw new UnauthorizedException();
    let login: string;
    try {
      login = Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      throw new UnauthorizedException();
    }
    const user = await this.profilesService.findByLogin(login);
    if (!user) throw new UnauthorizedException();
    if (existing.authorId !== user.id) throw new ForbiddenException();

    const ok = await this.projectsService.remove(Number(id));
    return { ok };
  }

  @Post(':id/join')
  async join(@Param('id') id: string) {
    const ok = await this.projectsService.addParticipant(Number(id));
    return { ok };
  }

  @Post(':id/leave')
  async leave(@Param('id') id: string) {
    const ok = await this.projectsService.removeParticipant(Number(id));
    return { ok };
  }

  // Comments endpoints
  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    const comments = await this.projectsService.getComments(Number(id));
    if (comments === undefined) return { error: 'Not found' };
    // enrich comments with authorLogin so frontend can display author names without extra requests
    return await Promise.all(
      comments.map(async (c) => {
        const author = await this.profilesService.findOne(c.authorId);
        return { ...c, authorLogin: author ? author.login : `user:${c.authorId}` };
      }),
    );
  }

  @Post(':id/comments')
  async postComment(@Param('id') id: string, @Req() req: Request, @Body() body: { content?: string; parentId?: number }) {
    const sess = (req.cookies as any)?.session;
    if (!sess || typeof sess !== 'string') throw new UnauthorizedException();
    const parts = sess.split(':');
    if (parts.length < 3 || parts[0] !== 'sess') throw new UnauthorizedException();
    let login: string;
    try {
      login = Buffer.from(parts[1], 'base64').toString();
    } catch (e) {
      throw new UnauthorizedException();
    }
    const user = await this.profilesService.findByLogin(login);
    if (!user) throw new UnauthorizedException();
    if (!body?.content || !body.content.trim()) return { error: 'invalid' };
    const parentId = body.parentId;
    // If parentId provided, ensure it exists and belongs to same project
    if (parentId !== undefined) {
      const comments = await this.projectsService.getComments(Number(id));
      if (!comments || !comments.find((c) => c.id === parentId)) return { error: 'parent not found' };
    }
    const created = await this.projectsService.addComment(Number(id), user.id, String(body.content).trim(), parentId);
    if (!created) return { error: 'Not found' };
    // include authorLogin in response for convenience
    const author = await this.profilesService.findOne(created.authorId);
    return { ...created, authorLogin: author ? author.login : `user:${created.authorId}` };
  }
}

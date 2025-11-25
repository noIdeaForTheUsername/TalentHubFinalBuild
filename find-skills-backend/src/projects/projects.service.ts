import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { CommentEntity } from '../entities/comment.entity';
import type { Profile } from '../profiles/profiles.service';
import { ProfilesService } from '../profiles/profiles.service';

export type SchoolType = 'primary' | 'secondary' | 'university';

export interface Project {
  id: number;
  name: string;
  remote: boolean;
  subject: string;
  description: string;
  type: 'project' | 'competition';
  authorId: number | null;
  link: string | undefined;
  comments: any[];
  schoolType: SchoolType | undefined;
  schoolClass: number | undefined;
  city: string | undefined;
  beginDate: Date | undefined;
  endDate: Date | undefined;
  minPeople: number | undefined;
  maxPeople: number | undefined;
  currentPeople: number | undefined;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity) private projectsRepo: Repository<ProjectEntity>,
    @InjectRepository(CommentEntity) private commentsRepo: Repository<CommentEntity>,
    private readonly profilesService: ProfilesService,
  ) {}

  private toPublic(p: ProjectEntity): Project {
    return {
      id: p.id,
      name: p.name,
      remote: Boolean(p.remote),
      subject: p.subject,
      description: p.description ?? '',
      type: p.type as any,
      authorId: p.authorId,
      link: p.link ?? undefined,
      comments: [],
      schoolType: (p.schoolType as any) ?? undefined,
      schoolClass: p.schoolClass === null ? undefined : p.schoolClass,
      city: p.city ?? undefined,
      beginDate: p.beginDate ?? undefined,
      endDate: p.endDate ?? undefined,
      minPeople: p.minPeople === null ? undefined : p.minPeople,
      maxPeople: p.maxPeople === null ? undefined : p.maxPeople,
      currentPeople: p.currentPeople === null ? undefined : p.currentPeople,
    };
  }

  async findAll(type?: 'project' | 'competition') {
    const q = type ? { where: { type } } : {};
    const rows = await this.projectsRepo.find(q as any);
    return rows.map((r) => this.toPublic(r));
  }

  async findOne(id: number) {
    const p = await this.projectsRepo.findOne({ where: { id } });
    return p ? this.toPublic(p) : undefined;
  }

  async create(dto: any) {
    if (dto.schoolType && dto.schoolClass != null) {
      this.validateClassValue({ schoolType: dto.schoolType, value: dto.schoolClass });
    }
    const ent = this.projectsRepo.create();
    ent.name = dto.name;
    ent.remote = !!dto.remote;
    ent.subject = dto.subject;
    ent.description = dto.description ?? null;
    ent.type = dto.type ?? 'project';
    ent.authorId = dto.authorId;
    ent.link = dto.link ?? null;
    ent.schoolType = dto.schoolType ?? null;
    ent.schoolClass = dto.schoolClass ?? null;
    ent.city = dto.city ?? null;
    ent.beginDate = dto.beginDate ?? null;
    ent.endDate = dto.endDate ?? null;
    ent.minPeople = dto.minPeople ?? null;
    ent.maxPeople = dto.maxPeople ?? null;
    ent.currentPeople = dto.currentPeople ?? 0;
    const saved = await this.projectsRepo.save(ent);
    return this.toPublic(saved);
  }

  async update(id: number, patch: Partial<Project>) {
    const existing = await this.projectsRepo.findOne({ where: { id } });
    if (!existing) return undefined;
    const updated = { ...existing, ...patch } as any;
    if (updated.schoolType && updated.schoolClass != null) {
      this.validateClassValue({ schoolType: updated.schoolType, value: updated.schoolClass });
    }
    await this.projectsRepo.update(id, updated as any);
    const fresh = await this.projectsRepo.findOne({ where: { id } });
    return fresh ? this.toPublic(fresh) : undefined;
  }

  async getComments(projectId: number) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) return undefined;
    const comments = await this.commentsRepo.find({ where: { projectId } });
    // sort ascending by timestamp
    comments.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return comments.map((c) => ({ id: c.id, authorId: c.authorId, content: c.content, timestamp: c.timestamp.toISOString(), parentId: c.parentId }));
  }

  async addComment(projectId: number, authorId: number, content: string, parentId?: number) {
    const project = await this.projectsRepo.findOne({ where: { id: projectId } });
    if (!project) return undefined;
    if (parentId !== undefined && parentId !== null) {
      const parent = await this.commentsRepo.findOne({ where: { id: parentId } });
      if (!parent || parent.projectId !== projectId) return undefined;
    }
    const c = this.commentsRepo.create();
    c.projectId = projectId;
    c.authorId = authorId;
    c.content = content;
    c.parentId = parentId ?? null;
    c.timestamp = new Date();
    const saved = await this.commentsRepo.save(c);
    return { id: saved.id, authorId: saved.authorId, content: saved.content, timestamp: saved.timestamp.toISOString(), parentId: saved.parentId };
  }

  async remove(id: number) {
    const res = await this.projectsRepo.delete({ id } as any);
    return res.affected && res.affected > 0;
  }

  async addParticipant(id: number) {
    const p = await this.projectsRepo.findOne({ where: { id } });
    if (!p) return false;
    if (p.maxPeople !== null && p.maxPeople !== undefined && p.currentPeople !== null && p.currentPeople !== undefined && p.currentPeople >= p.maxPeople) return false;
    p.currentPeople = (p.currentPeople || 0) + 1;
    await this.projectsRepo.save(p);
    return true;
  }

  async removeParticipant(id: number) {
    const p = await this.projectsRepo.findOne({ where: { id } });
    if (!p || !p.currentPeople) return false;
    p.currentPeople = Math.max(0, (p.currentPeople || 0) - 1);
    await this.projectsRepo.save(p);
    return true;
  }

  private validateClassValue(input: { schoolType: SchoolType; value?: number | undefined }) {
    const { schoolType, value } = input;
    const ranges: Record<SchoolType, [number, number]> = {
      primary: [1, 8],
      secondary: [1, 5],
      university: [1, 6],
    };
    const [low, high] = ranges[schoolType];
    if (value !== undefined) {
      if (!Number.isFinite(value) || value < low || value > high) {
        throw new BadRequestException(`schoolClass for type ${schoolType} must be between ${low} and ${high}`);
      }
    }
  }
}

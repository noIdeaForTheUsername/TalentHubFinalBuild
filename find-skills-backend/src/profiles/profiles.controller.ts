import { Body, Controller, Get, Param, Post, Query, Put, NotFoundException, Res } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import type { Profile, SchoolType } from './profiles.service';
import type { Response } from 'express';

class CreateProfileDto {
  login!: string;
  password!: string;
  schoolType?: SchoolType;
  // legacy fields allowed
  schoolClass?: number;
  city?: string;
  favoriteSubjects?: string;
  bio?: string;
}

class UpdateProfileDto {
  login?: string;
  password?: string;
  schoolType?: SchoolType;
  schoolClass?: number;
  city?: string;
  favoriteSubjects?: string;
  bio?: string;
}

@Controller('api/profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  async getAll(
    @Query('skills') skills?: string,
    @Query('login') login?: string,
    @Query('schoolType') schoolType?: SchoolType,
    @Query('minSchoolClass') minSchoolClass?: string,
    @Query('maxSchoolClass') maxSchoolClass?: string,
    @Query('city') city?: string,
    @Query('limit') limit?: string,
    @Query('maxId') maxId?: string,
  ): Promise<Profile[]> {
    const parsed: {
      skills?: string;
      login?: string;
      schoolType?: SchoolType;
      minSchoolClass?: number;
      maxSchoolClass?: number;
      city?: string;
      limit?: number;
      maxId?: number;
    } = {};

    if (skills) parsed.skills = skills;
    if (login) parsed.login = login;
    if (schoolType) parsed.schoolType = schoolType;
    if (minSchoolClass) {
      const m = parseInt(minSchoolClass, 10);
      if (!isNaN(m)) parsed.minSchoolClass = m;
    }
    if (maxSchoolClass) {
      const m = parseInt(maxSchoolClass, 10);
      if (!isNaN(m)) parsed.maxSchoolClass = m;
    }
    if (city) parsed.city = city;
    if (limit) {
      const n = parseInt(limit, 10);
      if (!isNaN(n) && n > 0) parsed.limit = n;
    }
    if (maxId) {
      const n = parseInt(maxId, 10);
      if (!isNaN(n)) parsed.maxId = n;
    }

    return await this.profilesService.search(parsed);
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Profile> {
    const p = await this.profilesService.findOne(Number(id));
    if (!p) throw new NotFoundException('Profile not found');
    return p;
  }

  @Post()
  async create(@Body() dto: CreateProfileDto, @Res({ passthrough: true }) res: Response) {
    const created = await this.profilesService.create(dto as any);
    // set same session cookie as login
    const sessionValue = `sess:${Buffer.from(created.login).toString('base64')}:${Date.now()}`;
    res.cookie('session', sessionValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.USE_HTTPS === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return created;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProfileDto) {
    const updated = await this.profilesService.update(Number(id), dto as any);
    if (!updated) throw new NotFoundException('Profile not found');
    return updated;
  }
}

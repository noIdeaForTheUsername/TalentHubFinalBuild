// Shim: re-export the DB-backed implementation so existing imports continue to work.
export { ProfilesService } from './profiles.service.db';
export type { Profile, SchoolType } from './profiles.service.db';


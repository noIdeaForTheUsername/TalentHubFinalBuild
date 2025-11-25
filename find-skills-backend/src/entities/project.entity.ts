import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ProfileEntity } from './profile.entity';
import { CommentEntity } from './comment.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  remote!: boolean;

  @Column({ type: 'varchar', length: 128 })
  subject!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 32 })
  type!: string; // 'project' | 'competition'

  @Column({ type: 'int', nullable: true, default: null })
  authorId!: number | null;

  @ManyToOne(() => ProfileEntity, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author?: ProfileEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  link!: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  schoolType!: string | null;

  @Column({ type: 'int', nullable: true })
  schoolClass!: number | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  city!: string | null;

  @Column({ type: 'datetime', nullable: true })
  beginDate!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'int', nullable: true })
  minPeople!: number | null;

  @Column({ type: 'int', nullable: true })
  maxPeople!: number | null;

  @Column({ type: 'int', nullable: true })
  currentPeople!: number | null;

  @OneToMany(() => CommentEntity, (c) => c.project)
  comments?: CommentEntity[];
}

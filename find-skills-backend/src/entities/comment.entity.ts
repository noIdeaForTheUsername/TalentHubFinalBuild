import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  projectId!: number;

  @ManyToOne(() => ProjectEntity, (p) => p.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @Column({ type: 'int' })
  authorId!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'datetime' })
  timestamp!: Date;

  @Column({ type: 'int', nullable: true })
  parentId!: number | null;
}

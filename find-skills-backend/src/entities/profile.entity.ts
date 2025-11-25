import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  login!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  schoolType!: string | null;

  @Column({ type: 'int', nullable: true })
  schoolClass!: number | null;

  @Column({ type: 'text', nullable: true })
  favoriteSubjects!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string | null;
}

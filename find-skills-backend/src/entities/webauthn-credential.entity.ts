import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('webauthn_credentials')
export class WebauthnCredentialEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  profileId!: number | null;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  login!: string;

  @Index({ unique: true })
  @Column({ name: 'credential_id', type: 'varchar', length: 512 })
  credentialId!: string;

  @Column({ name: 'public_key', type: 'longblob' })
  publicKey!: Buffer;

  @Column({ type: 'int', default: 0 })
  counter!: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}

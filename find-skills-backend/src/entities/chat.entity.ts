import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MessageEntity } from './message.entity';

@Entity('chats')
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  participantA!: number;

  @Column({ type: 'int' })
  participantB!: number;

  @OneToMany(() => MessageEntity, (m) => m.chat)
  messages?: MessageEntity[];
}

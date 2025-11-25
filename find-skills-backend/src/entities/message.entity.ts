import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ChatEntity } from './chat.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  chatId!: number;

  @ManyToOne(() => ChatEntity, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chatId' })
  chat!: ChatEntity;

  @Column({ type: 'int' })
  senderId!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'datetime' })
  timestamp!: Date;
}

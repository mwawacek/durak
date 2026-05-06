import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'players' })
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 64, unique: true })
  name!: string;

  @Column({ default: 0 })
  gamesPlayed!: number;

  @Column({ default: 0 })
  gamesWon!: number;

  @Column({ default: 0 })
  timesDurak!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

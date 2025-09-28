import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HobbiesModule } from './modules/hobbies/hobbies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const databaseUrl = cfg.get<string>('DATABASE_URL');

        if (databaseUrl) {
          
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: true,
            synchronize: true, 
          };
        }
        
        return {
          type: 'postgres',
          host: cfg.get<string>('DB_HOST'),
          port: parseInt(cfg.get<string>('DB_PORT') ?? '5432', 10),
          username: cfg.get<string>('DB_USER') ?? cfg.get<string>('DB_USERNAME'),
          password: cfg.get<string>('DB_PASS') ?? cfg.get<string>('DB_PASSWORD'),
          database: cfg.get<string>('DB_NAME') ?? cfg.get<string>('DB_DATABASE'),
          ssl: { rejectUnauthorized: false },
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    HobbiesModule,
  ],
})
export class AppModule {}

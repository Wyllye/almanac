import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // validação global (deixa como já está aí no teu projeto)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // 🔓 libera o front do Vite (5173) para chamar tua API
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

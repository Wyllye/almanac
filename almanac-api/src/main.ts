// almanac-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  
  app.enableCors({
    origin: [
      'https://wyllye.github.io',
      'https://wyllye.github.io/almanac',
      
    ],
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: false,
  });

  
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  
  console.log(`✅ API rodando em ${url} (porta ${port})`);
}
bootstrap();

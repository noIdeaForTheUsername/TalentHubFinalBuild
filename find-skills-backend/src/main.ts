import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  // If HTTPS cert/key provided via env, start Nest with HTTPS and mark USE_HTTPS
  const httpsKeyPath = process.env.HTTPS_KEY;
  const httpsCertPath = process.env.HTTPS_CERT;
  let app;
  if (httpsKeyPath && httpsCertPath) {
    const fs = await import('fs');
    const httpsOptions = {
      key: fs.readFileSync(httpsKeyPath),
      cert: fs.readFileSync(httpsCertPath),
    };
    process.env.USE_HTTPS = 'true';
    app = await NestFactory.create(AppModule, { httpsOptions } as any);
  } else {
    process.env.USE_HTTPS = 'false';
    app = await NestFactory.create(AppModule);
  }

  // Parse cookies (so controllers can read req.cookies)
  app.use(cookieParser());
  // Enable CORS so Angular dev server (http://localhost:4200) or https dev server (https://localhost:4200)
  // can send requests with cookies. Allow both http and https localhost origins in dev.
  app.enableCors({ origin: ['http://localhost:4200', 'https://localhost:4200'], credentials: true });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

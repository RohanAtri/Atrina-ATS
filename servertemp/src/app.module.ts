import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PdfModule } from './pdf/pdf.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PdfModule, ConfigModule.forRoot(),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

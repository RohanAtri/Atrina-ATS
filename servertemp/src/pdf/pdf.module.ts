import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { ConfigModule } from '@nestjs/config';
import { PdfService } from './pdf.service';

@Module({
  imports: [ConfigModule],
  controllers: [PdfController],
  providers: [PdfService]
})
export class PdfModule {}

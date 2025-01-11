import { Controller, Post, UploadedFiles, UseInterceptors, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import { Multer } from 'multer';

@Controller('pdf')
export class PdfController {
    constructor(private pdfService: PdfService) {}

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files')) // Use FilesInterceptor for multiple files
    async uploadPdfs(@UploadedFiles() files: Array<Multer.File>) {
        const sessionId = await this.pdfService.processPdfs(files);
        return { sessionId };
    }

    @Post('ask')
    async askQuestion(@Body() body: { question: string; sessionId: string }) {
        const answer = await this.pdfService.askQuestion(body.sessionId, body.question);
        return { answer };
    }
}

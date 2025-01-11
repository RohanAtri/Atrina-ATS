import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfChatService {
  private apiUrl = 'http://localhost:3000'; // Backend NestJS API base URL

  constructor(private http: HttpClient) {}

  uploadPdfs(files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file, index) => formData.append(`files`, file)); // Append all files to formData
    return this.http.post(`${this.apiUrl}/pdf/upload`, formData);
  }

  askQuestion(question: string, sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/pdf/ask`, { question, sessionId });
  }
}

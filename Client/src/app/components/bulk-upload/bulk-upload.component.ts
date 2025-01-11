import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PdfChatService } from 'src/app/services/pdf-chat.service';

@Component({
  selector: 'app-bulk-upload',
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.scss']
})
export class BulkUploadComponent {
  files: File[] = [];
  question: string = '';
  chatHistory: { question: string; answer: string }[] = [];
  sessionId: string = ''; // Received from backend after uploading the PDF
  loading = false;
  candidates:any[] = [];
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('callAPIDialog') callAPIDialog!: TemplateRef<any>;
  constructor(private pdfChatService: PdfChatService, private dialog: MatDialog) { }

  onFilesChange(event: any) {
    this.files = Array.from(event.target.files); // Store all selected files
    this.uploadPdfs()
  }

  // Trigger the file input
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  uploadPdfs() {
    if (this.files.length > 0) {
      this.loading = true;
      this.pdfChatService.uploadPdfs(this.files).subscribe(
        (response: any) => {
          this.sessionId = response.sessionId; // Session ID to maintain context
          this.loading = false;
          alert('PDFs uploaded successfully!');
        },
        (error: any) => {
          this.loading = false;
          alert('Failed to upload PDFs.');
        }
      );
    } else {
      alert('Please select at least one file.');
    }
  }

  askQuestion() {
    if (!this.sessionId) {
      alert('Please upload a PDF first!');
      return;
    }

    if (this.question === '') {
      alert('Please Enter the Question!');
      return;
    }

    this.loading = true;
    this.pdfChatService.askQuestion(this.question, this.sessionId).subscribe(
      (response) => {
        this.chatHistory.push({ question: this.question, answer: response.answer });
        this.question = '';
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        console.error(error);
      }
    );
  }

  dashboard() {
    this.loading = true;
    const prompt = `
    Please analyze the attached document and extract the following details for all candidates listed. Provide the output as an array of JSON objects. If any information is unavailable for a candidate, leave the field empty. The required fields are:

- name: Candidate's full name.
- email: Candidate's email address.
- phone: Candidate's phone number.
- skills: List of the candidate's skills.
- languages: List of languages the candidate is proficient in.
- experience: Calculate the total number of years of experience based on the candidate's job history. Use the start and end dates for each job to determine the duration. If the end date is "present" or not provided, assume the end date is the current year. Round to the nearest whole number.
- atsScore: Calculate the ATS Score for each candidate based on the following parameters:
  1. **Keywords**: Match keywords in the resume with those relevant to the job description, such as technical skills, tools, certifications, and domain-specific terms.
  2. **Work Experience**: Evaluate the relevance of roles, responsibilities, and industries worked in (e.g., progression in responsibilities, matching job titles).
  3. **Achievements and Metrics**: Consider quantifiable achievements, business impact, and project success.
  4. **Skills and Tools**: Evaluate advanced skills, foundational skills, and role-specific tools.
  5. **Certifications and Licenses**: Assess relevance and level of certifications.
  6. **Formatting and Structure**: Penalize non-ATS-friendly formats (e.g., fancy templates, improper headings).
  7. **Education**: Evaluate relevance of qualifications and coursework.
  8. **Soft Skills**: Include teamwork, communication, adaptability, leadership, and mentoring where applicable.
  9. **Tailoring to Job Description**: Assess alignment with the language and requirements of the job posting.
  10. **Contact Information**: Ensure completeness of name, phone, email, and LinkedIn URL.

Return the ATS score as a number between 0 and 100, based on how well the candidate's resume aligns with the above criteria. Weight each parameter equally, and provide a breakdown if needed.

For example, if the document contains:
"Jane Doe worked at ABC Corp from June 2015 to May 2020 and at XYZ Inc from July 2020 to present."
"Skills: Angular, JavaScript, CI/CD, Team Leadership"
"Certifications: AWS Solutions Architect"
The JSON object should include:
{
  "name": "Jane Doe",
  "email": "",
  "phone": "",
  "skills": ["Angular", "JavaScript", "CI/CD", "Team Leadership"],
  "languages": [],
  "experience": 8,
  "atsScore": 85
}

Return the result strictly in the following JSON array format:

[
  {
    "name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "languages": [],
    "experience": 0,
    "atsScore": 0
  },
  {
    "name": "",
    "email": "",
    "phone": "",
    "skills": [],
    "languages": [],
    "experience": 0,
    "atsScore": 0
  }
]

Use only the information provided in the document and ensure all candidate data is included. Focus on accurately calculating both the total experience and the ATS Score.

    `;
    this.pdfChatService.askQuestion(prompt, this.sessionId).subscribe(
      (response) => {
        debugger
        console.log(response)
        this.loading = false;
        let dialogRef = this.dialog.open(this.callAPIDialog, {
          height: '80vh',
          width: '80vw'
        });

        // const cleanedJson = response.answer
        // .replace(/^```json/, '') // Remove starting ```json
        // .replace(/```$/, '')    // Remove ending ```
        // .trim();                // Remove leading/trailing spaces or newlines

      // Parse the cleaned JSON string into an array
      this.candidates = this.cleanAndParseJSON(response.answer);
        console.log(this.candidates);
      },
      (error) => {
        this.loading = false;
        console.error(error);
      }
    );
  }
  cleanAndParseJSON(response: string): any[] {
    try {
      // Locate the first "[" and last "]" to isolate the JSON array
      const startIndex = response.indexOf('[');
      const endIndex = response.lastIndexOf(']');
  
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('No valid JSON array found in the response.');
      }
  
      // Extract the JSON substring
      const jsonString = response.substring(startIndex, endIndex + 1);
  
      // Parse the cleaned JSON string
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return []; // Return an empty array if parsing fails
    }
  }
}

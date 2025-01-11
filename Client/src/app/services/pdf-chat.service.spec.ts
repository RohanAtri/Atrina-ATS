import { TestBed } from '@angular/core/testing';

import { PdfChatService } from './pdf-chat.service';

describe('PdfChatService', () => {
  let service: PdfChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { Injectable } from '@nestjs/common';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import { Multer } from 'multer';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PdfService {
    private vectorStore: MemoryVectorStore;
    private retriever: any;
    private chain: any;
    private model: string;
    private chunkSize: number;
    private chunkOverlap: number;
    private searchType: 'similarity' | 'mmr';
    private kDocuments: number;

    private llm: ChatGoogleGenerativeAI;
    private selectEmbedding: GoogleGenerativeAIEmbeddings;

    private sessionData: { [key: string]: { question: string; answer: any }[] } = {};
    private GOOGLE_API_KEY:any;

    constructor(private readonly configService: ConfigService) {
        this.GOOGLE_API_KEY = this.configService.get<string>('google_api');
        this.model = 'gemini-1.5-pro';
        this.chunkSize = 1000;
        this.chunkOverlap = 0;
        this.searchType = 'similarity';
        this.kDocuments = 5;

        this.initChatModel();
    }

    initChatModel() {
        this.llm = new ChatGoogleGenerativeAI({
            model: this.model,
            temperature: 0,
            apiKey: this.GOOGLE_API_KEY,
        });
    }

    async processPdfs(files: Array<Multer.File>): Promise<string> {
      try {
          const allTexts = [];
  
          for (const file of files) {
              console.log(`Processing file: ${file.originalname}`);
              const fileBlob = new Blob([file.buffer]);
              const pdfLoader = new PDFLoader(fileBlob);
              const documents = await pdfLoader.load();
  
              // Combine all text from a single document into one chunk
              const combinedText = documents.map(doc => doc.pageContent).join('\n');
              allTexts.push({ pageContent: combinedText, metadata: { fileName: file.originalname } });
          }
  
          this.selectEmbedding = new GoogleGenerativeAIEmbeddings({
              model: 'text-embedding-004',
              taskType: TaskType.RETRIEVAL_DOCUMENT,
              apiKey: this.GOOGLE_API_KEY,
          });
  
          console.log('Embedding all documents...');
          this.vectorStore = await MemoryVectorStore.fromDocuments(allTexts, this.selectEmbedding);
  
          this.retriever = this.vectorStore.asRetriever({
              k: this.kDocuments,
              searchType: this.searchType,
          });
  
          console.log('Creating retrieval chain...');
          await this.createChain();
  
          const sessionId = Math.random().toString(36).substr(2, 9);
          this.sessionData[sessionId] = [];
  
          return sessionId;
      } catch (error) {
          console.error('Error processing PDFs:', error);
          throw new Error('Failed to process PDFs');
      }
  }
  

    async createChain() {
        const prompt = ChatPromptTemplate.fromTemplate(
            `Answer the user's question: {input} based on the following context {context}`
        );

        const combineDocsChain = await createStuffDocumentsChain({
            llm: this.llm,
            prompt,
        });

        this.chain = await createRetrievalChain({
            combineDocsChain,
            retriever: this.retriever,
        });
    }

    async askQuestion(sessionId: string, question: string): Promise<string> {
        const answer = await this.chain.invoke({ input: question });

        if (this.sessionData[sessionId]) {
            this.sessionData[sessionId].push({ question, answer: answer.answer });
        }

        return answer.answer;
    }
}

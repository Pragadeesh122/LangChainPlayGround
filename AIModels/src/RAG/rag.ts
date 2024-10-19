import {crawlWebsite} from "./crawler";
import {Document} from "langchain/document";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {MemoryVectorStore} from "langchain/vectorstores/memory";
import {OpenAIEmbeddings} from "@langchain/openai";
import {ChatOpenAI} from "@langchain/openai";
import {pull} from "langchain/hub";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {StringOutputParser} from "@langchain/core/output_parsers";
import {RunnableSequence} from "@langchain/core/runnables";
import {formatDocumentsAsString} from "langchain/util/document";
import dotenv from "dotenv";

dotenv.config();

export async function createEnhancedRAG(startUrl: string) {
  // 1. Crawl the website
  const pageContents = await crawlWebsite(startUrl);

  // 2. Load and split documents
  const docs = pageContents.map(
    (content) => new Document({pageContent: content})
  );
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splits = await splitter.splitDocuments(docs);

  // 3. Create vector store
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splits,
    new OpenAIEmbeddings()
  );

  // 4. Create a retriever
  const retriever = vectorStore.asRetriever({
    k: 6,
    searchType: "similarity",
  });

  // 5. Create the language model
  const llm = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  // 6. Create the RAG prompt
  const ragPrompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  // 7. Create the RAG chain
  const ragChain = RunnableSequence.from([
    {
      context: async (input: {question: string}) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return formatDocumentsAsString(docs);
      },
      question: (input: {question: string}) => input.question,
    },
    ragPrompt,
    llm,
    new StringOutputParser(),
  ]);

  return ragChain;
}

// Example usage
async function main() {
  const rag = await createEnhancedRAG("https://nextjs.org");
  const response = await rag.invoke({
    question: "What does NextJS 15 offer in support React 19 RC?",
  });
  console.log(response);
}

main().catch(console.error);

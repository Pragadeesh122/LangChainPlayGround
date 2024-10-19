import {ChatOpenAI} from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts";
import {StringOutputParser} from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatOpenAI({
  model: "gpt-4",
});
const parser = new StringOutputParser();
const systemTemplate = "Translate the following into {language}:";

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["user", "{text}"],
]);

const llmChain = promptTemplate.pipe(model).pipe(parser);

(async () => {
  const result = await llmChain.invoke({
    language: "tamil",
    text: "Hello, how are you?",
  });
  console.log(result);
})();

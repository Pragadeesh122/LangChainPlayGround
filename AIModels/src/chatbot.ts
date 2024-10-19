import {ChatOpenAI} from "@langchain/openai";
import {
  START,
  END,
  StateGraph,
  MemorySaver,
  MessagesAnnotation,
  Annotation,
} from "@langchain/langgraph";
import {ChatPromptTemplate, MessagesPlaceholder} from "@langchain/core/prompts";
import {v4 as uuidv4} from "uuid";
import dotenv from "dotenv";
import {StringOutputParser} from "@langchain/core/output_parsers";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  trimMessages,
} from "@langchain/core/messages";

dotenv.config();

const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

const llm = new ChatOpenAI({
  model: "gpt-4", // Corrected model name
  temperature: 0,
});

const parser = new StringOutputParser();

// Define the State
const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  language: Annotation<string>(),
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant. Answer all questions to the best of your ability in {language}.",
  ],
  new MessagesPlaceholder("messages"),
]);

// Define the function that calls the model
const callModel4 = async (state: typeof GraphAnnotation.State) => {
  const chain = prompt.pipe(llm);
  const trimmedMessage = await trimmer.invoke(state.messages);
  const response = await chain.invoke({
    messages: trimmedMessage,
    language: state.language,
  });
  return {messages: [response]};
};

const workflow = new StateGraph(GraphAnnotation)
  .addNode("model", callModel4)
  .addEdge(START, "model")
  .addEdge("model", END);

const app = workflow.compile({checkpointer: new MemorySaver()});

const config = {configurable: {thread_id: uuidv4()}};

const messages = [
  new SystemMessage("you're a good assistant"),
  new HumanMessage("hi! I'm bob"),
  new AIMessage("hi!"),
  new HumanMessage("I like vanilla ice cream"),
  new AIMessage("nice"),
  new HumanMessage("whats 2 + 2"),
  new AIMessage("4"),
  new HumanMessage("thanks"),
  new AIMessage("no problem!"),
  new HumanMessage("having fun?"),
  new AIMessage("yes!"),
];

(async () => {
  const trimmedMessages = await trimmer.invoke(messages);
  const input = {
    messages: [
      ...trimmedMessages,
      new HumanMessage(
        "How are you? Can you tell me best place to visit in Austin?"
      ),
    ],
    language: "English",
  };

  const output = await app.invoke(input, config);
  console.log(
    "Model response:",
    output.messages[output.messages.length - 1].content
  );
})();

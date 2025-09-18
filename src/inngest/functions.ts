import { inngest } from "./client";
import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox, lastAssistanttextMessageContent } from "./utlis";
import { z } from "zod";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/prompt";
import prisma from "@/lib/db";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const Launchpad = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("launchpad-test");
      // await sandbox.setTimeout(3_600_000);
      return sandbox.sandboxId;
    });

    const previosMessages = await step.run(
      "get-previous-messages",
      async () => {
        const formattedMessages: Message[] = [];
        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "asc",
          },
          take:5
        });

        for (const message of messages) {
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,

          });
        }

        return formattedMessages.reverse()
      }
    );

    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },

      {
        messages: previosMessages,
      }
    );

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1,
        },

        apiKey: process.env.OPENAI_API_KEY,
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({ command: z.string() }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },

                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  },
                });
                return result.stdout;
              } catch (error) {
                console.log();
                `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
                return `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {};
                  const sandbox = await getSandbox(sandboxId);
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }
                  return updatedFiles;
                } catch (error) {
                  return "Error: " + error;
                }
              }
            );
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files in the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents: { path: string; content: string }[] = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {}
            });
          },
        }),
      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText =
            lastAssistanttextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });



    const result = await network.run(event.data.value,{state});



const fragmentTitleGenerator = createAgent({
  name:"fragment-title-generator",

  description:"Generate a title for the fragment",
  system:FRAGMENT_TITLE_PROMPT,
  model:openai({
    model:"gpt-4o",
    defaultParameters:{temperature:0.1},
    apiKey:process.env.OPENAI_API_KEY
  })
})

const responseGenerator = createAgent({
  name:"response-generator",
  description:"Generate a response for the fragment",
  system:RESPONSE_PROMPT,
  model:openai({
    model:"gpt-4o",
    defaultParameters:{temperature:0.1},
    apiKey:process.env.OPENAI_API_KEY
  })
})


const {output:fragmentTitle} = await fragmentTitleGenerator.run(result.state.data.summary)
const {output:response} = await responseGenerator.run(result.state.data.summary)


const generateFragmentTitle =()=>{
  if(fragmentTitle[0].type !== 'text'){
    return "Here you go"
  }
  if(Array.isArray(fragmentTitle[0].content)){
    return fragmentTitle[0].content.map((txt)=>txt).join("")
  }
  else {
    return fragmentTitle[0].content
  }}
const generateResponse =()=>{
  if(response[0].type !== 'text'){
    return "Fragment"
  }
  if(Array.isArray(response[0].content)){
    return response[0].content.map((txt)=>txt).join("")
  }
  else {
    return response[0].content
  }}





    const isError =
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);

      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong.Please try again",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          content: generateResponse(),
          role: "ASSISTANT",
          type: "RESULT",
          projectId: event.data.projectId,
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: generateFragmentTitle(),
             
              files: result.state.data.files,
            },
          },
        },
      });
    });
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);

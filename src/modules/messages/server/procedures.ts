import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
export const messageRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        
        projectId: z.string().min(1, { message: "Prompt is required" }),
      })
    )
    .query(async ({input}) => {
      const messages = await prisma.message.findMany({
        where:{
          projectId:input.projectId
        },
        orderBy: {
          updatedAt: "asc",
        },
        include: {
          fragment: true,
        },
      });
      return messages;
    }),

  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Prompt is required" })
          .max(10000, { message: "Prompt is too long" }),
        projectId: z.string().min(1, { message: "Prompt is required" }),
      })
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });
      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value,
          projectId: input.projectId,
        },
      });
      return createdMessage;
    }),
});

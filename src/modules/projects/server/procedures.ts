import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";

import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({

  getMany: protectedProcedure
    
    .query(async ({ctx}) => {
      const projects = await prisma.project.findMany({
        where:{
          userId:ctx.auth.userId
        },
        
        orderBy: {
          updatedAt: "asc",
        },
       
      });
      return projects;
    }),

  


  getOne: protectedProcedure
    .input(z.object({ id: z.string().min(1, { message: "Id is required" }) }))
    .query(async ({ input,ctx }) => {
      const existingproject = await prisma.project.findUnique({
        where: {
          userId:ctx.auth.userId,
          id: input.id,
        },
      });
      if (!existingproject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      return existingproject;
    }),

  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Prompt is required" })
          .max(10000, { message: "Prompt is too long" }),
      })
    )
    .mutation(async ({ input,ctx }) => {
      try {
        const createdProject = await prisma.project.create({
        data: {
          userId:ctx.auth.userId,
          name: generateSlug(2, {
            format: "kebab",
          }),
          messages: {
            create: {
              content: input.value,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });
      await inngest.send({
        name: "code-agent/run",
        data: {
          value: input.value,
          projectId: createdProject.id,
        },
      });

      return createdProject;
      } catch (error) {
       console.log("this is error from trpc create " , error);
       
      }
    }),
});

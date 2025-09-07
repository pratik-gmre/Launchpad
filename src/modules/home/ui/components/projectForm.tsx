'use client'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutoSize from "react-textarea-autosize";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "../../constant";
import { truncateSync } from "fs";



const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Prompt is required" })
    .max(10000, { message: "Prompt is too long" }),
});

export const ProjectForm = () => {

  const onSelect = (content:string)=>{
    form.setValue("value",content,{
      shouldDirty: true,
      shouldTouch: true, 
      shouldValidate: true
    })
  }

  const router = useRouter()
  const trpc = useTRPC();
  const queryClient = useQueryClient()
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: "",
    },


  });

  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess:(data)=>{

        queryClient.invalidateQueries(
            trpc.projects.getMany.queryOptions()
          )
          router.push(`/project/${data?.id}`)
        //ToDO invalidata usage status
        

    },
    onError:(error)=>{
        toast.error(error.message)
    }
  }));

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,

    });
  };

  const isPending = createProject.isPending;
  const isDisabled = isPending || !form.formState.isValid;

  //   below onSubmit will trigger above onSubmit only if form is valid which is defined by const form component above
  return (
    <Form {...form}>
      <section className="space-y-6">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative bordre p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",

        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutoSize
              {...field}
              disabled={isPending}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="Let's build something..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }
              }}
            />
          )}
        />
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5  select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground font-medium">
              <span>Enter</span>
            </kbd>
            &nbsp;to submit
          </div>
          <Button
            className={cn(
              "size-8 rounded-full ",
              isDisabled && " bg-muted-foreground border"
            )}
            disabled={isDisabled}
          >
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <ArrowUpIcon />
            )}
          </Button>
        </div>
      </form>

      <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
       {PROJECT_TEMPLATES.map((template)=>(
        <Button key={template.title} variant={"outline"} size={"sm"} className="bg-white dark:bg-sidebar" onClick={()=>onSelect(template.prompt)} >
          {template.emoji} {template.title}
        </Button>
       ))}
      </div>
      </section>
    </Form>
  );
};

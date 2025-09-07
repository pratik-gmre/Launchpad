
import { ProjectList } from "@/modules/home/ui/components/project-list";
import { ProjectForm } from "@/modules/home/ui/components/projectForm";
import Image from "next/image";


export default function Home() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src={"/logo.svg"}
            height={50}
            width={50}
            className="hidden md:block"
            alt="Launchpad"
          />
           </div>
          <h1 className="text-3xl md:text-5xl font-bold">
            Let&apos;s build something
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center">
            Create a new project
          </p>

          <div className="max-w-3xl mx-auto w-full">
            <ProjectForm/>
          </div>

       
      </section>
      <ProjectList/>
    </div>
  );
}

//4:36:00

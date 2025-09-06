import { Button } from "@/components/ui/button";
import { Hint } from "@/components/ui/hint";
import { Fragment } from "@/generated/prisma";
import { ExternalLinkIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  data: Fragment;
}

export const FragmentWeb = ({ data }: Props) => {
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar items-center gap-x-2 flex">
<Hint text="Refresh" side="bottom" align="start">
    <Button size={"sm"} variant={"outline"} onClick={onRefresh}>
          <RefreshCwIcon />
        </Button>
</Hint>
       <Hint text="Copy link" side="bottom" align="start">
         <Button
          size={"sm"}
          variant={"outline"}
          onClick={handleCopy}
          className="flex-1 justify-start font-normal text-start"
          disabled={!data.sandboxUrl || copied}
        >
          <span className="truncate">{data.sandboxUrl}</span>
        </Button>
       </Hint>
       <Hint text="Open in new tab" side="bottom" align="start">
         <Button
          size={"sm"}
          variant={"outline"}
          onClick={() => {
            if (!data.sandboxUrl) return;
            window.open(data.sandboxUrl, "_blank");
          }}
          disabled={!data.sandboxUrl}
        >
          <ExternalLinkIcon />
        </Button>
       </Hint>
      </div>
      <iframe
        key={fragmentKey}
        src={data.sandboxUrl}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
      />
    </div>
  );
};

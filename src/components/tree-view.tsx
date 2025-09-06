import { TreeItem } from "@/types";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

interface TreeViewProps {
  data: TreeItem[];
  value?: string | null;
  onSelect?: (value: string) => void;
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  console.log("this is data from tree view", data);

  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    selectedValue={value}
                    onSelect={onSelect}
                    parentPath=""
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </SidebarProvider>
  );
};

interface TreeNodeProps {
  item: TreeItem;
  selectedValue?: string | null;
  onSelect?: (value: string) => void;
  parentPath: string;
}
// const Tree = ({ item, selectedValue, onSelect, parentPath }: TreeNodeProps) => {
//   const [name, ...items] = Array.isArray(item) ? item : [item];
//   const currentPath = parentPath ? `${parentPath}/${name}` : name;
//   if (!item.length) {
//     const isSelected = selectedValue === currentPath;
//     return (
//       <SidebarMenuButton
//         isActive={isSelected}
//         className="data-[active=true]:bg-transparent"
//         onClick={() => {
//           onSelect?.(currentPath);
//         }}
//       >
//         <FileIcon />
//         <span className="truncate">{name}</span>
//       </SidebarMenuButton>
//     );
//   }

//   return (
//     <SidebarMenuItem>
//       <Collapsible
//         className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
//         defaultOpen
//       >
//         <CollapsibleTrigger asChild>
//           <SidebarMenuButton>
//             <ChevronRightIcon className="transition-transform" />
//             <FolderIcon />
//             <span className="truncate">{name}</span>
//           </SidebarMenuButton>
//         </CollapsibleTrigger>
//         <CollapsibleContent>
//           <SidebarMenuSub>
//             {items.map((item, index) => (
//               <Tree
//                 key={index}
//                 item={item}
//                 selectedValue={selectedValue}
//                 onSelect={onSelect}
//                 parentPath={currentPath}
//               />
//             ))}
//           </SidebarMenuSub>
//         </CollapsibleContent>
//       </Collapsible>
//     </SidebarMenuItem>
//   );
// };


const Tree = ({ item, selectedValue, onSelect, parentPath }: TreeNodeProps) => {
  // Check if item is a string (file) or array (folder)
  const isFile = typeof item === 'string';
  
  if (isFile) {
    // Handle file
    const fileName = item;
    const currentPath = parentPath ? `${parentPath}/${fileName}` : fileName;
    const isSelected = selectedValue === currentPath;
    
    return (
      <SidebarMenuButton
        isActive={isSelected}
        className="data-[active=true]:bg-transparent"
        onClick={() => {
          onSelect?.(currentPath);
        }}
      >
        <FileIcon />
        <span className="truncate">{fileName}</span>
      </SidebarMenuButton>
    );
  }

  // Handle folder
  const [folderName, ...children] = item;
  const currentPath = parentPath ? `${parentPath}/${folderName}` : folderName;

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className="transition-transform" />
            <FolderIcon />
            <span className="truncate">{folderName}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {children.map((childItem, index) => (
              <Tree
                key={index}
                item={childItem}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
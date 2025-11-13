import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Client } from "@/lib/types";
import {
  Eye,
  Edit,
  User,
  Phone,
  Calendar,
  MoreVertical,
  Globe,
  Copy,
  Delete,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { capitalizeWords } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
  onManagePermissions: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
};

const getAppOrigin = () =>
  process.env.NEXT_PUBLIC_APP_ORIGIN ||
  (typeof window !== "undefined" ? window.location.origin : "");

const getAppLoginUrl = (slug?: string) =>
  slug ? `${getAppOrigin()}/client-login/${slug}` : "";

export function ClientCard({
  client,
  onEdit,
  onDelete,
  onResetPassword,
  onManagePermissions,
}: ClientCardProps) {
  const { toast } = useToast();
  const appUrl = getAppLoginUrl(client.slug);
  return (
    <Card className="flex flex-col p-0">
  <CardHeader className="flex-grow p-4 md:p-6">
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-lg truncate">{capitalizeWords(client.contactName)}</h3>
        <p className="text-sm text-muted-foreground truncate">{client.email}</p>
      </div>
    </div>
  </CardHeader>
  
  <CardContent className="space-y-4 text-sm p-4 md:p-6">
    <Separator />
    <div className="space-y-3 pt-4">
      {/* Username Row */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
          <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="flex justify-between items-center flex-1 min-w-0">
          <span className="text-muted-foreground text-xs md:text-sm">Username</span>
          <span className="font-medium truncate ml-2 text-right">{client.clientUsername}</span>
        </div>
      </div>

      {/* Phone Row */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50 flex-shrink-0">
          <Phone className="h-4 w-4 text-green-500 dark:text-green-400" />
        </div>
        <div className="flex justify-between items-center flex-1 min-w-0">
          <span className="text-muted-foreground text-xs md:text-sm">Phone</span>
          <span className="font-medium truncate ml-2 text-right">{client.phone}</span>
        </div>
      </div>

      {/* Joined Date Row */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 flex-shrink-0">
          <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
        </div>
        <div className="flex justify-between items-center flex-1 min-w-0">
          <span className="text-muted-foreground text-xs md:text-sm">Joined</span>
          <span className="font-medium truncate ml-2 text-right">
            {formatDate(client.createdAt)}
          </span>
        </div>
      </div>

      {/* URL / Slug Row */}
      {/* <div className="flex items-center gap-3 md:gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50 flex-shrink-0">
          <Globe className="h-4 w-4 text-orange-500 dark:text-orange-400" />
        </div>

        <div className="flex items-center justify-between flex-1 min-w-0">
          <span className="text-muted-foreground text-xs md:text-sm">URL</span>

          {client.slug ? (
            <div className="flex items-center gap-1 md:gap-2 ml-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 md:h-9 md:w-auto md:px-3"
                onClick={() => {
                  const appUrl = `${window.location.origin}/client-login`;
                  navigator.clipboard.writeText(appUrl).then(() =>
                    toast({
                      title: "Copied",
                      description: "Login URL copied to clipboard.",
                    })
                  )
                }}
              >
                <Copy className="h-3.5 w-3.5 md:mr-2" />
                <span className="hidden md:inline">Copy</span>
              </Button>
            </div>
          ) : (
            <span className="font-medium text-muted-foreground/70 text-xs md:text-sm ml-2">Not set</span>
          )}
        </div>
      </div> */}
    </div>
  </CardContent>
  
  <CardFooter className="mt-auto border-t p-1 md:p-4 flex  sm:flex-row gap-2">
    <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
      <Link href={`/admin/analytics?clientId=${client._id}`} className="flex items-center justify-center">
        <Eye className=" h-4 w-4" /> 
        <span className="md:block hidden">View</span>
      </Link>
    </Button>

    <Button variant="secondary" size="sm" onClick={onEdit} className="flex-1 sm:flex-none">
      <Edit className="mr-2 h-4 w-4" /> 
      <span>Edit</span>
    </Button>

    <Button variant="secondary" size="sm" onClick={() => onDelete(client._id)} className="flex-1 sm:flex-none">
      <Trash2 className=" h-4 w-4 text-red-500" /> 
    </Button>
  </CardFooter>
</Card>
  );
}

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash2, MoreHorizontal, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/contexts/permission-context";

// ✅ Define a lightweight type just for the table
type ServiceRow = {
  _id: string;
  serviceName: string;
  createdAt?: string;
  updatedAt?: string;
};

type ServiceTableProps = {
  services: ServiceRow[];
  isLoading: boolean;
  onEdit: (service: ServiceRow) => void;
  onDelete: (service: ServiceRow) => void;
  onCreate: () => void;
};

export function ServiceTable({
  services,
  isLoading,
  onEdit,
  onDelete,
  onCreate,
}: ServiceTableProps) {
  const { permissions } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-dashed rounded-lg text-center">
        <Server className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Services Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first service to get started.
        </p>
        {permissions?.canCreateProducts && (
          <Button className="mt-6" onClick={onCreate}>
            <Server className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        )}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Service</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service._id}>
            <TableCell>
              <div className="font-medium flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                {service.serviceName}
                <Badge variant="outline">Service</Badge>
              </div>
            </TableCell>
            <TableCell>
              {service.createdAt
                ? new Intl.DateTimeFormat("en-US").format(
                    new Date(service.createdAt)
                  )
                : "—"}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(service)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

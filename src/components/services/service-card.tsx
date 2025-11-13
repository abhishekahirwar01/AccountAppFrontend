"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ServiceRow = {
  _id: string;
  serviceName: string;
  sac?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ServiceCardProps = {
  service: ServiceRow;
  onEdit: (service: ServiceRow) => void;
  onDelete: (service: ServiceRow) => void;
};

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  return (
    <Card className="flex flex-col rounded-2xl shadow-md">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-bold text-lg">
            {service.serviceName ?? "Unnamed Service"}
          </h3>
          <Badge variant="outline">Service</Badge>
        </div>

        {/* SAC Code */}
        <p className="text-sm">
          SAC Code:{" "}
          <span className="font-medium">
            {service.sac != null ? service.sac : "N/A"}
          </span>
        </p>

        {/* Created Date */}
        <p className="text-xs text-muted-foreground mt-1">
          Created:{" "}
          {service.createdAt
            ? new Date(service.createdAt).toLocaleDateString("en-IN")
            : "—"}
        </p>
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="mt-auto border-t p-2 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(service)}
          aria-label={`Edit ${service.serviceName ?? "service"}`}
          title={`Edit ${service.serviceName ?? "service"}`}
        >
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(service)}
          aria-label={`Delete ${service.serviceName ?? "service"}`}
          title={`Delete ${service.serviceName ?? "service"}`}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

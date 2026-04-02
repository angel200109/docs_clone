"use client";
import { LoaderIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentRow } from "./document-row";
import { useSearchParam } from "@/hooks/use-search-param";
import { api } from "../../../convex/_generated/api";
import { useQuery } from "convex/react";

export const DocumentTable = () => {
  const [search] = useSearchParam();
  const results = useQuery(api.documents.listAccessible, { search });

  if (results === undefined) {
    return (
      <div className="max-w-screen-xl mx-auto px-16 py-6 flex justify-center items-center h-24">
        <LoaderIcon className="animate-spin text-muted-foreground size-5" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-16 py-6 flex flex-col gap-5">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead>Name</TableHead>
            <TableHead>&nbsp;</TableHead>
            <TableHead className="hidden md:table-cell">Access</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
          </TableRow>
        </TableHeader>
        {results.length === 0 ? (
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No documents found
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody>
            {results.map((document) => (
              <DocumentRow key={document._id} document={document} />
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
};

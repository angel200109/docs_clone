"use client";
// import { PaginationStatus } from "convex/react";
// import { Doc } from "../../../convex/_generated/dataModel";
import { LoaderIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DocumentRow } from "./document-row";
import { Button } from "@/components/ui/button";
import { usePaginatedQuery } from "convex/react";
import { useSearchParam } from "@/hooks/use-search-param";
import { api } from "../../../convex/_generated/api";

// interface DocumentsTableProps {
//     documents: Doc<"documents">[] | undefined;
//     loadMore: (numItems: number) => void;
//     status: PaginationStatus;
//     isLoading: boolean;

// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const DocumentTable = () => {
    const [search] = useSearchParam();
    const {
        results,
        status,
        loadMore,
        isLoading
    } = usePaginatedQuery(api.documents.get, { search }, { initialNumItems: 5 });
    // useEffect(() => {
    //     console.log("results:", results);
    //     console.log("isloading:", isLoading);

    // }, [results])
    // const buttonRef = useRef<HTMLButtonElement>(null);
    // const LoadMoreDocument = async () => {
    //     await loadMore(5);
    //     buttonRef.current!.innerText = "no more";

    // }
    return (
        <div className="max-w-screen-xl mx-auto px-16 py-6 flex flex-col gap-5">
            {!results || results?.length === 0 && isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <LoaderIcon className="animate-spin text-muted-foreground size-5" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead>Name</TableHead>
                            <TableHead>&nbsp;</TableHead>
                            <TableHead className="hidden md:table-cell">Shared</TableHead>
                            <TableHead className="hidden md:table-cell">Created</TableHead>
                        </TableRow>
                    </TableHeader>
                    {results?.length === 0 && !isLoading ? (
                        <TableBody>
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No documents found
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    ) : (
                        <TableBody>
                            {results?.map((document) => (
                                <DocumentRow key={document._id} document={document} />
                            ))}
                        </TableBody>
                    )}
                </Table>
            )}

            {status === "CanLoadMore" ? (<div className="flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMore(5)}
                    disabled={status !== "CanLoadMore"}
                >
                    Load more
                </Button>
            </div>) : null}

            {status !== "CanLoadMore" && !isLoading ? (<div className="flex items-center justify-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadMore(5)}
                    disabled
                >
                    End of results
                </Button>
            </div>) : null}
        </div>
    );
};
import { Navbar } from "@/app/(home)/navbar";
import { TemplatesGallery } from "./templates-gallery";
// import { usePaginatedQuery } from "convex/react";
// import { api } from "../../../convex/_generated/api";
import { DocumentTable } from "./documents-table";
import { Suspense } from "react";
// import { useSearchParam } from "@/hooks/use-search-param";

const DocumentHome = () => {
  // const [search] = useSearchParam();
  // const {
  //   results,
  //   status,
  //   loadMore,
  //   isLoading
  // } = usePaginatedQuery(api.documents.get, { search }, { initialNumItems: 5 });
  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white">
        <Navbar />
      </div>
      <div className="mt-16">
        <TemplatesGallery />
        <Suspense fallback={<div>Loading user profile...</div>}>
          <DocumentTable />
        </Suspense>
      </div>
    </div>
  );
};

export default DocumentHome;

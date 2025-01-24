import { TagView } from "@/components/TagView";
import { BottomNav } from "@/components/BottomNav";

const TagsPage = () => {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex-1">
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-semibold">Tags Overview</h1>
          <TagView />
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default TagsPage;
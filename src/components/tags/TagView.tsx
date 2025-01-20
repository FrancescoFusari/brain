import { TagList } from "./TagList";

export const TagView = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-secondary">Tags</h1>
      <TagList />
    </div>
  );
};
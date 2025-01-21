export interface Note {
  id: string;
  content: string;
  category?: string;
  tags: string[];
  created_at: string;
  input_type?: string;
  source_url?: string;
  source_image_path?: string;
}
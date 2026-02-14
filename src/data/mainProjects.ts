export type MainProject = {
  slug: string;
  title: string;
  description: string;
  image: string;
  github?: string;
  website?: string;
};

export type MainProjectWithContent = MainProject & {
  content: string;
};

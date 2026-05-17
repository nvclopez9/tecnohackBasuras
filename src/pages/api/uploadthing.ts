import { createRouteHandler, createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

const uploadRouter = {
  image: f({ image: { maxFileSize: '16MB' } })
    .middleware(async () => {
      return { userId: 'public' };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
};

export type OurFileRouter = typeof uploadRouter;
export default createRouteHandler({ router: uploadRouter });

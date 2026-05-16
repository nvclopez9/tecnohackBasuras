import { createRouteHandler, createUploadthing } from 'uploadthing/next';

const f = createUploadthing();

const uploadRouter = {
  image: f({ image: { maxFileSize: '16MB' } })
    .middleware(async () => {
      if (!process.env.UPLOADTHING_SECRET) {
        throw new Error('UPLOADTHING_SECRET must be set in the environment');
      }
      return { userId: 'public' };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
};

export type OurFileRouter = typeof uploadRouter;
export default createRouteHandler({ router: uploadRouter });

import { allVideos, decode } from "@/lib/data";

export const metadata = { title: "Videos" };

export default function Videos() {
  return (
    <>
      <h1 className="mb-6 border-b-2 border-emerald-700 pb-2 text-2xl font-bold">Videos</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        {allVideos.map((v) => (
          <div key={v.slug}>
            <iframe
              src={`https://www.youtube.com/embed/${v.youtubeId}`}
              title={decode(v.title)}
              loading="lazy"
              allowFullScreen
              className="aspect-video w-full rounded-lg"
            />
            <h2 className="mt-2 font-semibold">{decode(v.title)}</h2>
          </div>
        ))}
      </div>
    </>
  );
}

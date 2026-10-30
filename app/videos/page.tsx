import Link from "next/link";
import PageTitle from "@/components/PageTitle";
import VideoPlayer from "@/components/VideoPlayer";
import { allVideos, decode } from "@/lib/data";

export const metadata = { title: "Videos", description: "Malayalam videos on preparing for Hajj and Umrah, its history, and a study guide.", alternates: { canonical: "/videos" } };

export default function Videos() {
  return (
    <>
      <PageTitle>Videos</PageTitle>
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {allVideos.filter((v) => v.youtubeId).map((v) => (
          <div key={v.slug}>
            <VideoPlayer id={v.youtubeId!} title={decode(v.title)} />
            <h2 className="mt-3 font-semibold leading-snug">
              <Link href={`/video/${v.slug}`} className="inline-block py-1.5 hover:text-madinah">{decode(v.title)}</Link>
            </h2>
          </div>
        ))}
      </div>
    </>
  );
}

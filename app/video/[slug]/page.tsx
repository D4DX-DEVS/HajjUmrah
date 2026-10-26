import { notFound } from "next/navigation";
import PageTitle from "@/components/PageTitle";
import VideoPlayer from "@/components/VideoPlayer";
import { allVideos, decode, fmtDate, getVideo } from "@/lib/data";

export const instant = false;

export const generateStaticParams = () => allVideos.filter((v) => v.youtubeId).map((v) => ({ slug: v.slug }));

export async function generateMetadata({ params }: PageProps<"/video/[slug]">) {
  const v = getVideo((await params).slug);
  return { title: v && decode(v.title) };
}

export default async function VideoPage({ params }: PageProps<"/video/[slug]">) {
  const v = getVideo((await params).slug);
  if (!v?.youtubeId) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle sub={fmtDate(v.date)}>{decode(v.title)}</PageTitle>
      <VideoPlayer id={v.youtubeId} title={decode(v.title)} />
    </div>
  );
}

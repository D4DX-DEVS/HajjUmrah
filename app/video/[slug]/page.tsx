import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import PageTitle from "@/components/PageTitle";
import VideoPlayer from "@/components/VideoPlayer";
import { SITE, allVideos, decode, fmtDate, getVideo } from "@/lib/data";

export const generateStaticParams = () => allVideos.filter((v) => v.youtubeId).map((v) => ({ slug: v.slug }));

export async function generateMetadata({ params }: PageProps<"/video/[slug]">) {
  const v = getVideo((await params).slug);
  return { title: v && decode(v.title), description: v && `${decode(v.title)}: a Malayalam video on Hajj and Umrah from islamonlive.`, alternates: { canonical: `/video/${v?.slug}` } };
}

export default async function VideoPage({ params }: PageProps<"/video/[slug]">) {
  const v = getVideo((await params).slug);
  if (!v?.youtubeId) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "VideoObject", name: decode(v.title), description: decode(v.title), thumbnailUrl: `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`, uploadDate: v.date, embedUrl: `https://www.youtube-nocookie.com/embed/${v.youtubeId}`, inLanguage: "ml", url: SITE + "/video/" + encodeURI(v.slug) }} />
      <PageTitle sub={fmtDate(v.date)}>{decode(v.title)}</PageTitle>
      <VideoPlayer id={v.youtubeId} title={decode(v.title)} />
    </div>
  );
}

import { prisma } from "@/server/prisma";

export async function createNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      link: params.link,
    },
  });
}

import { PrismaClient } from "@/generated/prisma"

const prisma = new PrismaClient()

async function main() {
  // Tạo apps mẫu
  const instagram = await prisma.app.create({
    data: {
      name: "Instagram",
      description: "Photo and video sharing social networking service",
      slug: "instagram",
      category: "Social",
      platform: "IOS",
      brandColor: "#E4405F",
      screens: {
        create: [
          {
            title: "Feed Screen",
            imageUrl: "https://example.com/instagram-feed.png",
            screenType: "Home",
            tags: ["feed", "infinite-scroll", "stories"],
          },
          {
            title: "Profile Screen",
            imageUrl: "https://example.com/instagram-profile.png",
            screenType: "Profile",
            tags: ["profile", "grid", "bio"],
          },
        ],
      },
    },
  })

  console.log({ instagram })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing records (if any)
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.dailyCheckin.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.chapterPurchase.deleteMany();
  await prisma.paymentOrder.deleteMany();
  await prisma.coinPackage.deleteMany();
  await prisma.coinTransaction.deleteMany();
  await prisma.coinWallet.deleteMany();
  await prisma.chapterContent.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.story.deleteMany();
  await prisma.payoutRequest.deleteMany();
  await prisma.authorProfile.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // 2. Create Users & Roles
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@novel.com",
      passwordHash,
      name: "Super Administrator",
      role: "SUPER_ADMIN",
      ageVerified: true,
      birthdate: new Date("1990-01-01"),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const moderator = await prisma.user.create({
    data: {
      email: "moderator@novel.com",
      passwordHash,
      name: "ทีมตรวจสอบเนื้อหา (Moderator)",
      role: "MODERATOR",
      ageVerified: true,
      birthdate: new Date("1995-05-15"),
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const financeAdmin = await prisma.user.create({
    data: {
      email: "finance@novel.com",
      passwordHash,
      name: "ทีมการเงิน (Finance Admin)",
      role: "FINANCE_ADMIN",
      ageVerified: true,
      birthdate: new Date("1992-08-20"),
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const author1 = await prisma.user.create({
    data: {
      email: "author1@novel.com",
      passwordHash,
      name: "หมอกเหมันต์",
      penName: "หมอกเหมันต์",
      role: "AUTHOR",
      ageVerified: true,
      birthdate: new Date("1998-03-12"),
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      authorProfile: {
        create: {
          bio: "นักเขียนนิยายแฟนตาซี กำลังภายใน และไซไฟเจ้าของผลงานติดอันดับ",
          bankName: "ธนาคารกสิกรไทย",
          bankAccountNo: "012-3-45678-9",
          bankAccountName: "กานต์ หมอกเหมันต์",
          kycStatus: "APPROVED",
          totalEarnings: 4500,
          pendingPayout: 1200,
        },
      },
    },
  });

  const author2 = await prisma.user.create({
    data: {
      email: "author2@novel.com",
      passwordHash,
      name: "Studio Moonlit",
      penName: "Studio Moonlit",
      role: "AUTHOR",
      ageVerified: true,
      birthdate: new Date("1997-11-28"),
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      authorProfile: {
        create: {
          bio: "สตูดิโอผลิตเว็บตูนและมังงะลายเส้นพรีเมียม สไตล์แฟนตาซี-แอคชั่น",
          bankName: "ธนาคารไทยพาณิชย์",
          bankAccountNo: "987-6-54321-0",
          bankAccountName: "สตูดิโอมูนลิต",
          kycStatus: "APPROVED",
          totalEarnings: 8200,
          pendingPayout: 2500,
        },
      },
    },
  });

  const reader = await prisma.user.create({
    data: {
      email: "reader@novel.com",
      passwordHash,
      name: "คุณผู้อ่านตัวยง",
      role: "READER",
      ageVerified: true,
      birthdate: new Date("2000-07-10"),
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      wallet: {
        create: {
          paidBalance: 250,
          freeBalance: 50,
          freeCoinsExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Also create wallets for others
  await prisma.coinWallet.create({
    data: { userId: superAdmin.id, paidBalance: 10000, freeBalance: 1000 },
  });
  await prisma.coinWallet.create({
    data: { userId: author1.id, paidBalance: 500, freeBalance: 100 },
  });
  await prisma.coinWallet.create({
    data: { userId: author2.id, paidBalance: 500, freeBalance: 100 },
  });

  // 3. Coin Packages
  const packages = [
    { name: "Starter Pack 100", coins: 100, bonusCoins: 0, priceThb: 35, badge: null, isPopular: false },
    { name: "Value Pack 300", coins: 300, bonusCoins: 30, priceThb: 99, badge: "คุ้มค่า", isPopular: false },
    { name: "Popular Pack 500", coins: 500, bonusCoins: 80, priceThb: 159, badge: "ยอดนิยม", isPopular: true },
    { name: "Super Pack 1,000", coins: 1000, bonusCoins: 200, priceThb: 299, badge: "+20% โบนัส", isPopular: false },
    { name: "VIP Ultimate 3,000", coins: 3000, bonusCoins: 800, priceThb: 799, badge: "VIP คุ้มสุด", isPopular: false },
  ];

  for (const pkg of packages) {
    await prisma.coinPackage.create({ data: pkg });
  }

  // 4. Achievements
  const achievements = [
    { key: "WELCOME_NEWBIE", title: "ก้าวแรกสู่นักอ่าน", description: "สมัครสมาชิกและเริ่มต้นอ่านผลงานแรกบนแพลตฟอร์ม", icon: "BookOpen", coinsReward: 20 },
    { key: "BOOKWORM_10", title: "หนอนหนังสือ", description: "อ่านนิยายหรือมังงะครบ 10 ตอน", icon: "Library", coinsReward: 30 },
    { key: "COIN_SUPPORTER", title: "ผู้อุปถัมภ์", description: "ปลดล็อกตอนพิเศษด้วยเหรียญครั้งแรก", icon: "Coins", coinsReward: 25 },
    { key: "STREAK_7_DAYS", title: "ไฟแรง 7 วันติด", description: "เช็คอินหรืออ่านต่อเนื่องครบ 7 วัน", icon: "Flame", coinsReward: 50 },
    { key: "SUPER_REVIEWER", title: "นักวิจารณ์มือทอง", description: "เขียนรีวิวหรือคอมเมนต์อย่างสร้างสรรค์ครบ 5 เรื่อง", icon: "MessageSquare", coinsReward: 30 },
  ];

  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach });
  }

  // Give reader initial achievement
  const welcomeAch = await prisma.achievement.findUnique({ where: { key: "WELCOME_NEWBIE" } });
  if (welcomeAch) {
    await prisma.userAchievement.create({
      data: {
        userId: reader.id,
        achievementId: welcomeAch.id,
      },
    });
  }

  // 5. Sample Stories & Chapters
  // Story 1: ราชันหวนคืนบัลลังก์มนตรา (Novel)
  const novel1 = await prisma.story.create({
    data: {
      authorId: author1.id,
      title: "ราชันหวนคืนบัลลังก์มนตรา (Return of the Magic Sovereign)",
      slug: "return-of-the-magic-sovereign",
      synopsis: "หลังจากการทรยศของสภาจอมเวทสูงสุด 'อาร์เธอร์' มหาจอมเวทผู้กุมความลับของวงแหวนมนตราโบราณได้ลืมตาตื่นขึ้นมาในร่างของเด็กหนุ่มผู้ไร้พลังเวทเมื่อสิบปีก่อนหน้ามหาสงคราม การทวงคืนความยุติธรรมและบัลลังก์แห่งเวทมนตร์จึงเริ่มต้นขึ้นอีกครั้ง!",
      coverUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
      type: "NOVEL",
      category: "Fantasy",
      tags: JSON.stringify(["แฟนตาซี", "เกิดใหม่", "เวทมนตร์", "แก้แค้น", "พระเอกเก่ง"]),
      contentRating: "ALL_AGES",
      status: "PUBLISHED",
      isFeatured: true,
      viewsCount: 14250,
      ratingAverage: 4.9,
      ratingsCount: 84,
      chapters: {
        create: [
          {
            chapterNumber: 1,
            title: "บทที่ 1: การตื่นขึ้นในเถ้าถ่านแห่งอดีต",
            coinPrice: 0,
            isFree: true,
            status: "PUBLISHED",
            viewsCount: 5200,
            content: {
              create: {
                previewText: "หยดน้ำค้างเย็นเยียบหยดลงบนเปลือกตา ความรู้สึกแรกที่สัมผัสได้คือความเจ็บปวดที่แผ่ซ่านไปทั่วร่าง...",
                textContent: `หยดน้ำค้างเย็นเยียบหยดลงบนเปลือกตา ความรู้สึกแรกที่สัมผัสได้คือความเจ็บปวดที่แผ่ซ่านไปทั่วร่าง กระดูกทุกท่อนราวกับถูกบดขยี้ด้วยค้อนเหล็กกล้า

อาร์เธอร์พยายามขยับนิ้วมือ กลิ่นคาวเลือดผสมกลิ่นหญ้าเปียกชื้นโชยเตะจมูก ภาพสุดท้ายในความทรงจำยังคงแจ่มชัด—แสงสว่างวาบจากวงเวทพิฆาตสิบสามแฉก รอยยิ้มเย้ยหยันของอัครมหาเสนาบดี และเสียงหัวเราะอันบ้าคลั่งของเหล่าผู้ทรยศที่เขาเคยเรียกว่าสหายร่วมสาบาน

"ข้า... ยังไม่ตายงั้นหรือ?"

เสียงที่เปล่งออกมาแหบแห้งและแผ่วเบา ยิ่งไปกว่านั้น มันไม่ใช่เสียงทุ้มต่ำอันทรงอำนาจของมหาจอมเวทวัยสี่สิบปี หากแต่เป็นเสียงแหลมสูงของเด็กหนุ่มวัยเยาว์

เขายกมือขวาขึ้นมาตรงหน้า มือคู่นี้ขาวซีด ผอมบาง และไร้ซึ่งรอยด้านจากการฝึกฝนดาบมนตรา ไม่มีแหวนสลักตราตระกูลวาลัวส์ ไม่มีแม้แต่ประกายมานาที่คุ้นเคย

อาร์เธอร์ลุกขึ้นนั่งอย่างช้าๆ สำรวจสภาพแวดล้อมรอบตัว ที่นี่คือตรอกหลังตลาดเก่าในเขตเมืองชั้นนอกของนครอัลเธีย เมืองหลวงแห่งจักรวรรดิมนตราที่เขาคุ้นเคยเป็นอย่างดี แต่สภาพตึกรามบ้านช่องเหล่านี้... มันคือภาพเมื่อสิบปีก่อน! ก่อนที่สงครามมารโลกันตร์จะปะทุขึ้น

"เป็นไปไม่ได้... มนตราห้วงกาลเวลาย้อนกลับทำงานจริงหรือ?"

หัวใจของเขาเต้นระรัว ในอดีต เขาเคยค้นพบศิลาศิลาจารึกโบราณที่กล่าวถึงเวทมนตร์ต้องห้าม 'การย้อนกลับของวัฏสงสาร' แต่ไม่เคยมีใครทดลองใช้มันสำเร็จ ทว่าในวินาทีที่วงเวทพิฆาตกำลังฉีกวิญญาณเขาเป็นชิ้นๆ ศิลาชิ้นนั้นได้แตกสลายและดูดกลืนวิญญาณของเขาข้ามกาลเวลากลับมา

"สภาจอมเวท... ลอร์ดมัลคอล์ม..." อาร์เธอร์กำหมัดแน่นจนเล็บจิกเข้าเนื้อ ความแค้นที่สุมอยู่ในอกลุกโชนดั่งเปลวเพลิงนรก

"ในชาตินี้ ข้าจะไม่ยอมให้พวกเจ้าชักใยชะตากรรมของข้าอีก บัลลังก์มนตราที่พวกเจ้าแย่งชิงไป ข้าจะทวงคืนมันกลับมาด้วยมือคู่นี้เอง!"`,
              },
            },
          },
          {
            chapterNumber: 2,
            title: "บทที่ 2: วงแหวนมานาแรกเริ่ม",
            coinPrice: 0,
            isFree: true,
            status: "PUBLISHED",
            viewsCount: 4100,
            content: {
              create: {
                previewText: "การโคจรมานาในร่างมนุษย์ธรรมดาจำเป็นต้องเริ่มจากการเปิดจุดชีพจรทั้งเก้า...",
                textContent: `การโคจรมานาในร่างมนุษย์ธรรมดาจำเป็นต้องเริ่มจากการเปิดจุดชีพจรทั้งเก้า ทว่าในยุคปัจจุบัน เทคนิคการเปิดชีพจรโบราณได้สูญหายไปกว่าแปดร้อยปีแล้ว

อาร์เธอร์นั่งขัดสมาธิลงบนพื้นหญ้าแห้งภายในห้องใต้หลังคาแคบๆ ร่างกายนี้มีนามว่า 'ลีโอ' เด็กหนุ่มกำพร้าผู้ทำงานรับจ้างขนฟืนในโรงเตี๊ยม ร่างกายขาดสารอาหารและเส้นลมปราณอุดตันอย่างหนัก หากเป็นจอมเวททั่วไปคงส่ายหน้าและตัดสินว่าร่างนี้ไม่มีพรสวรรค์ตลอดชีวิต

แต่สำหรับอาร์เธอร์ ผู้เป็นถึงปราชญ์มนตราแห่งยุค ร่างกายที่บริสุทธิ์และไม่เคยฝึกฝนเวทมนตร์ผิดวิธี เปรียบเสมือนผืนผ้าใบสีขาวที่พร้อมสำหรับการวาดภาพชิ้นเอก

"หายใจเข้าลึก... รวมจิตไว้ที่กึ่งกลางกระหม่อม"

เขาเริ่มท่องบทสวดภาษาเอลฟ์โบราณ อากาศรอบตัวเริ่มเกิดการสั่นสะเทือนเบาๆ ละอองแสงสีฟ้าครามซึ่งเป็นมานาธรรมชาติในชั้นบรรยากาศเริ่มถูกดึงดูดเข้ามาทีละน้อย

วูบ!

ความเจ็บปวดแล่นแปลบเมื่อมานาแทรกซึมเข้าสู่รูขุมขน ทว่าอาร์เธอร์ไม่แม้แต่จะขมวดคิ้ว ความเจ็บปวดเพียงเท่านี้เทียบไม่ได้แม้แต่เศษเสี้ยวของพิษไฟบรรลัยกัลป์ที่เขาเคยทนรับมา

เส้นมานาในร่างเริ่มสว่างวาบ เสียงเปรี๊ยะดังขึ้นในช่องอก จุดชีพจรจุดแรกถูกทะลวงออกอย่างหมดจด!

แสงสีฟ้าหมุนวนก่อตัวเป็นวงแหวนมานาชั้นที่หนึ่งที่หมุนรอบแกนพลังอย่างมั่นคง แม้จะเป็นเพียงวงแหวนระดับเริ่มต้น แต่ความบริสุทธิ์ของมันกลับส่องประกายเจิดจ้าไร้สิ่งเจือปน

"เริ่มต้นได้ดี... ขั้นต่อไปคือการหาทรัพยากรและสมุนไพรเสริมกระดูก" ลีโอลืมตาขึ้น นัยน์ตาสีน้ำตาลเดิมประกายแสงสีครามแวบหนึ่งก่อนจะเลือนหายไป`,
              },
            },
          },
          {
            chapterNumber: 3,
            title: "บทที่ 3: ตลาดมืดและศิลาเพลิงวิญญาณ [ตอนพรีเมียม]",
            coinPrice: 5,
            isFree: false,
            status: "PUBLISHED",
            viewsCount: 2900,
            content: {
              create: {
                previewText: "ยามค่ำคืนในนครอัลเธีย ตลาดมืดใต้ดินคือแหล่งรวมสิ่งของล้ำค่าที่ถูกขโมยมาและของวิเศษที่ไร้ผู้ครอบครอง...",
                textContent: `ยามค่ำคืนในนครอัลเธีย ตลาดมืดใต้ดินคือแหล่งรวมสิ่งของล้ำค่าที่ถูกขโมยมาและของวิเศษที่ไร้ผู้ครอบครอง

ลีโอสวมเสื้อคลุมสีมอซอ ดึงฮู้ดลงมาคลุมใบหน้าจนเห็นเพียงริมฝีปาก เขาเดินลัดเลาะผ่านตรอกแคบที่ชื้นแฉะจนกระทั่งมาถึงประตูลับหลังร้านขายของชำเก่า

"รหัสผ่าน?" เสียงทุ้มแหบดังมาจากช่องมองหลังประตู

"เลือดมังกรยามราตรี สลายใต้แสงจันทร์" ลีโอตอบด้วยน้ำเสียงนิ่งสนิท

เสียงสลักประตูดังปลดล็อก ประตูไม้หนาเปิดออก เผยให้เห็นบันไดหินทอดยาวลงสู่ใต้ดิน เสียงผู้คนจอแจ กลิ่นสมุนไพรแปลกประหลาด และประกายแสงหลากสีจากหินเวทมนตร์สะท้อนไปทั่วห้องโถงขนาดมหึมา

สายตาของอาร์เธอร์กวาดมองแผงขายของทีละร้านด้วยความแม่นยำ สำหรับคนอื่น เศษหินสีดำขรุขระบนแผงพ่อค้าชาวคนแคระอาจดูเหมือนเศษขยะจากเหมืองถ่านหิน แต่สำหรับเขา มันคือ 'ศิลาเพลิงวิญญาณ' ขั้นสูงสุดที่ยังไม่ได้เจียระไน!

"เจ้าหนู สนใจหินนำโชคไหม? แค่สามสิบเหรียญทองแดงเท่านั้น" ชายร่างท้วมพ่อค้ากล่าวพลางแคะเล็บ

ลีโอแสร้งทำเป็นลังเล ก่อนจะหยิบเหรียญทองแดงที่เก็บสะสมมาวางลงบนโต๊ะ "ข้าต้องการหินก้อนนี้... ก้อนสีดำที่มีรอยแตกตรงมุม"

การเจรจาจบลงอย่างรวดเร็ว เมื่อได้ศิลามาไว้ในมือ อาร์เธอร์สัมผัสได้ถึงคลื่นความร้อนมหาศาลที่ถูกผนึกอยู่ภายใน ด้วยศิลาชิ้นนี้ เขาสามารถหลอมโอสถฟื้นฟูกายาเพลิงได้ในคืนนี้ทันที!`,
              },
            },
          },
          {
            chapterNumber: 4,
            title: "บทที่ 4: เปลวเพลิงที่ตื่นขึ้น [ตอนพรีเมียม]",
            coinPrice: 8,
            isFree: false,
            status: "PUBLISHED",
            viewsCount: 1950,
            content: {
              create: {
                previewText: "การหลอมโอสถด้วยมือเปล่าคือศาสตร์ลับที่มีเพียงมหาจอมเวทระดับเก้าดาวเท่านั้นที่ล่วงรู้...",
                textContent: `การหลอมโอสถด้วยมือเปล่าคือศาสตร์ลับที่มีเพียงมหาจอมเวทระดับเก้าดาวเท่านั้นที่ล่วงรู้

เปลวเพลิงสีฟ้าอ่อนลุกโชนขึ้นบนฝ่ามือของเด็กหนุ่ม อุณหภูมิในห้องใต้หลังคาพุ่งสูงขึ้นอย่างรวดเร็ว ศิลาเพลิงวิญญาณลอยเคว้งอยู่เหนือฝ่ามือ ค่อยๆ ละลายกลายเป็นของเหลวสีทองอร่ามที่เปล่งแสงระยิบระยับ

"ผสาน!"

ลีโอบีบอัดของเหลวด้วยพลังจิตอย่างแม่นยำ ของเหลวรวมตัวกันเป็นเม็ดยากลมเกลี้ยงสามเม็ด กลิ่นหอมบริสุทธิ์ของดอกบัวสวรรค์อบอวลไปทั่วห้อง

เขาไม่รอช้า กลืนเม็ดยาแรกทันที!

พลังความร้อนดั่งสายธารลาวาไหลทะลักลงสู่กระเพาะอาหาร กระจายเข้าสู่เส้นเลือดและกระดูกทุกชิ้น เส้นมานาที่เคยตีบตันขยายกว้างขึ้นกว่าเดิมถึงสามเท่า วงแหวนมานาวงที่สองก่อตัวขึ้นในชั่วพริบตา!

ตึง!

คลื่นลมปราณผลักดันฝุ่นละอองรอบตัวฟุ้งกระจาย ดวงตาของอาร์เธอร์ลุกโชนด้วยเปลวไฟสีฟ้าคราม

"สองวงแหวนมานา... ภายในหนึ่งสัปดาห์! เร็วกว่าชาติก่อนถึงสองเท่า!"

บัดนี้ ขั้นตอนแรกของการล้างแค้นได้ถูกวางไว้อย่างสมบูรณ์แบบแล้ว`,
              },
            },
          },
        ],
      },
    },
  });

  // Story 2: Shadow Monarch: มหายุทธ์เงาจักรพรรดิ (Manga / Webtoon)
  const manga1 = await prisma.story.create({
    data: {
      authorId: author2.id,
      title: "Shadow Monarch: มหายุทธ์เงาจักรพรรดิ",
      slug: "shadow-monarch-webtoon",
      synopsis: "เมื่อเกตมิติมรณะปรากฏขึ้นทั่วโลก มนุษยชาติต้องเผชิญหน้ากับสัตว์อสูร 'เรย์' ฮันเตอร์แรงค์ E ผู้ต่ำต้อยที่สุดได้รับพลังจาก 'ระบบเงาจักรพรรดิ' ในดันเจี้ยนสองชั้นสุดลึกลับ ทุกศัตรูที่เขาสังหารจะกลายมาเป็นกองทัพเงาไร้พ่าย!",
      coverUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
      type: "MANGA",
      category: "Action",
      tags: JSON.stringify(["มังงะ", "เว็บตูน", "แอคชั่น", "ดันเจี้ยน", "ฮันเตอร์", "ระบบ"]),
      contentRating: "ALL_AGES",
      status: "PUBLISHED",
      isFeatured: true,
      viewsCount: 28400,
      ratingAverage: 4.95,
      ratingsCount: 192,
      chapters: {
        create: [
          {
            chapterNumber: 1,
            title: "ตอนที่ 1: ดันเจี้ยนลับและภารกิจมรณะ",
            coinPrice: 0,
            isFree: true,
            status: "PUBLISHED",
            viewsCount: 12000,
            content: {
              create: {
                previewText: "ประตูหินยักษ์เปิดออก เผยให้เห็นรูปปั้นเทพเจ้าขนาดยักษ์ที่กำลังจับตามองผู้บุกรุกทุกคน...",
                imageUrls: JSON.stringify([
                  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=900&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=900&auto=format&fit=crop&q=80",
                ]),
              },
            },
          },
          {
            chapterNumber: 2,
            title: "ตอนที่ 2: จงตื่นขึ้น (Arise) [ตอนพรีเมียม]",
            coinPrice: 6,
            isFree: false,
            status: "PUBLISHED",
            viewsCount: 8400,
            content: {
              create: {
                previewText: "กลุ่มหมอกควันสีม่วงทมิฬลอยขึ้นมาจากซากอสูร เสียงคำสั่งดังกึกก้องในความมืด...",
                imageUrls: JSON.stringify([
                  "https://images.unsplash.com/photo-1563089145-599997674d42?w=900&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=900&auto=format&fit=crop&q=80",
                  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
                ]),
              },
            },
          },
        ],
      },
    },
  });

  // Story 3: สัญญาหมั้นหมายคุณชายปีศาจ (Novel / Romance)
  const novel2 = await prisma.story.create({
    data: {
      authorId: author1.id,
      title: "สัญญาหมั้นหมายคุณชายปีศาจ (Contract with the Demon Lord)",
      slug: "contract-with-the-demon-lord",
      synopsis: "เพื่อกอบกู้ตระกูลขุนนางที่กำลังล้มละลาย 'วิโอเล็ต' บุตรสาวคนโตจำต้องยอมเซ็นสัญญาหมั้นหมายกับดยุกหนุ่มลึกลับผู้มีข่าวลือว่าเป็นจอมปีศาจกระหายเลือด ทว่าเมื่อได้ก้าวเข้าสู่ปราสาทรัตติกาล ความจริงกลับไม่ได้เป็นอย่างที่ใครคิด...",
      coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
      bannerUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
      type: "NOVEL",
      category: "Romance",
      tags: JSON.stringify(["โรแมนติก", "แฟนตาซี", "คุณชายปีศาจ", "สัญญาแต่งงาน", "ดราม่า"]),
      contentRating: "TEEN_13",
      status: "PUBLISHED",
      isFeatured: false,
      viewsCount: 9800,
      ratingAverage: 4.88,
      ratingsCount: 65,
      chapters: {
        create: [
          {
            chapterNumber: 1,
            title: "บทที่ 1: รถม้าสีดำกลางสายฝน",
            coinPrice: 0,
            isFree: true,
            status: "PUBLISHED",
            viewsCount: 3800,
            content: {
              create: {
                previewText: "เสียงล้อรถม้าบดขยี้ก้อนกรวดเปียกชื้นดังสะท้อนก้องในความเงียบ...",
                textContent: `เสียงล้อรถม้าบดขยี้ก้อนกรวดเปียกชื้นดังสะท้อนก้องในความเงียบ วิโอเล็ตนั่งกอดกล่องกำมะหยี่สีแดงไว้แน่นในตัก ด้านในคือสัญญาหมั้นหมายที่ประทับตราครั่งสีทองของตระกูลเดอเรแวน

สายฝนเทกระหน่ำลงมาราวกับฟ้าจะถล่ม หน้าต่างรถม้าขึ้นฝ้าหนาทึบจนมองไม่เห็นทิวทัศน์ภายนอก มีเพียงแสงตะเกียงสลัวที่ส่องกระทบใบหน้าขาวผ่องที่ประดับด้วยดวงตาสีมรกตคู่สวย

"คุณหนูคะ... เรายังกลับใจทันนะคะ" แอนนา สาวใช้คนสนิทที่นั่งตรงข้ามเอ่ยขึ้นด้วยน้ำเสียงสั่นเครือ "ใครๆ ก็รู้ว่าดยุกแห่งน็อคทิสไม่เคยไว้ชีวิตใครที่ก้าวเข้าไปในปราสาทนั้น..."

วิโอเล็ตคลี่ยิ้มบาง แม้ในใจจะหวั่นไหวไม่แพ้กัน "ถ้าฉันหันหลังกลับตอนนี้ พรุ่งนี้เช้าเจ้าหนี้จะมายึดคฤหาสน์ และท่านพ่อจะต้องติดคุกหนี้สิน... ฉันไม่มีทางเลือกอื่นแล้ว แอนนา"

ทันใดนั้น รถม้าก็ค่อยๆ ชะลอความเร็วลง ประตูปราสาทเหล็กดัดสีดำทมิฬขนาดมหึมากำลังเปิดอ้าออกอย่างช้าๆ ราวกับขากรรไกรของสัตว์ร้ายในตำนาน`,
              },
            },
          },
        ],
      },
    },
  });

  // Story 4: เสน่หาเล่ห์ลวงใจ (Mature 18+ for testing Age Gate)
  const matureStory = await prisma.story.create({
    data: {
      authorId: author1.id,
      title: "เล่ห์รักรัตติกาลเสน่หา (Midnight Temptation)",
      slug: "midnight-temptation-18",
      synopsis: "เรื่องราวความสัมพันธ์อันซับซ้อนและเร่าร้อนระหว่างบอดี้การ์ดหนุ่มสายลับกับทายาทสาวตระกูลมาเฟียผู้กุมความลับระดับชาติ [เนื้อหามีฉากโรมานซ์และฉากสำหรับผู้ใหญ่ เหมาะสำหรับผู้อ่านอายุ 18 ปีขึ้นไป]",
      coverUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
      type: "NOVEL",
      category: "Romance",
      tags: JSON.stringify(["18+", "โรแมนติกผู้ใหญ่", "มาเฟีย", "ความลับ", "ดราม่า"]),
      contentRating: "MATURE_18",
      status: "PUBLISHED",
      isFeatured: false,
      viewsCount: 16500,
      ratingAverage: 4.92,
      ratingsCount: 110,
      chapters: {
        create: [
          {
            chapterNumber: 1,
            title: "บทที่ 1: สัมผัสในเงามืด (18+)",
            coinPrice: 0,
            isFree: true,
            status: "PUBLISHED",
            viewsCount: 6200,
            content: {
              create: {
                previewText: "เสียงเพลงแจ๊สนุ่มนวลคลอเคล้าในเพนต์เฮาส์หรูชั้นสูงสุด...",
                textContent: `เสียงเพลงแจ๊สนุ่มนวลคลอเคล้าในเพนต์เฮาส์หรูชั้นสูงสุด แสงไฟนีออนจากมหานครเบื้องล่างสาดส่องเข้ามาทางกระจกบานใหญ่

"คุณรู้ไหมว่าคุณกำลังเล่นกับไฟ..." เสียงทุ้มต่ำกระซิบที่ข้างใบหู พร้อมลมหายใจอุ่นจัดที่ทำให้หัวใจของเธอเต้นระรัว

วิคเตอร์ปลดเนกไทสีดำออกอย่างช้าๆ สายตาคมกริบจ้องลึกเข้าไปในดวงตาของหญิงสาวตรงหน้า`,
              },
            },
          },
        ],
      },
    },
  });

  // 6. Reader Bookmarks & Comments
  await prisma.bookmark.create({
    data: {
      userId: reader.id,
      storyId: novel1.id,
      progressPercent: 50.0,
    },
  });

  const ch1 = await prisma.chapter.findFirst({ where: { storyId: novel1.id, chapterNumber: 1 } });
  if (ch1) {
    await prisma.comment.create({
      data: {
        userId: reader.id,
        storyId: novel1.id,
        chapterId: ch1.id,
        content: "เปิดเรื่องมาน่าติดตามมากครับ! พระเอกแค้นฝังลึกจริงๆ ขอให้แก้แค้นให้สาสม!",
        likes: 12,
      },
    });
  }

  // Reader buys Chapter 3
  const ch3 = await prisma.chapter.findFirst({ where: { storyId: novel1.id, chapterNumber: 3 } });
  if (ch3) {
    await prisma.chapterPurchase.create({
      data: {
        userId: reader.id,
        chapterId: ch3.id,
        pricePaid: ch3.coinPrice,
        coinTypeUsed: "PAID",
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import User from '../src/models/user.model.js';
import Bookmark from '../src/models/bookmarks.js';
import ReadingProgress from '../src/models/reading-progress.model.js';

async function seed() {
  await connectDB();
  console.log('MongoDB connected for seeding Booknest data...');

  // Lấy owner là user admin
  const users = await User.find();
  if (users.length === 0) {
    console.error('No users found in database!');
    process.exit(1);
  }
  const adminUser = users.find(u => u.role === 'ADMIN') || users[0];
  const normalUser = users.find(u => u.role === 'USER') || users[0];

  console.log('Using admin user:', adminUser.name, adminUser._id);

  // Danh sách các cuốn sách thật khớp 100% với ảnh mockup Booknest
  const booksData = [
    {
      title: 'Nhà Giả Kim',
      slug: 'nha-gia-kim',
      author_name: 'Paulo Coelho',
      category: 'ebook',
      publication_year: 1988,
      description: 'Mọi thứ bạn cần đều ở ngay bên trong bạn. Hãy đi theo những dấu hiệu của vũ trụ để tìm thấy kho báu đích thực của cuộc đời mình.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Đắc nhân tâm',
      slug: 'dac-nhan-tam',
      author_name: 'Dale Carnegie',
      category: 'webnovel',
      publication_year: 1936,
      description: 'Nghệ thuật thu phục lòng người và đạt được thành công trong cuộc sống cũng như giao tiếp thường nhật.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Sapiens: Lược sử loài người',
      slug: 'sapiens-luoc-su-loai-nguoi',
      author_name: 'Yuval Noah Harari',
      category: 'Science',
      publication_year: 2011,
      description: 'Hành trình tiến hóa và phát triển đầy kinh ngạc của loài người từ thuở hồng hoang cho đến thời đại hiện đại.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Atomic Habits',
      slug: 'atomic-habits',
      author_name: 'James Clear',
      category: 'webnovel',
      publication_year: 2018,
      description: 'Những thay đổi tí hon mang lại kết quả phi thường. Phương pháp khoa học xây dựng thói quen tốt và từ bỏ thói quen xấu.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Deep Work',
      slug: 'deep-work',
      author_name: 'Cal Newport',
      category: 'webnovel',
      publication_year: 2016,
      description: 'Làm việc chuyên sâu - Quy tắc để tập trung cao độ và gặt hái thành công vượt trội trong một thế giới đầy xao nhãng.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Tư duy nhanh và chậm',
      slug: 'tu-duy-nhanh-va-cham',
      author_name: 'Daniel Kahneman',
      category: 'Science',
      publication_year: 2011,
      description: 'Khám phá hai hệ thống thúc đẩy cách chúng ta suy nghĩ và đưa ra các quyết định quan trọng trong cuộc đời.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Những tấm lòng cao cả',
      slug: 'nhung-tam-long-cao-ca',
      author_name: 'Edmondo De Amicis',
      category: 'ebook',
      publication_year: 1886,
      description: 'Tác phẩm văn học kinh điển của thiếu nhi Ý ghi lại nhật ký về tình thầy trò, tình bè bạn và tình yêu thương con người.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Bí mật của hạnh phúc',
      slug: 'bi-mat-cua-hanh-phuc',
      author_name: 'Dalai Lama',
      category: 'ebook',
      publication_year: 1998,
      description: 'Nghệ thuật sống an vui, bình thản và tìm thấy hạnh phúc chân thực giữa những thăng trầm của đời sống.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Dune - Xứ cát',
      slug: 'dune-xu-cat',
      author_name: 'Frank Herbert',
      category: 'comic',
      publication_year: 1965,
      description: 'Kiệt tác khoa học viễn tưởng vĩ đại bậc nhất mọi thời đại về cuộc chiến sinh tồn trên hành tinh cát Arrakis.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Chiến binh Cầu vồng',
      slug: 'chien-binh-cau-vong',
      author_name: 'Andrea Hirata',
      category: 'ebook',
      publication_year: 2005,
      description: 'Câu chuyện cảm động về tinh thần vượt khó và khao khát học tập của mười đứa trẻ trên hòn đảo nghèo Belitong.',
      cover_url: '',
      access_level: 'free',
      status: 'published',
      owner: adminUser._id,
    },
    {
      title: 'Đọc vị bất kỳ ai', slug: 'doc-vi-bat-ky-ai', author_name: 'David J. Lieberman', category: 'ebook',
      genre: 'tam_ly_hoc', publication_year: 2007,
      description: 'Sách phổ biến kiến thức về giao tiếp và cách nhận biết tín hiệu trong tương tác giữa người với người.',
      cover_url: '', access_level: 'free', status: 'published', owner: adminUser._id,
    },
    {
      title: 'Đọc vị khách hàng', slug: 'doc-vi-khach-hang', author_name: 'Michael Wilkinson', category: 'ebook',
      genre: 'kinh_doanh',
      description: 'Giới thiệu các phong cách giao tiếp và cách điều chỉnh tư vấn bán hàng theo nhu cầu khách hàng.',
      cover_url: '', access_level: 'free', status: 'published', owner: adminUser._id,
    },
    {
      title: 'Hẹn bạn trên đỉnh thành công', slug: 'hen-ban-tren-dinh-thanh-cong', author_name: 'Zig Ziglar', category: 'ebook',
      genre: 'phat_trien_ban_than', publication_year: 1998,
      description: 'Tác phẩm truyền cảm hứng về mục tiêu, thái độ tích cực và phát triển năng lực cá nhân.',
      cover_url: '', access_level: 'free', status: 'published', owner: adminUser._id,
    },
    {
      title: 'Trump: Think Big and Kick Ass', slug: 'trump-think-big-and-kick-ass', author_name: 'Donald J. Trump, Bill Zanker', category: 'ebook',
      genre: 'kinh_doanh', publication_year: 2007,
      description: 'Donald Trump chia sẻ quan điểm về kinh doanh, đàm phán và theo đuổi mục tiêu lớn.',
      cover_url: '', access_level: 'free', status: 'published', owner: adminUser._id,
    },
    {
      title: 'Differentiate or Die', slug: 'differentiate-or-die', author_name: 'Jack Trout, Steve Rivkin', category: 'ebook',
      genre: 'kinh_doanh', publication_year: 2000,
      description: 'Sách về định vị thương hiệu và tạo khác biệt trong thị trường cạnh tranh.',
      cover_url: '', access_level: 'free', status: 'published', owner: adminUser._id,
    },
    {
      title: 'Tuổi trẻ đáng giá bao nhiêu', slug: 'tuoi-tre-dang-gia-bao-nhieu', author_name: 'Rosie Nguyễn', category: 'ebook',
      genre: 'phat_trien_ban_than', publication_year: 2016,
      description: 'Những chia sẻ về học tập, trải nghiệm và định hướng phát triển bản thân của người trẻ.',
      cover_url: '', access_level: 'free', status: 'published', owner: adminUser._id,
    }
  ];

  const savedBooks = [];
  for (const b of booksData) {
    let existing = await Book.findOne({ slug: b.slug });
    if (!existing) {
      existing = await Book.create(b);
      console.log('Created book:', existing.title);
    } else {
      existing.title = b.title;
      existing.author_name = b.author_name;
      existing.genre = b.genre || existing.genre;
      if (b.cover_url) existing.cover_url = b.cover_url;
      existing.description = b.description;
      await existing.save();
      console.log('Updated book:', existing.title);
    }
    savedBooks.push(existing);
  }

  // Seed chapters cho "Nhà Giả Kim"
  const nhaGiaKim = savedBooks.find(b => b.slug === 'nha-gia-kim');
  if (nhaGiaKim) {
    const chaptersData = [
      {
        chapter_number: 1,
        title: 'Giấc mơ của cậu bé',
        content: `Khi cậu bé chăn cừu Santiago thức dậy vào buổi sớm hôm đó, cậu biết mình đã có một giấc mơ rất đặc biệt. Trong giấc mơ, cậu thấy mình đứng trước một ngôi mộ cổ ở Ai Cập, và có một giọng nói vang lên: "Hãy đi đến thế nơi đặt kho báu."\n\nCậu không hiểu rõ ý nghĩa của giấc mơ, nhưng trong lòng cậu cảm thấy đó là một dấu hiệu quan trọng. Santiago quyết định lên đường, rời bỏ quê hương và bắt đầu hành trình tìm kiếm kho báu của mình.\n\nCậu biết rằng, trên con đường này, cậu sẽ phải đối mặt với nhiều thử thách, nhưng cậu cũng tin rằng, nếu theo đuổi giấc mơ, thì mọi thứ đều có thể xảy ra.`,
      },
      {
        chapter_number: 2,
        title: 'Người bí ẩn',
        content: `Santiago gặp một ông lão tự xưng là vua xứ Salem. Ông nói với cậu về Tâm linh Vũ trụ và sứ mệnh của mỗi con người trong cuộc đời này.\n\n"Khi bạn thực sự khao khát một điều gì đó, cả vũ trụ sẽ hợp lực lại để giúp bạn đạt được nó," ông lão mỉm cười nói. Cậu bé lắng nghe từng lời như khắc sâu vào tâm trí.`,
      },
      {
        chapter_number: 3,
        title: 'Sa mạc',
        content: `Santiago đặt chân đến châu Phi. Một chân trời mới lạ mở ra trước mắt cậu với cát vàng trải dài bất tận.\n\nSa mạc mênh mông đòi hỏi sự kiên nhẫn và lòng dũng cảm. Cậu bắt đầu học cách lắng nghe tiếng thì thầm của gió và những dấu hiệu huyền bí trên cát.`,
      },
      {
        chapter_number: 4,
        title: 'Nhà giả kim',
        content: `Giữa ốc đảo tĩnh lặng, Santiago gặp Nhà Giả Kim - người có thể biến kim loại tầm thường thành vàng ròng và thấu hiểu bí mật vĩ đại nhất của sự sống.\n\nNgười ấy nhìn thẳng vào mắt cậu bé: "Trái tim con ở đâu, kho báu của con cũng ở đó."`,
      },
      {
        chapter_number: 5,
        title: 'Ốc đảo',
        content: `Tại ốc đảo ngập tràn cây chà là, Santiago gặp Fatima - cô gái sa mạc với đôi mắt trong veo như nguồn nước mát lành. Tình yêu đích thực không ngăn cản người ta theo đuổi Vận Mệnh của mình, mà tiếp thêm cho họ đôi cánh để bay xa.`,
      },
      {
        chapter_number: 6,
        title: 'Cơn bão',
        content: `Bị bao vây bởi quân thù giữa sa mạc hung dữ, Santiago phải học cách hòa làm một với sa mạc, với gió và với mặt trời để chứng minh quyền năng của tâm linh con người. Cơn bão cát cuộn xoáy như thử thách cuối cùng trước cánh cửa định mệnh.`,
      },
      {
        chapter_number: 7,
        title: 'Pyramid',
        content: `Trước mắt Santiago, những Kim Tự Tháp hùng vĩ của Ai Cập sừng sững vươn lên giữa trời xanh biếc. Cậu quỳ xuống cát, nước mắt lăn dài vì xúc động. Nơi đây chính là đích đến của giấc mơ thuở nào.`,
      },
      {
        chapter_number: 8,
        title: 'Trở về',
        content: `Bí mật cuối cùng được hé lộ: Kho báu thực sự đã luôn nằm ở nơi cậu bắt đầu - dưới gốc cây dâu dại ở nhà thờ hoang phế quê hương. Santiago mỉm cười trong gió, chuẩn bị hành trang trở về với tình yêu và cuộc sống trọn vẹn.`,
      }
    ];

    for (const c of chaptersData) {
      let existingChap = await Chapter.findOne({ book_id: nhaGiaKim._id, chapter_number: c.chapter_number });
      if (!existingChap) {
        await Chapter.create({
          book_id: nhaGiaKim._id,
          title: c.title,
          chapter_number: c.chapter_number,
          content: c.content,
          access_level: 'free',
          published_at: new Date()
        });
        console.log('Created chapter:', c.chapter_number, c.title);
      } else {
        existingChap.title = c.title;
        existingChap.content = c.content;
        await existingChap.save();
        console.log('Updated chapter:', c.chapter_number, c.title);
      }
    }
  }

  // Seed Chapters mẫu cho "Đắc nhân tâm" và "Sapiens"
  const dacNhanTam = savedBooks.find(b => b.slug === 'dac-nhan-tam');
  if (dacNhanTam) {
    const existingDac = await Chapter.findOne({ book_id: dacNhanTam._id, chapter_number: 1 });
    if (!existingDac) {
      await Chapter.create({
        book_id: dacNhanTam._id,
        chapter_number: 1,
        title: 'Nếu muốn lấy mật, đừng phá tổ ong',
        content: 'Chỉ trích là vô ích vì nó đặt đối phương vào thế phòng thủ và buộc họ phải tìm lý lẽ tự bào chữa. Thay vì lên án, hãy cố gắng hiểu tại sao họ lại hành động như vậy.',
        access_level: 'free',
        published_at: new Date()
      });
      console.log('Created chapter 1 for Đắc nhân tâm');
    }
  }

  // Seed Bookmarks & ReadingProgress cho cả hai users để vào tủ sách / yêu thích luôn có dữ liệu thật
  const ch1NhaGiaKim = await Chapter.findOne({ book_id: nhaGiaKim._id, chapter_number: 1 });

  for (const u of [adminUser, normalUser]) {
    // Bookmark
    if (ch1NhaGiaKim) {
      await Bookmark.findOneAndUpdate(
        { user: u._id, book: nhaGiaKim._id },
        { user: u._id, book: nhaGiaKim._id, chapter: ch1NhaGiaKim._id },
        { upsert: true, new: true }
      );
    }
    if (dacNhanTam) {
      const chDac = await Chapter.findOne({ book_id: dacNhanTam._id, chapter_number: 1 }) || ch1NhaGiaKim;
      await Bookmark.findOneAndUpdate(
        { user: u._id, book: dacNhanTam._id },
        { user: u._id, book: dacNhanTam._id, chapter: chDac?._id || ch1NhaGiaKim._id },
        { upsert: true, new: true }
      );
    }

    const sapiens = savedBooks.find(b => b.slug === 'sapiens-luoc-su-loai-nguoi');
    if (sapiens && ch1NhaGiaKim) {
      await Bookmark.findOneAndUpdate(
        { user: u._id, book: sapiens._id },
        { user: u._id, book: sapiens._id, chapter: ch1NhaGiaKim._id },
        { upsert: true, new: true }
      );
    }

    const atomic = savedBooks.find(b => b.slug === 'atomic-habits');
    if (atomic && ch1NhaGiaKim) {
      await Bookmark.findOneAndUpdate(
        { user: u._id, book: atomic._id },
        { user: u._id, book: atomic._id, chapter: ch1NhaGiaKim._id },
        { upsert: true, new: true }
      );
    }

    // ReadingProgress
    await ReadingProgress.findOneAndUpdate(
      { user: u._id, book: nhaGiaKim._id },
      { user: u._id, book: nhaGiaKim._id, total_chapter_reads: 7, chapters_since_ad: 1 },
      { upsert: true, new: true }
    );
    if (dacNhanTam) {
      await ReadingProgress.findOneAndUpdate(
        { user: u._id, book: dacNhanTam._id },
        { user: u._id, book: dacNhanTam._id, total_chapter_reads: 3, chapters_since_ad: 0 },
        { upsert: true, new: true }
      );
    }
    if (sapiens) {
      await ReadingProgress.findOneAndUpdate(
        { user: u._id, book: sapiens._id },
        { user: u._id, book: sapiens._id, total_chapter_reads: 5, chapters_since_ad: 2 },
        { upsert: true, new: true }
      );
    }
  }

  console.log('Seeding Booknest data completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

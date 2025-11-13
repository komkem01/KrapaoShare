# KrapaoShare - แบ่งปันอาหาร สร้างสรรค์ชุมชน

แพลตฟอร์มแบ่งปันอาหารและวัตถุดิบสำหรับชุมชน เพื่อลดการสูญเสียอาหาร สร้างความสัมพันธ์ และช่วยเหลือซึ่งกันและกัน

## เทคโนโลยีที่ใช้

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom React components
- **Font**: Geist Sans & Geist Mono

## การติดตั้งและรัน

1. **Clone repository**
   ```bash
   git clone https://github.com/komkem01/KrapaoShare.git
   cd KrapaoShare
   ```

2. **ติดตั้ง dependencies**
   ```bash
   npm install
   ```

3. **รันในโหมด development**
   ```bash
   npm run dev
   ```

4. **เปิดเว็บไซต์**
   เปิด [http://localhost:3000](http://localhost:3000) ใน browser

## โครงสร้างโปรเจกต์

```
src/
├── app/                    # App Router หน้าต่างๆ
│   ├── auth/              # หน้าการเข้าสู่ระบบ
│   │   ├── login/         # หน้าเข้าสู่ระบบ
│   │   └── signup/        # หน้าสมัครสมาชิก
│   ├── globals.css        # CSS หลัก
│   ├── layout.tsx         # Layout หลัก
│   └── page.tsx           # หน้าแรก
├── components/            # React Components
│   └── auth/              # Components สำหรับการเข้าสู่ระบบ
│       ├── AuthLayout.tsx # Layout สำหรับหน้า auth
│       ├── GoogleButton.tsx # ปุ่ม Google OAuth
│       ├── InputField.tsx # Input field component
│       └── PrimaryButton.tsx # Primary button component
└── ...
```

## Features ที่มีอยู่

### 🏠 หน้าแรก (Homepage)
- Hero section พร้อมข้อความต้อนรับ
- Features grid แสดงฟีเจอร์หลัก
- Call-to-action sections
- Responsive design

### 🔐 ระบบการเข้าสู่ระบบ (Authentication)
- หน้าเข้าสู่ระบบ (`/auth/login`)
- หน้าสมัครสมาชิก (`/auth/signup`)
- Google OAuth integration (UI พร้อม)
- Form validation
- Responsive design
- Dark mode support

## การออกแบบ UI/UX

### Color Palette
- **เขียวเข้ม**: `#1A5319` - ข้อความหลัก, ปุ่ม CTA
- **เขียวกลาง**: `#4CAF50` - สถานะ active, เส้นขอบ
- **เขียวอ่อน**: `#E8F5E9` - พื้นหลัง, hover state
- **เทาอ่อน**: `#F0F0F0` - พื้นหลังทั่วไป
- **เทาเข้ม**: `#333333` - ข้อความรอง
- **ขาว**: `#FFFFFF` - พื้นหลังหลัก

### Design Principles
- **Minimalist & Modern**: เน้นความเรียบง่าย สะอาดตา
- **Responsive**: รองรับทั้ง Mobile และ Desktop
- **Accessible**: ใช้งานง่าย เข้าถึงได้
- **Consistent**: สีสัน และ typography ที่สอดคล้อง

## สคริปต์ที่ใช้งาน

- `npm run dev` - รัน development server
- `npm run build` - สร้าง production build
- `npm run start` - รัน production server
- `npm run lint` - ตรวจสอบ code quality

## การพัฒนาต่อ

### Todo List
- [ ] เชื่อมต่อ Google OAuth
- [ ] สร้าง API endpoints
- [ ] เพิ่ม database integration
- [ ] สร้างหน้า dashboard
- [ ] เพิ่มระบบแบ่งปันอาหาร
- [ ] เพิ่มระบบ notification
- [ ] เพิ่ม mobile app

### Contributing
1. Fork repository
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไป branch
5. สร้าง Pull Request

## ใบอนุญาต

MIT License - ดูไฟล์ LICENSE สำหรับรายละเอียด

## ติดต่อ

- **Repository**: [KrapaoShare](https://github.com/komkem01/KrapaoShare)
- **Issues**: [GitHub Issues](https://github.com/komkem01/KrapaoShare/issues)

---

**KrapaoShare** - แบ่งปันอาหาร สร้างสรรค์ชุมชน 🍃

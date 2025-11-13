export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-gray-900 font-bold text-lg">K</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                KrapaoShare
              </h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm">
                หน้าแรก
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm">
                คุณสมบัติ
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors text-sm">
                เกี่ยวกับ
              </a>
            </nav>
            <a 
              href="/auth/login"
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              เข้าสู่ระบบ
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h2 className="text-5xl md:text-6xl font-light text-gray-900 dark:text-white mb-8 leading-tight">
            จัดการเงิน
            <span className="block font-normal">อย่างง่าย</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            บันทึกรายรับ-รายจ่าย แบ่งบิลกับเพื่อน และตั้งเป้าหมายการออม
            <br className="sm:block hidden" />
            ทุกอย่างในที่เดียว แบบเรียบง่าย
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-20">
            <a 
              href="/auth/signup"
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium text-center"
            >
              เริ่มใช้งาน
            </a>
            <button className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium">
              ดูตัวอย่าง
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
              <span className="text-lg">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              บันทึกรายรับ-จ่าย
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              บันทึกรายรับ-รายจ่ายประจำวัน จัดหมวดหมู่ และติดตามความเคลื่อนไหวของเงิน
            </p>
          </div>

          <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
              <span className="text-lg">🧾</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              แบ่งบิลกับเพื่อน
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              แบ่งค่าใช้จ่ายกับเพื่อนได้ง่ายๆ ติดตามหนี้สิน และเคลียร์บิลอย่างโปร่งใส
            </p>
          </div>

          <div className="p-8 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
              <span className="text-lg">🎯</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              เป้าหมายการออม
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              ตั้งเป้าหมายการออม ติดตามความคืบหน้า และบรรลุเป้าหมายทางการเงิน
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-800 mt-32 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-gray-900 font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">KrapaoShare</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
              แอปจัดการเงินแบบมินิมอลสำหรับคนรุ่นใหม่
            </p>
            
            <div className="flex justify-center space-x-8 mb-8">
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm">
                คุณสมบัติ
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm">
                ช่วยเหลือ
              </a>
              <a href="#" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm">
                ความเป็นส่วนตัว
              </a>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <p className="text-gray-500 dark:text-gray-500 text-xs">
                &copy; 2025 KrapaoShare. สงวนลิขสิทธิ์.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
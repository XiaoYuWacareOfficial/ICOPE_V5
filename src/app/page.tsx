import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-blue-900" style={{color:'#ff8800'}}>ICOPE 長者功能評估問卷</h1>
      <p className="mb-8 text-gray-700 text-center max-w-xl">
        歡迎使用本問卷系統，請點擊下方按鈕開始填寫服務對象基本資料與功能評估量表。
      </p>
      <Link href="/form">
        <button className="px-8 py-3 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-800 transition font-semibold text-lg" style={{background:'#ff8800'}}>
          開始填寫問卷
        </button>
      </Link>
    </div>
  );
}

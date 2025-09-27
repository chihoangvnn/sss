import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-4">Không tìm thấy trang</h2>
      <p className="text-gray-600 mb-4">Trang bạn đang tìm không tồn tại.</p>
      <Link 
        href="/"
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
      >
        Về trang chủ
      </Link>
    </div>
  )
}